// Handles SQLite DB for storing sent quotes
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('qotd.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sent_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    text TEXT NOT NULL,
    author TEXT,
    source TEXT,
    sent_at DATE DEFAULT (date('now'))
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS sent_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    question TEXT NOT NULL,
    type TEXT,
    category TEXT,
    difficulty TEXT,
    correct_answer TEXT,
    options TEXT,
    source TEXT,
    sent_at DATE DEFAULT (date('now'))
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT,
    post_hour INTEGER DEFAULT 9,
    question_channel_id TEXT,
    question_post_hour INTEGER DEFAULT 10
  )`);

  // Add new columns to existing guild_settings table if they don't exist
  db.run(`ALTER TABLE guild_settings ADD COLUMN question_channel_id TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('⚠️ Note: question_channel_id column may already exist');
    }
  });
  
  db.run(`ALTER TABLE guild_settings ADD COLUMN question_post_hour INTEGER DEFAULT 10`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('⚠️ Note: question_post_hour column may already exist');
    }
  });

  console.log('📊 Database tables created successfully!');
});
function saveQuote(guildId, text, author, source) {
  db.run('INSERT INTO sent_quotes (guild_id, text, author, source) VALUES (?, ?, ?, ?)', [guildId, text, author, source || 'Unknown']);
}

// Get the quote sent for a guild on a specific UTC date (YYYY-MM-DD)
function getQuoteForDate(guildId, date, cb) {
  db.get('SELECT text, author, source FROM sent_quotes WHERE guild_id = ? AND sent_at = ?', [guildId, date], (err, row) => {
    cb(row);
  });
}

// Get the last quote sent for a guild (any date)
function getLastQuote(guildId, cb) {
  db.get('SELECT text, author, source, sent_at FROM sent_quotes WHERE guild_id = ? ORDER BY sent_at DESC LIMIT 1', [guildId], (err, row) => {
    cb(row);
  });
}

function wasQuoteSent(guildId, text, cb) {
  db.get('SELECT 1 FROM sent_quotes WHERE guild_id = ? AND text = ?', [guildId, text], (err, row) => {
    cb(!!row);
  });
}

function saveQuestion(guildId, question, type, category, difficulty, correct_answer, options) {
  const optionsJson = options ? JSON.stringify(options) : null;
  db.run('INSERT INTO sent_questions (guild_id, question, type, category, difficulty, correct_answer, options, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [guildId, question, type || 'discussion', category || 'General', difficulty || 'Medium', correct_answer, optionsJson, 'API']);
}

// Get the question sent for a guild on a specific UTC date (YYYY-MM-DD)
function getQuestionForDate(guildId, date, cb) {
  db.get('SELECT question, type, category, difficulty, correct_answer, options, source FROM sent_questions WHERE guild_id = ? AND sent_at = ?', [guildId, date], (err, row) => {
    cb(row);
  });
}

// Get the last question sent for a guild (any date)
function getLastQuestion(guildId, cb) {
  db.get('SELECT question, type, category, difficulty, correct_answer, options, source, sent_at FROM sent_questions WHERE guild_id = ? ORDER BY sent_at DESC LIMIT 1', [guildId], (err, row) => {
    cb(row);
  });
}

function wasQuestionSent(guildId, text, cb) {
  db.get('SELECT 1 FROM sent_questions WHERE guild_id = ? AND text = ?', [guildId, text], (err, row) => {
    cb(!!row);
  });
}

function setGuildSettings(guildId, channelId, postHour, questionChannelId, questionPostHour) {
  db.run(`INSERT INTO guild_settings (guild_id, channel_id, post_hour, question_channel_id, question_post_hour) 
          VALUES (?, ?, ?, ?, ?) 
          ON CONFLICT(guild_id) DO UPDATE SET 
          channel_id=COALESCE(excluded.channel_id, channel_id),
          post_hour=COALESCE(excluded.post_hour, post_hour),
          question_channel_id=COALESCE(excluded.question_channel_id, question_channel_id),
          question_post_hour=COALESCE(excluded.question_post_hour, question_post_hour)`, 
          [guildId, channelId, postHour, questionChannelId, questionPostHour]);
}

function getGuildSettings(guildId, cb) {
  db.get('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId], (err, row) => {
    cb(row);
  });
}

function getAllGuildSettings(cb) {
  db.all('SELECT * FROM guild_settings', [], (err, rows) => {
    cb(rows || []);
  });
}

module.exports = { saveQuote, wasQuoteSent, setGuildSettings, getGuildSettings, getAllGuildSettings, getQuoteForDate, getLastQuote, saveQuestion, getQuestionForDate, getLastQuestion, wasQuestionSent };