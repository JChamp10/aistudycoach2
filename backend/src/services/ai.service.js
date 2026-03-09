async function explainHomework(question, context = '') {
  await delay(500);
  return {
    explanation: `Let's break down "${question}" step by step. Understanding the core concept first is key to solving this type of problem.`,
    steps: [
      'Identify what information you have and what you need to find.',
      'Choose the appropriate concept or formula that applies here.',
      'Apply the concept step by step, showing your work.',
      'Check your answer by plugging it back into the original problem.',
      'Reflect on what this solution teaches you about the topic.',
    ],
    hint: 'Try working through step 1 on your own before reading further!',
  };
}

async function generateFlashcardsFromNotes(notes, count = 10) {
  await delay(600);
  const cards = [];
  for (let i = 1; i <= Math.min(count, 5); i++) {
    cards.push({
      question: `Key concept #${i} from your notes: What is the main idea here?`,
      answer: `This is the explanation for concept #${i}. Connect the AI to OpenAI to get real flashcards from your notes.`,
    });
  }
  return cards;
}

async function generateQuizQuestions(topic, difficulty = 'medium', count = 5) {
  await delay(700);
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      question: `[${difficulty.toUpperCase()}] Sample question #${i} about ${topic}?`,
      options: ['Option A – correct answer', 'Option B – plausible distractor', 'Option C – common misconception', 'Option D – another distractor'],
      correct: 'Option A – correct answer',
      explanation: `This is why Option A is correct for question #${i}.`,
    });
  }
  return questions;
}

async function analyzeFreeRecallResponse(topic, topicSummary, userResponse) {
  await delay(800);
  const wordCount = userResponse.split(' ').length;
  const score = Math.min(1.0, wordCount / 100);
  return {
    score: parseFloat(score.toFixed(2)),
    feedback: `Good effort! You wrote ${wordCount} words about ${topic}.`,
    correct: ['You identified the main topic correctly', 'Good use of relevant terminology'],
    missed: ['Consider expanding on the historical context', 'The mechanism of action could be more detailed'],
    encouragement: score > 0.7 ? '🎉 Excellent recall!' : '💪 Keep practicing!',
  };
}

async function generateStudyPlan(subjects, dailyHours = 2) {
  await delay(600);
  const plan = [];
  const today = new Date();
  subjects.forEach((subj, idx) => {
    const examDate = new Date(subj.examDate);
    const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    for (let day = 0; day < Math.min(daysUntilExam, 14); day++) {
      if (day % 3 === idx % 3) {
        const studyDate = new Date(today);
        studyDate.setDate(today.getDate() + day);
        plan.push({
          date: studyDate.toISOString().split('T')[0],
          subject: subj.subject,
          task: `Review and practice ${subj.subject} – Day ${day + 1}`,
          duration: dailyHours * 60,
        });
      }
    }
  });
  return plan.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { explainHomework, generateFlashcardsFromNotes, generateQuizQuestions, analyzeFreeRecallResponse, generateStudyPlan };
