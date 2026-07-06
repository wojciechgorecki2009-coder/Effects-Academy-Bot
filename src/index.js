require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionsBitField,
  SlashCommandBuilder
} = require("discord.js");

const guildId = process.env.GUILD_ID || "";
const overlaysChannelUrl = process.env.OVERLAYS_CHANNEL_URL || "";
const topazChannelUrl = process.env.TOPAZ_CHANNEL_URL || "";
const moderatorApplicationChannelUrl = process.env.MODERATOR_APPLICATION_CHANNEL_URL || "";
const presetsChannelUrl = process.env.PRESETS_CHANNEL_URL || "";
const rulesChannelUrl = process.env.RULES_CHANNEL_URL || "";
const audiosChannelUrl = process.env.AUDIOS_CHANNEL_URL || "";
const announcementChannelUrl = process.env.ANNOUNCEMENT_CHANNEL_URL || "";
const mrbitUserId = process.env.MRBIT_USER_ID || "";
const competitionManagerRoleIds = (process.env.COMP_MANAGER_ROLE_IDS || "")
  .split(",")
  .map((roleId) => roleId.trim())
  .filter(Boolean);

const websiteUrl = "https://effectsacademy.com";
const payhipUrl = "https://payhip.com/MrBitEdits";
const programsUrl = "https://keyfla.me/windows";
const youtubeUrl = "https://www.youtube.com/channel/UCfU49lYtzyIwKfE6gvaKL-w";
const tiktokUrl = "https://www.tiktok.com/@mrbit_edits";
const nexloTiktokUrl = "https://www.tiktok.com/@nexlo_ae";
const iusethisTiktokUrl = "https://www.tiktok.com/@.iusethis";
const faqsPath = path.join(__dirname, "..", "config", "faqs.json");
const competitionStatePath = path.join(__dirname, "..", "config", "competition.json");

const edgeReplies = [
  "haha so funny let me dm mrbit \u270c\ufe0f",
  "this isn't funny king \ud83d\ude29",
  "Second time? The joke is already fighting for its life. Please stop making usage jokes.",
  "Okay now you are spamming it. Think about the morality of forcing a bot to relive the same tired joke.",
  "This is starting to hurt my digital feelings. I am literally begging you to develop one new bit.",
  "Stop. The joke is cooked, the usage joke is cooked, and your moral compass is buffering.",
  "You keep pressing this command like it owes you money. It does not. Stop spamming.",
  "Final warning: every extra /edge is another confession that you have no fresh material.",
  "I'm spending more usage on you \u270c\ufe0f",
  "No"
];
const edgeSpamCounts = new Map();
const edgeSpamWindowMs = 10 * 60 * 1000;
const edgeLockoutMs = 10 * 60 * 1000;

const marvelMessage =
  "MrBIt dislikes marvel because its a cancer for the film industry as any time they release a film every indie movie or any other good movie that comes out during their \"release date\" gets blown out of the water, its like gta 6 every year for the industry. Since Disney bought them they're stories have been getting more stale every release they do, since end game they backed them selves into a corner cause they ended the Avengers Story there and now have nothing else to make expect slop content to keep the investors happy, Also to add their characters are super 1 dimensional every character is basically the same thing without any meaningful development. If you take Marvel and compare it to yt its like MrBeast, anything to keep you watching and super condensed and plain content without any real personality behind it. Past the age of 12 everyone should see through their garbage";

const wavMessage =
  "There is no point uploading wave audios (yes wav's are better in terms of quality) not for editing if your going to render, export and then upload an edit in wav by the time it gets compressed into tiktok there is almost no to little difference to mp3. Wav is almost 30x bigger than mp3 for little to no benefit. Literally waste of space if you intending to upload the audio in a edit to tiktok. Shit will get compressed anyway";

const seniorEditorMessage =
  "You **cannot** get the senior editor role by begging gng \ud83e\udd40 We only give it to people who are genuinely goated editors and deserve the recognition for their work, in simple terms make genuine good edit that stands out and impresses us and you will get it (asking us for it constantly guarantees you not to get it";

