# 🤖 Discord QOTD Bot

A feature-rich Discord bot that provides daily **Quote of the Day** and **Question of the Day** posts with beautiful embeds, multiple provider APIs, and per-server configuration.

## ✨ Features

### 📝 Quote of the Day

- **Daily Automated Posts** - Scheduled quotes posted at configurable times
- **Beautiful Embeds** - Teal color scheme with author attribution and source
- **Multiple Providers** with smart fallbacks:
  - 🌟 **ZenQuotes API** - Inspirational quotes
  - 📚 **Quotable API** - Famous quotes with metadata  
  - 💎 **FavQs API** - Community quotes
  - 🛡️ **10 Built-in Fallbacks** - Always available when APIs fail
- **Duplicate Prevention** - Avoids repeating the same quote
- **On-Demand Access** - Use `/qotd` anytime

### ❓ Question of the Day  

- **Daily Automated Posts** - Scheduled questions posted at configurable times
- **Beautiful Embeds** - Orange/purple color scheme with category and difficulty
- **Multiple Question Types**:
  - 🧠 **Trivia Questions** - Multiple choice with categories and difficulty
  - 💭 **Discussion Questions** - Open-ended conversation starters
  - 📊 **Number Facts** - Interesting numerical trivia
  - 💡 **Life Advice** - Thought-provoking advice discussions
- **Multiple Providers** with smart fallbacks:
  - 🎯 **Open Trivia DB** - Free trivia questions with categories
  - 🧩 **The Trivia API** - High-quality trivia across many topics
  - 🔢 **Numbers API** - Fascinating number facts
  - 💬 **Advice Slip API** - Life advice for discussions
  - 🛡️ **15 Built-in Fallbacks** - Mix of trivia and discussion questions
- **Smart Question Format** - Adapts display based on question type
- **On-Demand Access** - Use `/questionoftheday` anytime

### ⚙️ Per-Server Configuration

- **Separate Channels** - Different channels for quotes and questions
- **Custom Scheduling** - Set different post times for each type
- **Admin Controls** - Only administrators can configure settings
- **Persistent Storage** - SQLite database saves all settings and history

## 🚀 Commands

### User Commands

- `/qotd` - Get the current Quote of the Day
- `/questionoftheday` - Get the current Question of the Day

### Admin Commands (Requires Administrator Permission)

- `/setqotdchannel #channel` - Set channel for daily quote posts
- `/setqotdhour 9` - Set hour (0-23 UTC) for daily quote posts
- `/setquestionchannel #channel` - Set channel for daily question posts  
- `/setquestionhour 10` - Set hour (0-23 UTC) for daily question posts

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file with your Discord bot token and channel ID:

   ```env
   DISCORD_TOKEN=your-bot-token
   APPLICATION_ID=your-application-id

   ```

3. Run the bot:

   ```sh
   node bot.js
   ```

## Dependencies

- discord.js
- node-cron
- axios
- sqlite3
- dotenv

## Notes

- Replace placeholders in `.env` with your actual values.
- The bot avoids repeating quotes by storing them in SQLite.
