require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Local Running of the Discord Bot is DISABLED
const disabled = true;

// --- Clients ---
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// --- Commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('check')
    .setDescription('Checks if you have been registered.')
    .addStringOption((option) =>
      option
        .setName('email')
        .setDescription('The email you used to register.')
        .setRequired(true),
    ),
].map((command) => command.toJSON());

// --- Bot Logic ---
discordClient.once('clientReady', async () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(discordClient.user.id), {
      body: commands,
    });
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error(error);
  }
});

discordClient.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'check') {
    const email = interaction.options.getString('email').toLowerCase();

    const { data: profile, error: profileError } = await supabase
      .from('interest-form')
      .select('id')
      .eq('email', email);

    if (profileError || !profile || profile.length < 1) {
      console.error(profileError);
      return interaction.reply({
        content:
          'This email is not registered. You can register at https://hackuta.org/',
        ephemeral: true,
      });
    }

    return interaction.reply({
      content:
        'This email is registered for HackUTA 2025, Keep an eye out for invites!',
      ephemeral: true,
    });
  }
});

if (!disabled) {
  discordClient.login(process.env.DISCORD_TOKEN);
}
