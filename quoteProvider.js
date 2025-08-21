// Handles fetching quotes from multiple providers with fallback logic
const axios = require('axios');

// API-based providers
async function fetchZenQuote() {
  try {
    const res = await axios.get('https://zenquotes.io/api/random');
    if (res.data && res.data[0]) {
      return {
        text: res.data[0].q,
        author: res.data[0].a || 'Unknown',
        source: 'ZenQuotes'
      };
    }
  } catch {}
  return null;
}

async function fetchQuotableQuote() {
  try {
    const res = await axios.get('https://api.quotable.io/random');
    if (res.data && res.data.content) {
      return {
        text: res.data.content,
        author: res.data.author || 'Unknown',
        source: 'Quotable'
      };
    }
  } catch {}
  return null;
}

async function fetchFavQsQuote() {
  try {
    const res = await axios.get('https://favqs.com/api/qotd');
    if (res.data && res.data.quote) {
      return {
        text: res.data.quote.body,
        author: res.data.quote.author || 'Unknown',
        source: 'FavQs'
      };
    }
  } catch {}
  return null;
}

// Web scraping providers (simplified - in production you'd want proper HTML parsing)
async function fetchBrainyQuote() {
  try {
    const res = await axios.get('https://www.brainyquote.com/quote_of_the_day', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    // Note: This is a simplified approach. BrainyQuote would need proper HTML parsing
    // For now, we'll skip this implementation to avoid complex parsing
    return null;
  } catch {}
  return null;
}

async function fetchInsightOfTheDay() {
  try {
    const res = await axios.get('https://www.insightoftheday.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    // Similar to above - would need HTML parsing
    return null;
  } catch {}
  return null;
}

// Fallback quotes when all providers fail
const fallbackQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", source: "Fallback" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", source: "Fallback" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", source: "Fallback" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", source: "Fallback" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", source: "Fallback" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", source: "Fallback" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", source: "Fallback" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", source: "Fallback" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", source: "Fallback" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", source: "Fallback" }
];

async function getFallbackQuote() {
  const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
  return fallbackQuotes[randomIndex];
}

async function getQuote() {
  console.log('🔍 Fetching quote from providers...');
  
  // Try API providers first (most reliable)
  const providers = [
    { name: 'ZenQuotes', func: fetchZenQuote },
    { name: 'Quotable', func: fetchQuotableQuote },
    { name: 'FavQs', func: fetchFavQsQuote }
  ];
  
  for (const provider of providers) {
    try {
      console.log(`📡 Trying ${provider.name}...`);
      const quote = await provider.func();
      if (quote && quote.text) {
        console.log(`✅ Quote fetched from ${provider.name}`);
        return quote;
      }
    } catch (error) {
      console.log(`❌ ${provider.name} failed:`, error.message);
    }
  }
  
  // If all providers fail, use fallback
  console.log('⚠️ All providers failed, using fallback quote');
  return getFallbackQuote();
}

module.exports = { getQuote };
