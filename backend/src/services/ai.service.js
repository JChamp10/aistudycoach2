const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

function groq(messages, maxTokens = 1024) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens });
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
          const content = parsed.choices?.[0]?.message?.content || '';
          console.log('Groq raw response:', content);
          resolve(content);
        } catch (e) {
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
    // Strip markdown code blocks
    let cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    // Find first { or [ and last } or ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace === -1) start = firstBracket;
    else if (firstBracket === -1) start = firstBrace;
    else start = Math.min(firstBrace, firstBracket);
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.slice(start, end + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('JSON parse failed:', e.message);
    return null;
  }
}

async function explainHomework(question, context) {
  const content = await groq([
    { role: 'system', content: 'You are a helpful tutor. Give the direct answer first, then explain step by step how to get to that answer. Respond ONLY with valid JSON. No markdown, no extra text. JSON format: {"explanation": "Direct answer here, then brief overview", "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."], "hint": "A tip to remember this in future"}' },
    { role: 'user', content: `Question: ${question}\nContext: ${context || 'none'}` }
  ]);
  const parsed = parseJSON(content);
  if (parsed && parsed.explanation) return parsed;
  return { explanation: content || 'Could not generate explanation.', steps: ['Review the question carefully.'], hint: 'Try breaking the problem into smaller parts.' };
}
async function generateFlashcardsFromNotes(notes, count = 10) {
  const content = await groq([
    { role: 'system', content: `You are a flashcard generator. Respond ONLY with a valid JSON array. No markdown, no extra text. Format: [{"question": "string", "answer": "string"}]. Generate exactly ${count} flashcards.` },
    { role: 'user', content: `Notes: ${notes}` }
  ]);
  const parsed = parseJSON(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.flashcards) return parsed.flashcards;
  return [{ question: 'What is the main topic?', answer: 'Review your notes.' }];
}

async function generateQuizQuestions(topic, difficulty, count = 5) {
  const content = await groq([
    { role: 'system', content: `You are a quiz generator. Respond ONLY with a valid JSON array. No markdown, no extra text. Format: [{"question": "string", "options": ["A", "B", "C", "D"], "correct": "A", "explanation": "string"}]. Generate exactly ${count} questions at ${difficulty} difficulty.` },
    { role: 'user', content: `Topic: ${topic}` }
  ]);
  const parsed = parseJSON(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.questions) return parsed.questions;
  return [];
}

async function analyzeRecall(topic, topicSummary, userResponse) {
  const content = await groq([
    { role: 'system', content: 'You are a study coach. Respond ONLY with valid JSON. No markdown, no extra text. Format: {"score": 0.8, "feedback": "string", "correct": ["string"], "missed": ["string"], "encouragement": "string"}' },
    { role: 'user', content: `Topic: ${topic}\nOriginal material: ${topicSummary}\nStudent wrote: ${userResponse}` }
  ]);
  const parsed = parseJSON(content);
  if (parsed) return parsed;
  return { score: 0.5, feedback: 'Good effort!', correct: [], missed: [], encouragement: 'Keep going!' };
}

async function generateStudyPlan(subjects, dailyHours) {
  const content = await groq([
    { role: 'system', content: 'You are a study planner. Respond ONLY with a valid JSON array. No markdown, no extra text. Format: [{"subject": "string", "date": "YYYY-MM-DD", "duration": 60, "task": "string"}]' },
    { role: 'user', content: `Subjects with exam dates: ${JSON.stringify(subjects)}\nDaily available hours: ${dailyHours}\nToday is ${new Date().toISOString().split('T')[0]}. Generate a 14 day plan.` }
  ]);
  const parsed = parseJSON(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.plan) return parsed.plan;
  return [];
}

module.exports = { explainHomework, generateFlashcardsFromNotes, generateQuizQuestions, analyzeRecall, generateStudyPlan };
