require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const { createClient } = require("@supabase/supabase-js");

// --- Clients ---
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Commands ---
const commands = [
  new SlashCommandBuilder()
    .setName("getpass")
    .setDescription("Fetches your temporary password for the HackUTA event.")
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("The email you used to register.")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows stats about fetched passwords (Admin only)."),
].map((command) => command.toJSON());

// --- Bot Logic ---
discordClient.once("clientReady", async () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(discordClient.user.id), {
      body: commands,
    });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error(error);
  }
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "getpass") {
    const email = interaction.options.getString("email").toLowerCase();

    try {
      // 1. Find the user's profile by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        return interaction.reply({
          content: "Error: This email is not registered.",
          ephemeral: true,
        });
      }

      // 2. Find their temporary password
      const { data: tempPass, error: passError } = await supabase
        .from("temporary_passwords")
        .select("*")
        .eq("user_id", profile.id)
        .single();

      if (passError || !tempPass) {
        return interaction.reply({
          content: "Error: No temporary password found for this email.",
          ephemeral: true,
        });
      }

      if (tempPass.fetched_at != null) {
        return interaction.reply({
          content:
            "Error: This password has already been fetched.\nPlease contact a HackUTA Admin for assistance.",
          ephemeral: true,
        });
      }

      // 3. DM the password and update the database
      await interaction.user.send(
        `Your HackUTA temporary password is: \`\`\`${tempPass.temp_password}\`\`\`\nPlease reset your password as soon as possible in the [HackUTA Portal](https://portal.hackuta.org)`
      );

      await supabase
        .from("temporary_passwords")
        .update({ fetched_at: new Date().toISOString() })
        .eq("id", tempPass.id);

      await interaction.reply({
        content: "Success! I have sent your temporary password to your DMs.",
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An internal error occurred. Please contact an admin.",
        ephemeral: true,
      });
    }
  }

  if (commandName === "stats") {
    // Security Check: Only allow the admin user to run this
    if (interaction.user.id !== process.env.ADMIN_DISCORD_USER_ID) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const { count: totalCount } = await supabase
      .from("temporary_passwords")
      .select("*", { count: "exact", head: true });
    const { count: fetchedCount } = await supabase
      .from("temporary_passwords")
      .select("*", { count: "exact", head: true })
      .not("fetched_at", "is", null);

    const embed = new EmbedBuilder()
      .setTitle("Password Fetch Statistics")
      .addFields(
        {
          name: "Total Passwords Generated",
          value: String(totalCount || 0),
          inline: true,
        },
        {
          name: "Passwords Fetched by Users",
          value: String(fetchedCount || 0),
          inline: true,
        }
      )
      .setColor(0x0099ff);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

discordClient.login(process.env.DISCORD_TOKEN);
