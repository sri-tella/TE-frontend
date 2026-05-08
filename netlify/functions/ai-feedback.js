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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const results = {};
    for (const { sectionName, selected, recSelected } of sections) {
      if (!selected?.length && !recSelected?.length) continue;
      const prompt = `You are an educational consultant. For the teaching category "${sectionName}", the observer noted: ${selected.join('; ')}. Recommended strategies: ${recSelected.join('; ')}. Provide a brief 2-3 sentence constructive analysis.`;
      const result = await model.generateContent(prompt);
      results[sectionName] = result.response.text();
    }

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
