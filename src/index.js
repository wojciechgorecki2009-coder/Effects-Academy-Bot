require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionsBitField
} = require("discord.js");

const commandPrefix = process.env.PREFIX || "!";
const topazChannelUrl = process.env.TOPAZ_CHANNEL_URL || "";
const moderatorApplicationChannelUrl = process.env.MODERATOR_APPLICATION_CHANNEL_URL || "";
const rulesChannelUrl = process.env.RULES_CHANNEL_URL || "";
const announcementChannelUrl = process.env.ANNOUNCEMENT_CHANNEL_URL || "";
const mrbitUserId = process.env.MRBIT_USER_ID || "";
const competitionManagerRoleIds = (process.env.COMP_MANAGER_ROLE_IDS || "")
  .split(",")
  .map((roleId) => roleId.trim())
  .filter(Boolean);
const moderatorRoleId = process.env.MODERATOR_ROLE_ID || competitionManagerRoleIds[0] || "";
const viewerRoleId = process.env.VIEWER_ROLE_ID || "";

const websiteUrl = "https://effectsacademy.com";
const payhipUrl = "https://payhip.com/MrBitEdits";
const programsUrl = "https://keyfla.me/windows";
const fontFinderUrl = "https://www.myfonts.com/pages/whatthefont/";
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
  "Final warning: every extra !edge is another confession that you have no fresh material.",
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Using command prefix: ${commandPrefix}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(commandPrefix)) {
    return;
  }

  const withoutPrefix = message.content.slice(commandPrefix.length).trim();
  const [rawCommandName, ...rest] = withoutPrefix.split(/\s+/);
  const commandName = rawCommandName?.toLowerCase();
  const args = rest.join(" ").trim();

  if (!commandName) {
    return;
  }

  try {
    await handlePrefixCommand(message, commandName, args);
  } catch (error) {
    console.error(error);
    await message.reply("Something went wrong while handling that command.").catch(() => null);
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

async function handlePrefixCommand(message, commandName, args) {
  const commandHandlers = {
    help: handleHelpCommand,
    faq: handleFaqCommand,
    ask: handleAskCommand,
    overlays: (msg) => msg.reply(`Official Effects Academy website: ${websiteUrl}`),
    topaz: (msg) => replyWithConfiguredLink(msg, topazChannelUrl, "Topaz versions"),
    rules: (msg) => replyWithConfiguredLink(msg, rulesChannelUrl, "rules"),
    audios: (msg) => msg.reply(`Official Effects Academy website: ${websiteUrl}`),
    coinflip: (msg) => msg.reply(`The coin landed on **${pickRandom(["heads", "tails"])}**.`),
    comp: handleCompetitionCommand,
    setcomp: handleSetCompetitionCommand,
    endcomp: handleEndCompetitionCommand,
    servermessage: handleServerMessageCommand,
    edge: handleEdgeCommand,
    marvel: (msg) => msg.reply(marvelMessage),
    wav: (msg) => msg.reply(wavMessage),
    website: (msg) => msg.reply(`Official Effects Academy website: ${websiteUrl}`),
    youtube: (msg) => msg.reply(`MrBitEdits YouTube: ${youtubeUrl}`),
    tiktok: (msg) => msg.reply(`MrBitEdits TikTok: ${tiktokUrl}`),
    nexlo: (msg) => msg.reply(`Nexlo's TikTok: ${nexloTiktokUrl}`),
    iusethis: (msg) => msg.reply(`iusethis's TikTok: ${iusethisTiktokUrl}`),
    pc: (msg) => msg.reply(pcMessage),
    laptop: (msg) => msg.reply(laptopMessage),
    members: handleMembersCommand,
    senioreditor: (msg) => msg.reply(seniorEditorMessage),
    moderator: handleModeratorCommand,
    payhip: (msg) => msg.reply(`MrBit's Payhip: ${payhipUrl}`),
    presets: (msg) => msg.reply(`Official Effects Academy website: ${websiteUrl}`),
    programs: (msg) => msg.reply(`After Effects, Premiere, and other programs: ${programsUrl}`),
    font: (msg) => msg.reply(`FInd photos from images using: ${fontFinderUrl}`),
    ifg: (msg) => msg.reply("I fucking guess \ud83e\udd40"),
    reloadfaq: handleReloadFaqCommand
  };

  const handler = commandHandlers[commandName];
  if (handler) {
    await handler(message, args);
  }
}

async function handleHelpCommand(message) {
  await message.reply({ embeds: [buildCommandMenuEmbed(canManageMessage(message))] });
}

async function handleFaqCommand(message, args) {
  const query = args.trim();

  if (!query) {
    const list = faqs
      .map((faq) => `**${faq.id}** - ${faq.question}`)
      .join("\n");

    await message.reply(trimForDiscord(`Available FAQs:\n${list}\n\nUse \`${commandPrefix}faq topic\` to get an answer.`));
    return;
  }

  const faq = findBestFaq(query);
  if (!faq) {
    await message.reply(`I could not find an FAQ for "${query}". Try \`${commandPrefix}faq\` to see available topics.`);
    return;
  }

  await message.reply(formatFaqAnswer(faq));
}

async function handleAskCommand(message, args) {
  const query = args.trim();
  if (!query) {
    await message.reply(`Use \`${commandPrefix}ask your question here\`.`);
    return;
  }

  const faq = findBestFaq(query);
  if (!faq) {
    await message.reply(`I do not have an answer for that yet. Try \`${commandPrefix}faq\` to see the topics I know.`);
    return;
  }

  await message.reply(formatFaqAnswer(faq));
}

async function handleCompetitionCommand(message) {
  await message.reply(competitionState?.active
    ? formatCompetitionAnnouncement(competitionState)
    : "There isn't any editing competitions on right now. Check back later");
}

async function handleSetCompetitionCommand(message, args) {
  if (!canManageMessage(message)) {
    await message.reply("Only moderators or MrBit can set competitions.");
    return;
  }

  const parts = parsePipeArgs(args);
  if (parts.length < 6) {
    await message.reply(`Use \`${commandPrefix}setcomp name | description | prize | start date | end date | rules\`.`);
    return;
  }

  const announcementChannel = await getAnnouncementChannelFromGuild(message.guild);
  if (!announcementChannel) {
    await message.reply("The announcement channel has not been configured yet.");
    return;
  }

  await deleteCompetitionAnnouncementFromGuild(message.guild);

  const [name, description, prize, startDate, endDate, rules] = parts;
  const newCompetition = {
    active: true,
    name,
    description,
    prize,
    startDate,
    endDate,
    rules,
    channelId: announcementChannel.id,
    messageId: ""
  };

  const announcement = await announcementChannel.send(formatCompetitionAnnouncement(newCompetition));
  newCompetition.messageId = announcement.id;
  competitionState = newCompetition;
  saveCompetitionState(competitionState);

  await message.reply("Competition announcement posted.");
}

async function handleEndCompetitionCommand(message) {
  if (!canManageMessage(message)) {
    await message.reply("Only moderators or MrBit can end competitions.");
    return;
  }

  await deleteCompetitionAnnouncementFromGuild(message.guild);
  competitionState = { active: false };
  saveCompetitionState(competitionState);
  await message.reply("Competition ended.");
}

async function handleServerMessageCommand(message, args) {
  if (!canManageMessage(message)) {
    await message.reply("Only moderators or MrBit can send server messages.");
    return;
  }

  const parts = parsePipeArgs(args);
  if (parts.length < 2) {
    await message.reply(`Use \`${commandPrefix}servermessage name | description | ping\`. Ping can be none, everyone, here, moderator, or viewer.`);
    return;
  }

  const announcementChannel = await getAnnouncementChannelFromGuild(message.guild);
  if (!announcementChannel) {
    await message.reply("The announcement channel has not been configured yet.");
    return;
  }

  await announcementChannel.send(formatServerAnnouncement({
    name: parts[0],
    description: parts[1],
    ping: normalizePingChoice(parts[2] || "none")
  }));
  await message.reply("Server message sent.");
}

async function handleEdgeCommand(message) {
  const edgeReply = getEdgeReply(message.author.id);
  await message.reply(edgeReply.content);

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

async function handleMembersCommand(message) {
  if (!message.guild) {
    await message.reply("This command only works in a server.");
    return;
  }

  const guild = await message.guild.fetch();
  await message.reply(`Server member count **${guild.memberCount}**`);
}

async function handleModeratorCommand(message) {
  await message.reply(moderatorApplicationChannelUrl
    ? `${moderatorApplicationNote}\n${moderatorApplicationChannelUrl}`
    : "The moderator application channel link has not been configured yet.");
}

async function handleReloadFaqCommand(message) {
  if (!canManageMessage(message)) {
    await message.reply("Only server managers can reload the FAQ list.");
    return;
  }

  faqs = loadFaqs();
  await message.reply(`Reloaded ${faqs.length} FAQ entries.`);
}

async function replyWithConfiguredLink(message, url, label) {
  await message.reply(url
    ? `You can find the ${label} here: ${url}`
    : `The ${label} channel link has not been configured yet.`);
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

function canManageMessage(message) {
  if (message.author.id === mrbitUserId) {
    return true;
  }

  if (message.member?.permissions?.has(PermissionsBitField.Flags.ManageGuild)) {
    return true;
  }

  const roles = message.member?.roles;
  if (roles?.cache) {
    return competitionManagerRoleIds.some((roleId) => roles.cache.has(roleId));
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

function buildCommandMenuEmbed(showStaffCommands = false) {
  const embed = new EmbedBuilder()
    .setTitle("Effects Academy Bot Commands")
    .setDescription(`Use commands with the \`${commandPrefix}\` prefix.`)
    .setColor(0x8b5cf6)
    .addFields(
      {
        name: "Channel Links",
        value: "`!topaz` `!rules` `!moderator`"
      },
      {
        name: "Links",
        value: "`!website` `!overlays` `!audios` `!presets` `!youtube` `!tiktok` `!nexlo` `!iusethis` `!payhip` `!programs` `!font`"
      },
      {
        name: "Info",
        value: "`!pc` `!laptop` `!members` `!senioreditor` `!marvel` `!wav`"
      },
      {
        name: "Fun",
        value: "`!edge` `!coinflip` `!ifg`"
      },
      {
        name: "FAQ",
        value: "`!faq` `!faq topic` `!ask question`"
      }
    );

  if (showStaffCommands) {
    embed.addFields(
      {
        name: "Competition",
        value: "`!comp` `!setcomp name | description | prize | start date | end date | rules` `!endcomp`"
      },
      {
        name: "Admin",
        value: "`!servermessage name | description | ping` `!reloadfaq`"
      }
    );
  }

  return embed;
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
  const lines = [
    `# **${announcement.name}**`,
    "",
    announcement.description
  ];
  const ping = formatAnnouncementPing(announcement.ping);

  if (ping) {
    lines.push("", ping);
  }

  return trimForDiscord(lines.join("\n"));
}

function formatAnnouncementPing(ping) {
  const pings = {
    everyone: "@everyone",
    here: "@here",
    moderator: moderatorRoleId ? `<@&${moderatorRoleId}>` : "@moderator",
    viewer: viewerRoleId ? `<@&${viewerRoleId}>` : "@viewer"
  };

  return pings[ping] || "";
}

function normalizePingChoice(value) {
  return String(value)
    .toLowerCase()
    .replace(/^@/, "")
    .trim();
}

function parsePipeArgs(value) {
  return String(value)
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractDiscordId(value) {
  const ids = String(value || "").match(/\d{17,20}/g) || [];
  return ids.at(-1) || "";
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
