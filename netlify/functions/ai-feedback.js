import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { sections } = body;
  if (!Array.isArray(sections)) {
    return new Response(JSON.stringify({ error: 'sections must be an array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const results = {};
  for (const { sectionName, selected, recSelected } of sections) {
    if (!selected?.length && !recSelected?.length) continue;
    const prompt = `You are an educational consultant. For the teaching category "${sectionName}", the observer noted: ${selected.join('; ')}. Recommended strategies: ${recSelected.join('; ')}. Provide a brief 2-3 sentence constructive analysis.`;
    const result = await model.generateContent(prompt);
    results[sectionName] = result.response.text();
  }

  return new Response(JSON.stringify({ feedbacks: results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