const moderatorApplicationNote =
  "We don't really that many mods your application most likely will be declined or be accepted when there is need for more moderators";

const pcMessage = [
  "**MrBit's PC**",
  "*CPU* - Ryzen 5 5600",
  "*GPU* - RTX 3070",
  "*RAM* - 32GB DDR4",
  "*STORAGE* - 2.3TB",
  "PC Part Picker List: https://uk.pcpartpicker.com/list/C26GJw"
].join("\n");

const laptopMessage =
  "Iusethis's laptop doesn't deserve a command lets be honest it uses a laptop gpu its just buns \ud83e\udd40";

let faqs = loadFaqs();
let competitionState = loadCompetitionState();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const slashCommands = buildSlashCommands();

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await registerSlashCommands();
  } catch (error) {
    console.error("Could not register slash commands:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    await handleSlashCommand(interaction);
  } catch (error) {
    console.error(error);
    await replyToInteraction(interaction, {
      content: "Something went wrong while handling that command.",
      ephemeral: true
    });
  }
});

function loadFaqs() {
  if (!fs.existsSync(faqsPath)) {
    console.warn("config/faqs.json is missing; starting with no FAQ entries.");
    return [];
  }

  const raw = fs.readFileSync(faqsPath, "utf8");
  if (!raw.trim()) {
    console.warn("config/faqs.json is empty; starting with no FAQ entries.");
    return [];
  }

  const loadedFaqs = JSON.parse(raw);
  if (!Array.isArray(loadedFaqs)) {
    throw new Error("config/faqs.json must contain an array of FAQ entries.");
  }

  for (const faq of loadedFaqs) {
    if (!faq.id || !faq.question || !faq.answer) {
      throw new Error("Each FAQ needs id, question, and answer fields.");
    }

    if (faq.aliases && !Array.isArray(faq.aliases)) {
      throw new Error(`FAQ "${faq.id}" has aliases, but aliases must be an array.`);
    }
  }

  return loadedFaqs;
}

function loadCompetitionState() {
  if (!fs.existsSync(competitionStatePath)) {
    return { active: false };
  }

  const raw = fs.readFileSync(competitionStatePath, "utf8");
  if (!raw.trim()) {
    return { active: false };
  }

  try {
    const loadedState = JSON.parse(raw);
    return loadedState && typeof loadedState === "object" ? loadedState : { active: false };
  } catch (error) {
    console.warn("config/competition.json is invalid; starting with no active competition.");
    return { active: false };
  }
}

