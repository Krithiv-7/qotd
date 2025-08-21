// Handles fetching questions from various providers
const axios = require('axios');

// Question providers (APIs and fallbacks)
async function fetchOpenTriviaDB() {
  try {
    const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 5000 });
    if (res.data && res.data.results && res.data.results[0]) {
      const q = res.data.results[0];
      // Decode HTML entities
      const decodeHtml = (html) => html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
      return {
        question: decodeHtml(q.question),
        type: 'trivia',
        category: q.category,
        difficulty: q.difficulty,
        correct_answer: decodeHtml(q.correct_answer),
        options: [...q.incorrect_answers.map(decodeHtml), decodeHtml(q.correct_answer)].sort(() => Math.random() - 0.5),
        source: 'Open Trivia DB'
      };
    }
  } catch (error) {
    console.log('⚠️ Open Trivia DB failed:', error.message);
  }
  return null;
}

async function fetchTriviaAPI() {
  try {
    const res = await axios.get('https://the-trivia-api.com/v2/questions?limit=1', { timeout: 5000 });
    if (res.data && res.data[0]) {
      const q = res.data[0];
      return {
        question: q.question.text,
        type: 'trivia',
        category: q.category,
        difficulty: q.difficulty,
        correct_answer: q.correctAnswer,
        options: [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5),
        source: 'The Trivia API'
      };
    }
  } catch (error) {
    console.log('⚠️ The Trivia API failed:', error.message);
  }
  return null;
}

async function fetchNumbersAPI() {
  try {
    const res = await axios.get('http://numbersapi.com/random/trivia', { timeout: 5000 });
    if (res.data && typeof res.data === 'string') {
      return {
        question: res.data,
        type: 'trivia',
        category: 'Numbers & Facts',
        difficulty: 'Medium',
        correct_answer: null,
        options: null,
        source: 'Numbers API'
      };
    }
  } catch (error) {
    console.log('⚠️ Numbers API failed:', error.message);
  }
  return null;
}

async function fetchAdviceSlip() {
  try {
    const res = await axios.get('https://api.adviceslip.com/advice', { timeout: 5000 });
    if (res.data && res.data.slip && res.data.slip.advice) {
      return {
        question: `What do you think about this advice: "${res.data.slip.advice}"`,
        type: 'discussion',
        category: 'Life Advice',
        difficulty: 'Easy',
        correct_answer: null,
        options: null,
        source: 'Advice Slip API'
      };
    }
  } catch (error) {
    console.log('⚠️ Advice Slip API failed:', error.message);
  }
  return null;
}

// Fallback questions when APIs fail
const fallbackQuestions = [
  { question: "If you could have dinner with anyone from history, who would it be and why?", type: "discussion", category: "History", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "What's the most interesting place you've ever visited?", type: "discussion", category: "Travel", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "If you could learn any skill instantly, what would it be?", type: "discussion", category: "Personal", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "What's your favorite way to spend a weekend?", type: "discussion", category: "Lifestyle", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "If you could time travel, would you go to the past or future? Why?", type: "discussion", category: "Philosophy", difficulty: "Medium", correct_answer: null, options: null, source: "Fallback" },
  { question: "What's the best advice you've ever received?", type: "discussion", category: "Life", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "If you could have any superpower, what would it be?", type: "discussion", category: "Fantasy", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "What's something you've learned recently that surprised you?", type: "discussion", category: "Learning", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "If you could change one thing about the world, what would it be?", type: "discussion", category: "Society", difficulty: "Medium", correct_answer: null, options: null, source: "Fallback" },
  { question: "What's your biggest accomplishment that you're proud of?", type: "discussion", category: "Personal", difficulty: "Easy", correct_answer: null, options: null, source: "Fallback" },
  { question: "Which planet in our solar system has the most moons?", type: "trivia", category: "Science", difficulty: "Medium", correct_answer: "Saturn", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], source: "Fallback" },
  { question: "What is the capital of Australia?", type: "trivia", category: "Geography", difficulty: "Medium", correct_answer: "Canberra", options: ["Sydney", "Melbourne", "Canberra", "Perth"], source: "Fallback" },
  { question: "Who wrote the novel '1984'?", type: "trivia", category: "Literature", difficulty: "Easy", correct_answer: "George Orwell", options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "H.G. Wells"], source: "Fallback" },
  { question: "What is the smallest country in the world?", type: "trivia", category: "Geography", difficulty: "Easy", correct_answer: "Vatican City", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], source: "Fallback" },
  { question: "In what year did the Berlin Wall fall?", type: "trivia", category: "History", difficulty: "Medium", correct_answer: "1989", options: ["1987", "1988", "1989", "1990"], source: "Fallback" }
];

async function getFallbackQuestion() {
  const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
  return fallbackQuestions[randomIndex];
}

async function getQuestion() {
  console.log('🔍 Fetching question from providers...');
  
  const providers = [
    { name: 'Open Trivia DB', func: fetchOpenTriviaDB },
    { name: 'The Trivia API', func: fetchTriviaAPI },
    { name: 'Numbers API', func: fetchNumbersAPI },
    { name: 'Advice Slip API', func: fetchAdviceSlip }
  ];
  
  // Randomize provider order for variety
  const shuffledProviders = providers.sort(() => Math.random() - 0.5);
  
  for (const provider of shuffledProviders) {
    try {
      console.log(`📡 Trying ${provider.name}...`);
      const question = await provider.func();
      if (question && question.question) {
        console.log(`✅ Question fetched from ${provider.name}`);
        return question;
      }
    } catch (error) {
      console.log(`❌ ${provider.name} failed:`, error.message);
    }
  }
  
  // If all providers fail, use fallback
  console.log('⚠️ All question providers failed, using fallback question');
  return getFallbackQuestion();
}

module.exports = { getQuestion };
