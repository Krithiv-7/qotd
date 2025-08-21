// Test script for question providers
const { getQuestion } = require('./questionProvider');

async function testQuestions() {
  console.log('🧪 Testing Question Providers...\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`--- Test ${i} ---`);
    try {
      const question = await getQuestion();
      console.log(`✅ Question: ${question.question}`);
      console.log(`📝 Type: ${question.type}`);
      console.log(`📚 Source: ${question.source}`);
      console.log(`📂 Category: ${question.category}`);
      console.log(`🎯 Difficulty: ${question.difficulty}`);
      if (question.options) {
        console.log(`📋 Options: ${question.options.join(', ')}`);
      }
      if (question.correct_answer) {
        console.log(`✔️ Answer: ${question.correct_answer}`);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Test ${i} failed:`, error.message);
    }
    
    // Wait 1 second between requests to be respectful to APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testQuestions().then(() => {
  console.log('🎉 Question provider testing complete!');
}).catch(error => {
  console.error('❌ Testing failed:', error);
});
