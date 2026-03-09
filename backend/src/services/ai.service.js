const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama3-8b-8192';

async function groq(messages, maxTokens = 1024) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function explainHomework(question, context) {
  const content = await groq([
    { role: 'system', content: 'You are a helpful tutor. Respond in JSON with keys: explanation (string), steps (array of strings), hint (string).' },
    { role: 'user', content: `Question: ${question}\nContext: ${context || 'none'}\nRespond only with valid JSON.` }
  ]);
  try {
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch {
    return { explanation: content, steps: [content], hint: 'Review your notes!' };
  }
}

async function generateFlashcardsFromNotes(notes, count = 10) {
  const content = await groq([
    { role: 'system', content: `Generate ${count} flashcards from the notes. Respond in JSON as an array of objects with keys: question, answer.` },
    { role: 'user', content: `Notes: ${notes}\nRespond only with valid JSON array.` }
  ]);
  try {
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    return Array.isArray(parsed) ? parsed : parsed.flashcards || [];
  } catch {
    return [{ question: 'What is the main topic?', answer: 'Review your notes.' }];
  }
}

async function generateQuizQuestions(topic, difficulty, count = 5) {
  const content = await groq([
    { role: 'system', content: `Generate ${count} multiple choice questions about the topic at ${difficulty} difficulty. Respond in JSON as array of objects with keys: question, options (array of 4 strings), correct (the correct option string), explanation.` },
    { role: 'user', content: `Topic: ${topic}\nRespond only with valid JSON array.` }
  ]);
  try {
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch {
    return [];
  }
}

async function analyzeRecall(topic, topicSummary, userResponse) {
  const content = await groq([
    { role: 'system', content: 'You are a study coach. Analyze the student recall response. Respond in JSON with keys: score (0-1 float), feedback (string), correct (array of strings of what they got right), missed (array of strings of what they missed), encouragement (short motivational string).' },
    { role: 'user', content: `Topic: ${topic}\nOriginal material: ${topicSummary}\nStudent wrote: ${userResponse}\nRespond only with valid JSON.` }
  ]);
  try {
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch {
    return { score: 0.5, feedback: 'Good effort!', correct: [], missed: [], encouragement: 'Keep going!' };
  }
}

async function generateStudyPlan(subjects, dailyHours) {
  const content = await groq([
    { role: 'system', content: 'You are a study planner. Generate a study plan for the next 14 days. Respond in JSON as an array of objects with keys: subject, date (YYYY-MM-DD), duration (minutes as number), task (string description).' },
    { role: 'user', content: `Subjects with exam dates: ${JSON.stringify(subjects)}\nDaily available hours: ${dailyHours}\nToday is ${new Date().toISOString().split('T')[0]}\nRespond only with valid JSON array.` }
  ]);
  try {
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    return Array.isArray(parsed) ? parsed : parsed.plan || [];
  } catch {
    return [];
  }
}

module.exports = { explainHomework, generateFlashcardsFromNotes, generateQuizQuestions, analyzeRecall, generateStudyPlan };
