require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField
} = require("discord.js");

const prefix = process.env.PREFIX || "!";
const overlaysChannelUrl = process.env.OVERLAYS_CHANNEL_URL || "";
const faqsPath = path.join(__dirname, "..", "config", "faqs.json");

let faqs = loadFaqs();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Using command prefix: ${prefix}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) {
    return;
  }

  const withoutPrefix = message.content.slice(prefix.length).trim();
  if (!withoutPrefix) {
    return;
  }

  const [commandName, ...args] = withoutPrefix.split(/\s+/);
  const command = commandName.toLowerCase();
  const query = args.join(" ").trim();

  try {
    if (command === "help" || command === "commands") {
      await message.reply(buildHelpMessage());
      return;
    }

    if (command === "faq" || command === "faqs") {
      await handleFaqCommand(message, query);
      return;
    }

    if (command === "ask" || command === "question") {
      await handleAskCommand(message, query);
      return;
    }

    if (command === "overlays" || command === "overlay") {
      await handleOverlaysCommand(message);
      return;
    }

    if (command === "reloadfaq" || command === "reloadfaqs") {
      await handleReloadCommand(message);
      return;
    }
  } catch (error) {
    console.error(error);
    await message.reply("Something went wrong while handling that command.");
  }
});

function loadFaqs() {
  const raw = fs.readFileSync(faqsPath, "utf8");
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

async function handleFaqCommand(message, query) {
  if (!query) {
    const list = faqs
      .map((faq) => `**${faq.id}** - ${faq.question}`)
      .join("\n");

    await message.reply(
      trimForDiscord(`Available FAQs:\n${list}\n\nUse \`${prefix}faq <name>\` to get an answer.`)
    );
    return;
  }

  const faq = findBestFaq(query);
  if (!faq) {
    await message.reply(`I could not find an FAQ for "${query}". Try \`${prefix}faq\` to see available topics.`);
    return;
  }

  await message.reply(formatFaqAnswer(faq));
}

async function handleAskCommand(message, query) {
  if (!query) {
    await message.reply(`Ask a question after the command, like \`${prefix}ask how do I verify\`.`);
    return;
  }

  const faq = findBestFaq(query);
  if (!faq) {
    await message.reply(`I do not have an answer for that yet. Try \`${prefix}faq\` to see the topics I know.`);
    return;
  }

  await message.reply(formatFaqAnswer(faq));
}

async function handleOverlaysCommand(message) {
  if (!overlaysChannelUrl) {
    await message.reply("The overlays channel link has not been configured yet.");
    return;
  }

  await message.reply(`You can find the overlays here: ${overlaysChannelUrl}`);
}

async function handleReloadCommand(message) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    await message.reply("Only server managers can reload the FAQ list.");
    return;
  }

  faqs = loadFaqs();
  await message.reply(`Reloaded ${faqs.length} FAQ entries.`);
}

function buildHelpMessage() {
  return [
    `Commands start with \`${prefix}\`.`,
    "",
    `\`${prefix}help\` - Show this message.`,
    `\`${prefix}faq\` - List all FAQ topics.`,
    `\`${prefix}faq <topic>\` - Show an answer by topic or alias.`,
    `\`${prefix}ask <question>\` - Search the FAQ answers using a normal question.`,
    `\`${prefix}overlays\` - Get the overlays channel link.`,
    `\`${prefix}reloadfaq\` - Reload FAQ entries after editing config/faqs.json. Requires Manage Server.`
  ].join("\n");
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

if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN. Copy .env.example to .env and add your bot token.");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
