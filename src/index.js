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
const topazChannelUrl = process.env.TOPAZ_CHANNEL_URL || "";
const mrbitUserId = process.env.MRBIT_USER_ID || "";
const websiteUrl = "https://effectsacademy.com";
const youtubeUrl = "https://www.youtube.com/channel/UCfU49lYtzyIwKfE6gvaKL-w";
const tiktokUrl = "https://www.tiktok.com/@mrbit_edits";
const nexloTiktokUrl = "https://www.tiktok.com/@nexlo_ae";
const iusethisTiktokUrl = "https://www.tiktok.com/@.iusethis";
const faqsPath = path.join(__dirname, "..", "config", "faqs.json");

const edgeReplies = [
  "haha so funny let me dm mrbit \u270c\ufe0f",
  "this isn't funny king \ud83d\ude29"
];

const marvelMessage =
  "MrBIt dislikes marvel because its a cancer for the film industry as any time they release a film every indie movie or any other good movie that comes out during their \"release date\" gets blown out of the water, its like gta 6 every year for the industry. Since Disney bought them they're stories have been getting more stale every release they do, since end game they backed them selves into a corner cause they ended the Avengers Story there and now have nothing else to make expect slop content to keep the investors happy, Also to add their characters are super 1 dimensional every character is basically the same thing without any meaningful development. If you take Marvel and compare it to yt its like MrBeast, anything to keep you watching and super condensed and plain content without any real personality behind it. Past the age of 12 everyone should see through their garbage";

const wavMessage =
  "There is no point uploading wave audios (yes wav's are better in terms of quality) not for editing if your going to render, export and then upload an edit in wav by the time it gets compressed into tiktok there is almost no to little difference to mp3. Wav is almost 30x bigger than mp3 for little to no benefit. Literally waste of space if you intending to upload the audio in a edit to tiktok. Shit will get compressed anyway";

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

    if (command === "topaz") {
      await handleTopazCommand(message);
      return;
    }

    if (command === "edge") {
      await handleEdgeCommand(message);
      return;
    }

    if (command === "marvel") {
      await message.reply(marvelMessage);
      return;
    }

    if (command === "wav") {
      await message.reply(wavMessage);
      return;
    }

    if (command === "website" || command === "site") {
      await message.reply(`Official Effects Academy website: ${websiteUrl}`);
      return;
    }

    if (command === "youtube" || command === "yt") {
      await message.reply(`MrBitEdits YouTube: ${youtubeUrl}`);
      return;
    }

    if (command === "tiktok" || command === "tt") {
      await message.reply(`MrBitEdits TikTok: ${tiktokUrl}`);
      return;
    }

    if (command === "nexlo") {
      await message.reply(`Nexlo's TikTok: ${nexloTiktokUrl}`);
      return;
    }

    if (command === "iusethis") {
      await message.reply(`iusethis's TikTok: ${iusethisTiktokUrl}`);
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

async function handleTopazCommand(message) {
  if (!topazChannelUrl) {
    await message.reply("The topaz versions channel link has not been configured yet.");
    return;
  }

  await message.reply(`You can find the Topaz versions here: ${topazChannelUrl}`);
}

async function handleEdgeCommand(message) {
  await message.reply(pickRandom(edgeReplies));

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
    `\`${prefix}topaz\` - Get the Topaz versions channel link.`,
    `\`${prefix}edge\` - Get the edge reply.`,
    `\`${prefix}marvel\` - Get MrBIt's Marvel take.`,
    `\`${prefix}wav\` - Get the WAV audio note.`,
    `\`${prefix}website\` - Get the official website link.`,
    `\`${prefix}youtube\` - Get the MrBitEdits YouTube link.`,
    `\`${prefix}tiktok\` - Get the MrBitEdits TikTok link.`,
    `\`${prefix}nexlo\` - Get Nexlo's TikTok link.`,
    `\`${prefix}iusethis\` - Get iusethis's TikTok link.`,
    `\`${prefix}reloadfaq\` - Reload FAQ entries after editing config/faqs.json. Requires Manage Server.`
  ].join("\n");
}

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
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
