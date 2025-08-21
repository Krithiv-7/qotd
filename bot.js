require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { getQuote } = require('./quoteProvider');
const { getQuestion } = require('./questionProvider');
const { saveQuote, wasQuoteSent, setGuildSettings, getGuildSettings, getAllGuildSettings, getQuoteForDate, getLastQuote, saveQuestion, getQuestionForDate, getLastQuestion, wasQuestionSent } = require('./db');

const TOKEN = process.env.DISCORD_TOKEN;
const APPLICATION_ID = process.env.APPLICATION_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const QOTD_COMMAND = new SlashCommandBuilder()
  .setName('qotd')
  .setDescription('Get the Quote of the Day');
const QUESTION_COMMAND = new SlashCommandBuilder()
  .setName('questionoftheday')
  .setDescription('Get the Question of the Day');
const SET_CHANNEL_COMMAND = new SlashCommandBuilder()
  .setName('setqotdchannel')
  .setDescription('Set the channel for daily QOTD posts')
  .addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(true));
const SET_HOUR_COMMAND = new SlashCommandBuilder()
  .setName('setqotdhour')
  .setDescription('Set the hour (0-23 UTC) for daily QOTD posts')
  .addIntegerOption(opt => opt.setName('hour').setDescription('Hour (UTC)').setMinValue(0).setMaxValue(23).setRequired(true));
const SET_QUESTION_CHANNEL_COMMAND = new SlashCommandBuilder()
  .setName('setquestionchannel')
  .setDescription('Set the channel for daily Question of the Day posts')
  .addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(true));
const SET_QUESTION_HOUR_COMMAND = new SlashCommandBuilder()
  .setName('setquestionhour')
  .setDescription('Set the hour (0-23 UTC) for daily Question posts')
  .addIntegerOption(opt => opt.setName('hour').setDescription('Hour (UTC)').setMinValue(0).setMaxValue(23).setRequired(true));

function getTodayUTCDate() {
  return new Date().toISOString().slice(0, 10);
}

function createQuoteEmbed(quote, isDaily = false) {
  const embed = new EmbedBuilder()
    .setColor(isDaily ? 0x00D4AA : 0x5865F2) // Teal for daily, Blurple for on-demand
    .setTitle('📅 Quote of the Day')
    .setDescription(`*"${quote.text}"*`)
    .addFields(
      { name: '✍️ Author', value: quote.author || 'Unknown', inline: true },
      { name: '📚 Source', value: quote.source || 'Unknown', inline: true }
    )
    .setFooter({ 
      text: isDaily 
        ? `Daily quote • ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}` 
        : `${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`
    })
    .setTimestamp();
    
  return embed;
}

function createQuestionEmbed(question, isDaily = false) {
  const embed = new EmbedBuilder()
    .setColor(isDaily ? 0xFF6B35 : 0x9932CC) // Orange for daily, Purple for on-demand
    .setTitle('❓ Question of the Day')
    .setDescription(question.question)
    .setFooter({ 
      text: isDaily 
        ? `Daily question • ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}` 
        : `${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`
    })
    .setTimestamp();

  // Add fields based on question type
  if (question.type === 'trivia' && question.correct_answer) {
    embed.addFields(
      { name: '📝 Category', value: question.category || 'General', inline: true },
      { name: '🎯 Difficulty', value: question.difficulty || 'Medium', inline: true },
      { name: '💡 Type', value: 'Trivia Question', inline: true }
    );
    
    if (question.options && question.options.length > 0) {
      const optionsText = question.options.map((opt, idx) => 
        `${['A', 'B', 'C', 'D'][idx]}. ${opt}`
      ).join('\n');
      embed.addFields({ name: '📋 Options', value: optionsText, inline: false });
    }
  } else if (question.type === 'jeopardy') {
    embed.addFields(
      { name: '📝 Category', value: question.category || 'General', inline: true },
      { name: '🎯 Value', value: question.difficulty || 'Medium', inline: true },
      { name: '💡 Type', value: 'Jeopardy Style', inline: true },
      { name: '💭 Note', value: 'Answer in the form of a question!', inline: false }
    );
  } else if (question.type === 'would_you_rather') {
    embed.addFields(
      { name: '🤔 Type', value: 'Would You Rather', inline: true },
      { name: '🎯 Category', value: question.category || 'Choice', inline: true }
    );
  } else {
    embed.addFields(
      { name: '💭 Type', value: 'Discussion Question', inline: true },
      { name: '📝 Category', value: question.category || 'General', inline: true }
    );
  }

  // Add source attribution
  if (question.source) {
    embed.addFields({ name: '📚 Source', value: question.source, inline: true });
  }
    
  return embed;
}

