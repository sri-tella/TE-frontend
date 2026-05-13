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

  const generateWithRetry = async (model, prompt, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result;
      } catch (err) {
        if (attempt < retries - 1 && err.status === 503) {
          await new Promise(res => setTimeout(res, 1000 * 2 ** attempt));
          continue;
        }
        throw err;
      }
    }
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const activeSections = sections.filter(({ selected, recSelected }) => selected?.length || recSelected?.length);

    const entries = await Promise.all(
      activeSections.map(async ({ sectionName, selected, recSelected }) => {
        const prompt = `You are an educational consultant. For the teaching category "${sectionName}", the observer noted: ${selected.join('; ')}. Recommended strategies: ${recSelected.join('; ')}. Provide a brief 2-3 sentence constructive analysis.`;
        console.log(`[ai-feedback] section="${sectionName}" prompt_length=${prompt.length}`);
        const result = await generateWithRetry(model, prompt);
        return [sectionName, result.response.text()];
      })
    );

    const results = Object.fromEntries(entries);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbacks: results }),
    };
  } catch (err) {
    console.error('ai-feedback error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