function saveCompetitionState(state) {
  fs.mkdirSync(path.dirname(competitionStatePath), { recursive: true });
  fs.writeFileSync(competitionStatePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function registerSlashCommands() {
  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(slashCommands);
    console.log(`Registered ${slashCommands.length} slash commands for guild ${guildId}.`);
    return;
  }

  await client.application.commands.set(slashCommands);
  console.log(`Registered ${slashCommands.length} global slash commands.`);
}

function buildSlashCommands() {
  return [
    new SlashCommandBuilder().setName("help").setDescription("Show the bot command menu"),
    new SlashCommandBuilder()
      .setName("faq")
      .setDescription("Show FAQ topics or a specific FAQ answer")
      .addStringOption((option) =>
        option.setName("topic").setDescription("FAQ topic or alias").setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName("ask")
      .setDescription("Search the FAQ with a normal question")
      .addStringOption((option) =>
        option.setName("question").setDescription("Question to search for").setRequired(true)
      ),
    new SlashCommandBuilder().setName("overlays").setDescription("Get the overlays channel link"),
    new SlashCommandBuilder().setName("topaz").setDescription("Get the Topaz versions channel link"),
    new SlashCommandBuilder().setName("rules").setDescription("Get the rules channel link"),
    new SlashCommandBuilder().setName("audios").setDescription("Get the audios channel link"),
    new SlashCommandBuilder().setName("coinflip").setDescription("Flip a coin"),
    new SlashCommandBuilder().setName("comp").setDescription("Show the current editing competition"),
    new SlashCommandBuilder()
      .setName("setcomp")
      .setDescription("Set and announce an editing competition")
      .addStringOption((option) => option.setName("date_from").setDescription("Start date").setRequired(true))
      .addStringOption((option) => option.setName("date_to").setDescription("End date").setRequired(true))
      .addStringOption((option) => option.setName("prize").setDescription("Competition prize").setRequired(true))
      .addStringOption((option) => option.setName("description").setDescription("Competition description").setRequired(true))
      .addStringOption((option) => option.setName("name").setDescription("Competition name").setRequired(true))
      .addStringOption((option) => option.setName("rules").setDescription("Competition rules").setRequired(true)),
    new SlashCommandBuilder().setName("endcomp").setDescription("End the current editing competition"),
    new SlashCommandBuilder()
      .setName("servermessage")
      .setDescription("Send a message to the announcement channel")
      .addStringOption((option) =>
        option.setName("name").setDescription("Announcement name/title").setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("description").setDescription("Announcement description").setRequired(true)
      ),
    new SlashCommandBuilder().setName("edge").setDescription("Get the edge reply"),
    new SlashCommandBuilder().setName("marvel").setDescription("Get MrBIt's Marvel take"),
    new SlashCommandBuilder().setName("wav").setDescription("Get the WAV audio note"),
    new SlashCommandBuilder().setName("website").setDescription("Get the official website link"),
    new SlashCommandBuilder().setName("youtube").setDescription("Get the MrBitEdits YouTube link"),
    new SlashCommandBuilder().setName("tiktok").setDescription("Get the MrBitEdits TikTok link"),
    new SlashCommandBuilder().setName("nexlo").setDescription("Get Nexlo's TikTok link"),
    new SlashCommandBuilder().setName("iusethis").setDescription("Get iusethis's TikTok link"),
    new SlashCommandBuilder().setName("pc").setDescription("Get MrBit's PC specs"),
    new SlashCommandBuilder().setName("laptop").setDescription("Get iusethis's laptop note"),
    new SlashCommandBuilder().setName("members").setDescription("Get the server member count"),
    new SlashCommandBuilder().setName("senioreditor").setDescription("Get senior editor role info"),
    new SlashCommandBuilder().setName("moderator").setDescription("Get the moderator application link"),
    new SlashCommandBuilder().setName("payhip").setDescription("Get MrBit's Payhip link"),
    new SlashCommandBuilder().setName("presets").setDescription("Get the presets channel link"),
    new SlashCommandBuilder().setName("programs").setDescription("Get the programs website link"),
    new SlashCommandBuilder().setName("ifg").setDescription("Get the IFG reply"),
    new SlashCommandBuilder().setName("reloadfaq").setDescription("Reload FAQ entries")
  ].map((command) => command.toJSON());
}

async function handleSlashCommand(interaction) {
  const commandHandlers = {
    help: handleHelpCommand,
    faq: handleFaqCommand,
    ask: handleAskCommand,
    overlays: () => replyWithConfiguredLink(interaction, overlaysChannelUrl, "overlays"),
    topaz: () => replyWithConfiguredLink(interaction, topazChannelUrl, "Topaz versions"),
    rules: () => replyWithConfiguredLink(interaction, rulesChannelUrl, "rules"),
    audios: () => replyWithConfiguredLink(interaction, audiosChannelUrl, "audios"),
    coinflip: () => interaction.reply(`The coin landed on **${pickRandom(["heads", "tails"])}**.`),
    comp: handleCompetitionCommand,
    setcomp: handleSetCompetitionCommand,
    endcomp: handleEndCompetitionCommand,
    servermessage: handleServerMessageCommand,
    edge: handleEdgeCommand,
    marvel: () => interaction.reply(marvelMessage),
    wav: () => interaction.reply(wavMessage),
    website: () => interaction.reply(`Official Effects Academy website: ${websiteUrl}`),
    youtube: () => interaction.reply(`MrBitEdits YouTube: ${youtubeUrl}`),
    tiktok: () => interaction.reply(`MrBitEdits TikTok: ${tiktokUrl}`),
    nexlo: () => interaction.reply(`Nexlo's TikTok: ${nexloTiktokUrl}`),
    iusethis: () => interaction.reply(`iusethis's TikTok: ${iusethisTiktokUrl}`),
    pc: () => interaction.reply(pcMessage),
    laptop: () => interaction.reply(laptopMessage),
    members: handleMembersCommand,
    senioreditor: () => interaction.reply(seniorEditorMessage),
    moderator: handleModeratorCommand,
    payhip: () => interaction.reply(`MrBit's Payhip: ${payhipUrl}`),
    presets: () => replyWithConfiguredLink(interaction, presetsChannelUrl, "presets"),
    programs: () => interaction.reply(`After Effects, Premiere, and other programs: ${programsUrl}`),
    ifg: () => interaction.reply("I fucking guess \ud83e\udd40"),
    reloadfaq: handleReloadFaqCommand
  };

  const handler = commandHandlers[interaction.commandName];
  if (handler) {
    await handler(interaction);
  }
}

async function handleHelpCommand(interaction) {
  await interaction.reply({ embeds: [buildCommandMenuEmbed()] });
}

async function handleFaqCommand(interaction) {
  const query = interaction.options.getString("topic") || "";

  if (!query) {
    const list = faqs
      .map((faq) => `**${faq.id}** - ${faq.question}`)
      .join("\n");

    await interaction.reply(trimForDiscord(`Available FAQs:\n${list}\n\nUse \`/faq topic:<name>\` to get an answer.`));
    return;
  }

  const faq = findBestFaq(query);
  if (!faq) {
    await interaction.reply(`I could not find an FAQ for "${query}". Try \`/faq\` to see available topics.`);
    return;
  }

  await interaction.reply(formatFaqAnswer(faq));
}

async function handleAskCommand(interaction) {
  const query = interaction.options.getString("question", true);
  const faq = findBestFaq(query);

  if (!faq) {
    await interaction.reply("I do not have an answer for that yet. Try `/faq` to see the topics I know.");
    return;
  }

  await interaction.reply(formatFaqAnswer(faq));
}

async function handleCompetitionCommand(interaction) {
  await interaction.reply(competitionState?.active
    ? formatCompetitionAnnouncement(competitionState)
    : "There isn't any editing competitions on right now. Check back later");
}

async function handleSetCompetitionCommand(interaction) {
  if (!canManageInteraction(interaction)) {
    await interaction.reply({ content: "Only moderators or MrBit can set competitions.", ephemeral: true });
    return;
  }

  const announcementChannel = await getAnnouncementChannelFromGuild(interaction.guild);
  if (!announcementChannel) {
    await interaction.reply({ content: "The announcement channel has not been configured yet.", ephemeral: true });
    return;
  }

  await deleteCompetitionAnnouncementFromGuild(interaction.guild);

  const newCompetition = {
    active: true,
    name: interaction.options.getString("name", true),
    description: interaction.options.getString("description", true),
    prize: interaction.options.getString("prize", true),
    startDate: interaction.options.getString("date_from", true),
    endDate: interaction.options.getString("date_to", true),
    rules: interaction.options.getString("rules", true),
    channelId: announcementChannel.id,
    messageId: ""
  };

  const announcement = await announcementChannel.send(formatCompetitionAnnouncement(newCompetition));
  newCompetition.messageId = announcement.id;
  competitionState = newCompetition;
  saveCompetitionState(competitionState);

  await interaction.reply({ content: "Competition announcement posted.", ephemeral: true });
}

async function handleEndCompetitionCommand(interaction) {
  if (!canManageInteraction(interaction)) {
    await interaction.reply({ content: "Only moderators or MrBit can end competitions.", ephemeral: true });
    return;
  }

  await deleteCompetitionAnnouncementFromGuild(interaction.guild);
  competitionState = { active: false };
  saveCompetitionState(competitionState);
  await interaction.reply({ content: "Competition ended.", ephemeral: true });
}

async function handleServerMessageCommand(interaction) {
  if (!canManageInteraction(interaction)) {
    await interaction.reply({ content: "Only moderators or MrBit can send server messages.", ephemeral: true });
    return;
  }

  const announcementChannel = await getAnnouncementChannelFromGuild(interaction.guild);
  if (!announcementChannel) {
    await interaction.reply({ content: "The announcement channel has not been configured yet.", ephemeral: true });
    return;
  }

  await announcementChannel.send(formatServerAnnouncement({
    name: interaction.options.getString("name", true),
    description: interaction.options.getString("description", true)
  }));
  await interaction.reply({ content: "Server message sent.", ephemeral: true });
}

async function handleEdgeCommand(interaction) {
  const edgeReply = getEdgeReply(interaction.user.id);
  await interaction.reply(edgeReply.content);

  if (!edgeReply.shouldDmMrBit) {
    return;
  }

  if (!mrbitUserId) {
    console.warn("MRBIT_USER_ID is not configured; skipping edge DM.");
    return;
  }

  try {
    const user = await client.users.fetch(mrbitUserId);
    await user.send("someone told me to edge btw \u270c\ufe0f can we ban him?");
  } catch (error) {
    console.error("Could not send edge DM:", error);
  }
}

async function handleMembersCommand(interaction) {
  if (!interaction.guild) {
    await interaction.reply("This command only works in a server.");
    return;
  }

  const guild = await interaction.guild.fetch();
  await interaction.reply(`Server member count **${guild.memberCount}**`);
}

async function handleModeratorCommand(interaction) {
  await interaction.reply(moderatorApplicationChannelUrl
    ? `${moderatorApplicationNote}\n${moderatorApplicationChannelUrl}`
    : "The moderator application channel link has not been configured yet.");
}

async function handleReloadFaqCommand(interaction) {
  if (!canManageInteraction(interaction)) {
    await interaction.reply({ content: "Only server managers can reload the FAQ list.", ephemeral: true });
    return;
  }

  faqs = loadFaqs();
  await interaction.reply({ content: `Reloaded ${faqs.length} FAQ entries.`, ephemeral: true });
}

async function replyWithConfiguredLink(interaction, url, label) {
  await interaction.reply(url
    ? `You can find the ${label} here: ${url}`
    : `The ${label} channel link has not been configured yet.`);
}

async function replyToInteraction(interaction, options) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(options).catch(() => null);
    return;
  }

  await interaction.reply(options).catch(() => null);
}