async function postQuote(guildId, channel) {
  const today = getTodayUTCDate();
  getQuoteForDate(guildId, today, async (row) => {
    if (row) {
      // Already sent today, resend same quote
      const embed = createQuoteEmbed({ text: row.text, author: row.author, source: row.source || 'Unknown' }, true);
      channel.send({ embeds: [embed] });
      return;
    }
    // Get last quote to avoid repeat
    getLastQuote(guildId, async (lastRow) => {
      let quote, attempts = 0;
      do {
        quote = await getQuote();
        attempts++;
      } while (quote && lastRow && quote.text === lastRow.text && attempts < 5);
      if (!quote.text) return;
      const embed = createQuoteEmbed(quote, true);
      channel.send({ embeds: [embed] });
      saveQuote(guildId, quote.text, quote.author, quote.source);
    });
  });
}

async function postQuestion(guildId, channel) {
  const today = getTodayUTCDate();
  getQuestionForDate(guildId, today, async (row) => {
    if (row) {
      // Already sent today, resend same question
      const questionData = {
        question: row.question,
        type: row.type,
        category: row.category,
        difficulty: row.difficulty,
        correct_answer: row.correct_answer,
        options: row.options ? JSON.parse(row.options) : null
      };
      const embed = createQuestionEmbed(questionData, true);
      channel.send({ embeds: [embed] });
      return;
    }
    // Get last question to avoid repeat
    getLastQuestion(guildId, async (lastRow) => {
      let question, attempts = 0;
      do {
        question = await getQuestion();
        attempts++;
      } while (question && lastRow && question.question === lastRow.question && attempts < 5);
      if (!question.question) return;
      const embed = createQuestionEmbed(question, true);
      channel.send({ embeds: [embed] });
      saveQuestion(guildId, question.question, question.type, question.category, question.difficulty, question.correct_answer, question.options);
    });
  });
}

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} is now online!`);
  console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);
  console.log(`👤 Application ID: ${client.user.id}`);
  
  // Register slash commands globally
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(APPLICATION_ID || client.user.id),
      { body: [
        QOTD_COMMAND.toJSON(), 
        QUESTION_COMMAND.toJSON(),
        SET_CHANNEL_COMMAND.toJSON(), 
        SET_HOUR_COMMAND.toJSON(),
        SET_QUESTION_CHANNEL_COMMAND.toJSON(),
        SET_QUESTION_HOUR_COMMAND.toJSON()
      ] }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (e) { 
    console.error('❌ Slash command registration failed:', e); 
  }

  // Schedule daily QOTD for all guilds with settings
  getAllGuildSettings((guilds) => {
    console.log(`⏰ Setting up schedules for ${guilds.length} configured server(s)`);
    guilds.forEach(({ guild_id, channel_id, post_hour, question_channel_id, question_post_hour }) => {
      console.log(`📅 Scheduled for Guild ${guild_id}: Quote Channel ${channel_id} at ${post_hour || 9}:00 UTC`);
      
      // Schedule quote posting
      cron.schedule(`0 ${post_hour || 9} * * *`, async () => {
        try {
          const guild = await client.guilds.fetch(guild_id);
          const channel = await guild.channels.fetch(channel_id);
          if (channel) {
            console.log(`📝 Posting daily quote to ${guild.name} #${channel.name}`);
            postQuote(guild_id, channel);
          }
        } catch (e) { 
          console.error(`❌ Failed to post quote to guild ${guild_id}:`, e.message);
        }
      }, { timezone: 'Etc/UTC' });

      // Schedule question posting if configured
      if (question_channel_id) {
        console.log(`❓ Question Channel ${question_channel_id} at ${question_post_hour || 10}:00 UTC`);
        cron.schedule(`0 ${question_post_hour || 10} * * *`, async () => {
          try {
            const guild = await client.guilds.fetch(guild_id);
            const questionChannel = await guild.channels.fetch(question_channel_id);
            if (questionChannel) {
              console.log(`❓ Posting daily question to ${guild.name} #${questionChannel.name}`);
              postQuestion(guild_id, questionChannel);
            }
          } catch (e) { 
            console.error(`❌ Failed to post question to guild ${guild_id}:`, e.message);
          }
        }, { timezone: 'Etc/UTC' });
      }
    });
  });

  console.log('🚀 QOTD Bot is fully online and ready!');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Handle DM commands
  if (!interaction.inGuild()) {
    console.log(`💬 DM Command /${interaction.commandName} used by ${interaction.user.tag}`);
    if (interaction.commandName === 'qotd') {
      const quote = await getQuote();
      if (!quote.text) return interaction.reply('Sorry, no quote is available at the moment.');
      const embed = createQuoteEmbed(quote, false);
      return interaction.reply({ embeds: [embed] });
    } else if (interaction.commandName === 'questionoftheday') {
      const question = await getQuestion();
      if (!question.question) return interaction.reply('Sorry, no question is available at the moment.');
      const embed = createQuestionEmbed(question, false);
      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }
  }

  // Handle Server commands
  const guildId = interaction.guildId;
  console.log(`💬 Command /${interaction.commandName} used in ${interaction.guild?.name || 'DM'} by ${interaction.user.tag}`);
  
  if (interaction.commandName === 'qotd') {
    const today = getTodayUTCDate();
    getQuoteForDate(guildId, today, async (row) => {
      if (row) {
        const embed = createQuoteEmbed({ text: row.text, author: row.author, source: row.source || 'Unknown' }, false);
        return interaction.reply({ embeds: [embed] });
      }
      getLastQuote(guildId, async (lastRow) => {
        let quote, attempts = 0;
        do {
          quote = await getQuote();
          attempts++;
        } while (quote && lastRow && quote.text === lastRow.text && attempts < 5);
        if (!quote.text) return interaction.reply('No quote available.');
        saveQuote(guildId, quote.text, quote.author, quote.source);
        const embed = createQuoteEmbed(quote, false);
        interaction.reply({ embeds: [embed] });
      });
    });
  } else if (interaction.commandName === 'setqotdchannel') {
    if (!interaction.memberPermissions.has('Administrator')) return interaction.reply({ content: 'Only admins can set the QOTD channel.', flags: 64 });
    const channel = interaction.options.getChannel('channel');
    getGuildSettings(guildId, (settings) => {
      setGuildSettings(
        guildId, 
        channel.id, 
        settings ? settings.post_hour : 9, 
        settings ? settings.question_channel_id : null, 
        settings ? settings.question_post_hour : 10
      );
      console.log(`⚙️ ${interaction.guild.name}: QOTD channel set to #${channel.name}`);
      interaction.reply({ content: `QOTD channel set to <#${channel.id}>.`, flags: 64 });
    });
  } else if (interaction.commandName === 'setqotdhour') {
    if (!interaction.memberPermissions.has('Administrator')) return interaction.reply({ content: 'Only admins can set the QOTD hour.', flags: 64 });
    const hour = interaction.options.getInteger('hour');
    getGuildSettings(guildId, (settings) => {
      setGuildSettings(
        guildId, 
        settings ? settings.channel_id : null, 
        hour, 
        settings ? settings.question_channel_id : null, 
        settings ? settings.question_post_hour : 10
      );
      console.log(`⏰ ${interaction.guild.name}: QOTD hour set to ${hour}:00 UTC`);
      interaction.reply({ content: `QOTD post hour set to ${hour}:00 UTC.`, flags: 64 });
    });
  } else if (interaction.commandName === 'questionoftheday') {
    const today = getTodayUTCDate();
    getQuestionForDate(guildId, today, async (row) => {
      if (row) {
        const questionData = {
          question: row.question,
          type: row.type,
          category: row.category,
          difficulty: row.difficulty,
          correct_answer: row.correct_answer,
          options: row.options ? JSON.parse(row.options) : null
        };
        const embed = createQuestionEmbed(questionData, false);
        return interaction.reply({ embeds: [embed] });
      }
      getLastQuestion(guildId, async (lastRow) => {
        let question, attempts = 0;
        do {
          question = await getQuestion();
          attempts++;
        } while (question && lastRow && question.question === lastRow.question && attempts < 5);
        if (!question.question) return interaction.reply('No question available.');
        saveQuestion(guildId, question.question, question.type, question.category, question.difficulty, question.correct_answer, question.options);
        const embed = createQuestionEmbed(question, false);
        interaction.reply({ embeds: [embed] });
      });
    });
  } else if (interaction.commandName === 'setquestionchannel') {
    if (!interaction.memberPermissions.has('Administrator')) return interaction.reply({ content: 'Only admins can set the Question channel.', flags: 64 });
    const channel = interaction.options.getChannel('channel');
    getGuildSettings(guildId, (settings) => {
      setGuildSettings(
        guildId, 
        settings ? settings.channel_id : null, 
        settings ? settings.post_hour : 9, 
        channel.id, 
        settings ? settings.question_post_hour : 10
      );
      console.log(`⚙️ ${interaction.guild.name}: Question channel set to #${channel.name}`);
      interaction.reply({ content: `Question of the Day channel set to <#${channel.id}>.`, flags: 64 });
    });
  } else if (interaction.commandName === 'setquestionhour') {
    if (!interaction.memberPermissions.has('Administrator')) return interaction.reply({ content: 'Only admins can set the Question hour.', flags: 64 });
    const hour = interaction.options.getInteger('hour');
    getGuildSettings(guildId, (settings) => {
      setGuildSettings(
        guildId, 
        settings ? settings.channel_id : null, 
        settings ? settings.post_hour : 9, 
        settings ? settings.question_channel_id : null, 
        hour
      );
      console.log(`⏰ ${interaction.guild.name}: Question post hour set to ${hour}:00 UTC`);
      interaction.reply({ content: `Question post hour set to ${hour}:00 UTC.`, flags: 64 });
    });
  }
});

client.login(TOKEN);
