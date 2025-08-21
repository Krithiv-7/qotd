require('dotenv').config();
const { REST, Routes } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const APPLICATION_ID = process.env.APPLICATION_ID;

const commands = [
  {
    name: 'qotd',
    description: 'Get the Quote of the Day'
  },
  {
    name: 'questionoftheday',
    description: 'Get the Question of the Day'
  },
  {
    name: 'setqotdchannel',
    description: 'Set the channel for daily QOTD posts',
    options: [
      {
        name: 'channel',
        description: 'Channel',
        type: 7, // CHANNEL type
        required: true
      }
    ]
  },
  {
    name: 'setqotdhour',
    description: 'Set the hour (0-23 UTC) for daily QOTD posts',
    options: [
      {
        name: 'hour',
        description: 'Hour (UTC)',
        type: 4, // INTEGER type
        required: true,
        min_value: 0,
        max_value: 23
      }
    ]
  },
  {
    name: 'setquestionchannel',
    description: 'Set the channel for daily Question of the Day posts',
    options: [
      {
        name: 'channel',
        description: 'Channel',
        type: 7, // CHANNEL type
        required: true
      }
    ]
  },
  {
    name: 'setquestionhour',
    description: 'Set the hour (0-23 UTC) for daily Question posts',
    options: [
      {
        name: 'hour',
        description: 'Hour (UTC)',
        type: 4, // INTEGER type
        required: true,
        min_value: 0,
        max_value: 23
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Started refreshing application (/) commands...');

    await rest.put(
      Routes.applicationCommands(APPLICATION_ID),
      { body: commands }
    );

    console.log('✅ Successfully reloaded application (/) commands!');
    console.log(`📝 Deployed ${commands.length} commands:`);
    commands.forEach(cmd => {
      console.log(`   • /${cmd.name} - ${cmd.description}`);
    });
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
