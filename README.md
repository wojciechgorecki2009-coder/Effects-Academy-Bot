# Discord FAQ Bot

A small Discord bot for answering common server questions with Discord slash commands.

## Commands

- `/help` - Shows the command list.
- `/faq` - Lists all FAQ topics.
- `/faq topic:rules` - Shows a specific FAQ answer.
- `/ask question:how do I verify` - Searches the FAQ list using a normal question.
- `/overlays` - Sends users the overlays channel link.
- `/topaz` - Sends users the Topaz versions channel link.
- `/rules` - Sends users the rules channel link.
- `/audios` - Sends users the audios channel link.
- `/coinflip` - Flips a coin and replies with heads or tails.
- `/comp` - Shows the current editing competition, if one is active.
- `/setcomp` - Uses slash command fields for competition info, then posts it in announcements. Requires moderator access.
- `/endcomp` - Deletes the active competition announcement. Requires moderator access.
- `/servermessage` - Sends a named announcement with a description. Requires moderator access.
- `/edge` - Sends a random edge reply.
- `/marvel` - Sends MrBIt's Marvel take.
- `/wav` - Sends the WAV audio note.
- `/website` - Sends the official Effects Academy website link.
- `/youtube` - Sends the MrBitEdits YouTube link.
- `/tiktok` - Sends the MrBitEdits TikTok link.
- `/nexlo` - Sends Nexlo's TikTok link.
- `/iusethis` - Sends iusethis's TikTok link.
- `/pc` - Sends MrBit's PC specs.
- `/laptop` - Sends iusethis's laptop note.
- `/members` - Sends the server member count.
- `/senioreditor` - Sends senior editor role info.
- `/moderator` - Sends the moderator application channel link.
- `/payhip` - Sends MrBit's Payhip link.
- `/presets` - Sends the presets channel link.
- `/programs` - Sends the programs website link.
- `/ifg` - Sends the IFG reply.
- `/reloadfaq` - Reloads `config/faqs.json` after you edit it. Requires moderator access.

## Setup

1. Install [Node.js](https://nodejs.org/) 18 or newer.
2. In the Discord Developer Portal, create an application and bot.
3. Invite the bot to your server with these permissions:
   - View Channels
   - Send Messages
   - Read Message History
4. Copy `.env.example` to `.env`.
5. Put your bot token in `.env`.
6. Install and start:

```bash
npm install
npm start
```

## Slash Commands

The bot registers real Discord slash commands when it starts.

For faster updates while testing, set `GUILD_ID` in `.env` or in your hosting site's environment variables. To get it, enable Developer Mode in Discord, right-click your server icon, and choose **Copy Server ID**.

```env
GUILD_ID=123456789012345678
```

If `GUILD_ID` is blank, Discord registers the commands globally, which can take longer to appear.

## Editing Answers

Edit `config/faqs.json`.

Each entry looks like this:

```json
{
  "id": "verify",
  "question": "How do I verify?",
  "answer": "Go to the verification channel and follow the pinned instructions.",
  "aliases": ["verification", "verified", "access"]
}
```

After editing the file while the bot is running, use `/reloadfaq`.

## Channel Links

Set these in `.env` or in your hosting site's environment variables:

```env
OVERLAYS_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
TOPAZ_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
MODERATOR_APPLICATION_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
PRESETS_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
RULES_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
AUDIOS_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
ANNOUNCEMENT_CHANNEL_URL=https://discord.com/channels/server_id/channel_id
```

`/setcomp`, `/endcomp`, and `/servermessage` use `ANNOUNCEMENT_CHANNEL_URL`.

## Edge DM

Set `MRBIT_USER_ID` in `.env` or in your hosting site's environment variables so `/edge` can DM MrBit.

To get a Discord user ID, enable Developer Mode in Discord, right-click the user, and choose **Copy User ID**.

## Competition Managers

`/setcomp`, `/endcomp`, and `/servermessage` can be used by MrBit, anyone with **Manage Server**, or anyone with a role listed in `COMP_MANAGER_ROLE_IDS`.

To allow specific roles, enable Developer Mode in Discord, right-click each role, copy its role ID, and separate multiple IDs with commas:

```env
COMP_MANAGER_ROLE_IDS=123456789012345678,234567890123456789
```
