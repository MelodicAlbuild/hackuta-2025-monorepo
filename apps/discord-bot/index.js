require('dotenv').config();
const http = require('http');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Enable the bot automatically when running in Docker containers
const disabled = !(process.env.IN_DOCKER === 'true');

// --- Clients ---
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
let discordReady = false;
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
  discordReady = true;
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

// Simple health server
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '3000', 10);
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (req.method === 'GET' && req.url === '/readyz') {
    const ready = discordReady && !!process.env.DISCORD_TOKEN;
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(ready ? 'ready' : 'not-ready');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not-found');
});

server.listen(HEALTH_PORT, () => {
  console.log(
    `[health] discord-bot health server listening on :${HEALTH_PORT}`,
  );
});
