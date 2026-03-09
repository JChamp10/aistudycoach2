const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama3-8b-8192';

function groq(messages, maxTokens = 1024) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || '');
        } catch {
          reject(new Error('Failed to parse Groq response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

async function explainHomework(question, context) {
  const content = await groq([
    { role: 'system', content: 'You are a helpful tutor. Respond ONLY with valid JSON, no extra text. JSON keys: explanation (string), steps (array of strings), hint (string).' },
    { role: 'user', content: `Question: ${question}\nContext: ${context || 'none'}` }
  ]);
  const parsed = parseJSON(content);
  if (parsed) return parsed;
  return { explanation: content, steps: [content], hint: 'Review your notes!' };
}

async function generateFlashcardsFromNotes(notes, count = 10) {
  const content = await groq([
    { role: 'system', content: `You are a flashcard generator. Respond ONLY with a valid JSON array of ${count} objects, each with keys: question (string), answer (string). No extra text.` },
    { role: 'user', content: `Notes: ${notes}` }
  ]);
  const parsed = parseJSON(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.flashcards) return parsed.flashcards;
  return [{ question: 'What is the main topic?', answer: 'Review your notes.' }];
}

async function generateQuizQuestions(topic, difficulty, count = 5) {
  const content = await groq([
    { role: 'system', content: `You are a quiz generator. Respond ONLY with a valid JSON array of ${count} objects, each with keys: question (string), options (array of 4 strings), correct (string, must match one of the options exactly), explanation (string). No extra text.` },
    { role: 'user', content: `Topic: ${topic}, Difficulty: ${difficulty}` }
  ]);
  const parsed = parseJSON(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.questions) return parsed.questions;
  return [];
}

async function analyzeRecall(topic, topicSummary, userResponse) {
  const content = await groq([
    { role: 'system', content: 'You are a study coach. Respond ONLY with valid JSON, no extra text. JSON keys: score (number between 0 and 1), feedback (string), correct (array of strings), missed (array of strings), encouragement (string).' },
    { role: 'user', content: `Topic: ${topic}\nOriginal material: ${topicSummary}\nStudent wrote: ${userResponse}` }
  ]);
  const parsed = parseJSON(content);
  if (parsed) return parsed;
  return { score: 0.5, feedback: 'Good effort!', correct: [], missed: [], encouragement: 'Keep going!' };
}

async function generateStudyPlan(subjects, dailyHours) {
  const content = await groq([
    { role: 'system', content: 'You are a study planner. Respond ONLY with a valid JSON array of objects, each with keys: subject (string), date (YYYY-MM-DD string), duration (number in minutes), task (string). No extra text.' },
    { role: 'user', content: `Subjects with exam dates: ${JSON.stringify(subjects)}\nDaily available hours: ${dailyHours}\nToday is ${new Date().toISOString().split('T')[0]}. Generate a 14 day plan.` }
  ]);
  const parsed = parseJSON(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.plan) return parsed.plan;
  return [];
}

module.exports = { explainHomework, generateFlashcardsFromNotes, generateQuizQuestions, analyzeRecall, generateStudyPlan };