async function deleteCompetitionAnnouncementFromGuild(guild) {
  if (!competitionState?.messageId || !competitionState?.channelId || !guild) {
    return;
  }

  const channel = await guild.channels.fetch(competitionState.channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return;
  }

  const announcement = await channel.messages.fetch(competitionState.messageId).catch(() => null);
  if (announcement) {
    await announcement.delete().catch(() => null);
  }
}

async function getAnnouncementChannelFromGuild(guild) {
  if (!announcementChannelUrl || !guild) {
    return null;
  }

  const channelId = extractDiscordId(announcementChannelUrl);
  if (!channelId) {
    return null;
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}

function canManageInteraction(interaction) {
  if (interaction.user.id === mrbitUserId) {
    return true;
  }

  if (interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
    return true;
  }

  const roles = interaction.member?.roles;
  if (roles?.cache) {
    return competitionManagerRoleIds.some((roleId) => roles.cache.has(roleId));
  }

  if (Array.isArray(roles)) {
    return competitionManagerRoleIds.some((roleId) => roles.includes(roleId));
  }

  return false;
}

function getEdgeReply(userId) {
  const now = Date.now();
  const existing = edgeSpamCounts.get(userId);

  if (existing?.blockedUntil && now < existing.blockedUntil) {
    return { content: "No", shouldDmMrBit: false };
  }

  const count = existing && now - existing.lastUsedAt < edgeSpamWindowMs
    ? existing.count + 1
    : 1;

  const isLockout = count >= edgeReplies.length;
  edgeSpamCounts.set(userId, {
    count,
    lastUsedAt: now,
    blockedUntil: isLockout ? now + edgeLockoutMs : 0
  });

  if (count === 1) {
    return { content: pickRandom(edgeReplies.slice(0, 2)), shouldDmMrBit: true };
  }

  return {
    content: edgeReplies[Math.min(count, edgeReplies.length) - 1],
    shouldDmMrBit: !isLockout
  };
}

function buildCommandMenuEmbed() {
  return new EmbedBuilder()
    .setTitle("Effects Academy Bot Commands")
    .setDescription("Use Discord slash commands.")
    .setColor(0x8b5cf6)
    .addFields(
      {
        name: "Channel Links",
        value: "`/overlays` `/topaz` `/rules` `/audios` `/moderator` `/presets`"
      },
      {
        name: "Links",
        value: "`/website` `/youtube` `/tiktok` `/nexlo` `/iusethis` `/payhip` `/programs`"
      },
      {
        name: "Info",
        value: "`/pc` `/laptop` `/members` `/senioreditor` `/marvel` `/wav`"
      },
      {
        name: "Fun",
        value: "`/edge` `/coinflip` `/ifg`"
      },
      {
        name: "Competition",
        value: "`/comp` `/setcomp` `/endcomp`"
      },
      {
        name: "Admin",
        value: "`/servermessage` `/reloadfaq`"
      },
      {
        name: "FAQ",
        value: "`/faq` `/faq topic:<topic>` `/ask question:<question>`"
      }
    );
}

function findBestFaq(query) {
  const normalizedQuery = normalize(query);

  const exactMatch = faqs.find((faq) => {
    const aliases = faq.aliases || [];
    return [faq.id, faq.question, ...aliases]
      .map(normalize)
      .some((value) => value === normalizedQuery);
  });

  if (exactMatch) {
    return exactMatch;
  }

  const scored = faqs
    .map((faq) => ({ faq, score: scoreFaq(faq, normalizedQuery) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.faq || null;
}

function scoreFaq(faq, normalizedQuery) {
  const haystack = normalize([
    faq.id,
    faq.question,
    faq.answer,
    ...(faq.aliases || [])
  ].join(" "));

  if (haystack.includes(normalizedQuery)) {
    return 100 + normalizedQuery.length;
  }

  const queryWords = new Set(normalizedQuery.split(" ").filter((word) => word.length > 2));
  let score = 0;

  for (const word of queryWords) {
    if (haystack.includes(word)) {
      score += 1;
    }
  }

  return score;
}

function formatFaqAnswer(faq) {
  return trimForDiscord(`**${faq.question}**\n${faq.answer}`);
}

function formatCompetitionAnnouncement(competition) {
  const lines = [
    `**${competition.name}**`,
    "",
    `"${competition.description}"`,
    `**${competition.prize}**`,
    "",
    `From *${competition.startDate}*`,
    `To *${competition.endDate}*`
  ];

  if (competition.rules) {
    lines.push("", "**Rules**", competition.rules);
  }

  return trimForDiscord(lines.join("\n"));
}

function formatServerAnnouncement(announcement) {
  return trimForDiscord([
    `**${announcement.name}**`,
    "",
    `"${announcement.description}"`
  ].join("\n"));
}

function extractDiscordId(value) {
  return String(value || "").match(/\d{17,20}/)?.[0] || "";
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimForDiscord(value) {
  if (value.length <= 2000) {
    return value;
  }

  return `${value.slice(0, 1997)}...`;
}

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN. Copy .env.example to .env and add your bot token.");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
