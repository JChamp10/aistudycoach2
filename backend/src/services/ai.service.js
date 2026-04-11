const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

function groq(messages, maxTokens = 1024, modelOverride = null) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: modelOverride || MODEL, messages, max_tokens: maxTokens });
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
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace === -1) start = firstBracket;
    else if (firstBracket === -1) start = firstBrace;
    else start = Math.min(firstBrace, firstBracket);
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

async function explainHomework(question, subject, conversationHistory) {
  const systemPrompt = {
    role: 'system',
    content: `You are an expert tutor helping a student with their homework. Give the direct answer first, then explain step by step. Be clear and educational.${subject ? ` Subject: ${subject}` : ''}`,
  };

  let messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    // Keep only the last 10 messages for a rolling context window
    const recentHistory = conversationHistory.slice(-10);
    messages = [systemPrompt, ...recentHistory];
  } else {
    messages = [systemPrompt, { role: 'user', content: question }];
  }

  // Adjust maxTokens dynamically based on history length (more history -> shorter response to fit limits)
  const dynamicMaxTokens = messages.length > 6 ? 1000 : 1500;

  const content = await groq(messages, dynamicMaxTokens);
  return {
    explanation: content || 'Could not generate explanation.',
    steps: [],
    hint: '',
  };
}

async function generateFlashcardsFromNotes(notes, count = 10) {
  const countPrompt = count > 0 
    ? `Generate exactly ${count} flashcards.` 
    : "Generate as many high-quality flashcards as you think are necessary to thoroughly cover the material (aim for a balance between detail and brevity, max 30 cards).";

  const content = await groq([
    { role: 'system', content: `You are a flashcard generator. Respond ONLY with a valid JSON array. No markdown, no extra text. Format: [{"question": "string", "answer": "string"}]. Ensure each flashcard is unique and covers a distinct part of the material. ${countPrompt}` },
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

async function explainHomeworkFromImage(base64Image, question, subject) {
  const content = await groq([{
    role: 'user',
    content: [
      { type: 'text', text: `Subject: ${subject || 'General'}. Question: ${question || 'Explain and solve the problem in this image.'} Please step by step explain the homework problem shown.` },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
    ]
  }], 1500, 'llama-3.2-90b-vision-preview');
  return { explanation: content || 'Could not explain image.', steps: [] };
}

module.exports = { explainHomework, explainHomeworkFromImage, generateFlashcardsFromNotes, generateQuizQuestions, analyzeRecall, generateStudyPlan };
