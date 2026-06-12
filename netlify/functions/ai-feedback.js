const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { sections } = body;
  if (!Array.isArray(sections)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'sections must be an array' }) };
  }

  // Only sections with at least one selected item
  const activeSections = sections.filter(
    ({ selected, recSelected }) => selected?.length || recSelected?.length
  );

  if (activeSections.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbacks: {}, obsAnalysis: {}, recAnalysis: {} }),
    };
  }

  // Format a single item: "Description [Note: observer comment]" or just "Description"
  const formatItem = (item) => {
    const note = item.note?.trim();
    return note ? `${item.description} [Note: ${note}]` : item.description;
  };

  // Build ONE combined prompt covering all three analyses per section
  const sectionBlocks = activeSections
    .map(({ sectionName, selected, recSelected }) => {
      const obs = (selected || []).map(formatItem);
      const recs = (recSelected || []).map(formatItem);
      return [
        `### ${sectionName}`,
        `Observations: ${obs.length ? obs.join('; ') : 'none'}`,
        `Recommendations: ${recs.length ? recs.join('; ') : 'none'}`,
      ].join('\n');
    })
    .join('\n\n');

  const sectionNames = activeSections.map(s => s.sectionName);

  const prompt = `You are an educational consultant writing a formal peer observation report. For each teaching category below, provide three separate analyses:

1. "main" — A brief 2-3 sentence overall analysis combining observations and recommendations.
2. "obsAI" — A 1-2 sentence analysis focused specifically on what was observed (and any observer notes). Omit if no observations.
3. "recAI" — A 1-2 sentence analysis focused specifically on the recommended strategies (and any observer notes). Omit if no recommendations.

Categories:

${sectionBlocks}

Return ONLY a valid JSON object. Top-level keys are section names. Each value is an object with "main", "obsAI", and "recAI" string fields (omit a field if there is no data for it). No markdown, no code fences — pure JSON only.

Example shape:
{"Introduction": {"main": "...", "obsAI": "...", "recAI": "..."}, "Organization": {"main": "..."}}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const RETRYABLE = new Set([429, 503]);

  const callWithRetry = async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await model.generateContent(prompt);
      } catch (err) {
        const status = err.status ?? err.statusCode;
        if (attempt < retries - 1 && RETRYABLE.has(status)) {
          const delay = 1000 * Math.pow(2, attempt);
          console.log(`[ai-feedback] retry ${attempt + 1} after ${delay}ms (status=${status})`);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw err;
      }
    }
  };

  try {
    const result = await callWithRetry();
    let rawText = result.response.text().trim();

    // Strip markdown code fences if present
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) rawText = fenceMatch[1].trim();

    // Strip anything before the first '{' and after the last '}'
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1) rawText = rawText.slice(start, end + 1);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('[ai-feedback] JSON parse failed, using regex fallback:', parseErr.message);
      // Fallback: try to extract at least "main" per section via regex
      parsed = {};
      for (const name of sectionNames) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = rawText.match(new RegExp(`"${escaped}"\\s*:\\s*\\{([^}]+)\\}`));
        if (match) {
          const inner = match[1];
          const mainMatch = inner.match(/"main"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          parsed[name] = { main: mainMatch ? mainMatch[1].replace(/\\n/g, ' ') : '' };
        }
      }
    }

    // Split into three flat maps for the frontend
    const feedbacks = {};
    const obsAnalysis = {};
    const recAnalysis = {};

    for (const [name, val] of Object.entries(parsed)) {
      if (typeof val === 'string') {
        // Backward compat if Gemini ignores instructions and returns a string
        feedbacks[name] = val;
      } else if (val && typeof val === 'object') {
        if (val.main)   feedbacks[name]    = val.main;
        if (val.obsAI)  obsAnalysis[name]  = val.obsAI;
        if (val.recAI)  recAnalysis[name]  = val.recAI;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbacks, obsAnalysis, recAnalysis }),
    };
  } catch (err) {
    console.error('[ai-feedback] fatal error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
