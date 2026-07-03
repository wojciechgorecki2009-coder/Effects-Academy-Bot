# Discord FAQ Bot

A small Discord bot for answering common server questions with commands that start with `!`.

## Commands

- `!help` - Shows the command list.
- `!faq` - Lists all FAQ topics.
- `!faq rules` - Shows a specific FAQ answer.
- `!ask how do I verify` - Searches the FAQ list using a normal question.
- `!overlays` - Sends users the overlays channel link.
- `!topaz` - Sends users the Topaz versions channel link.
- `!edge` - Sends a random edge reply.
- `!marvel` - Sends MrBIt's Marvel take.
- `!wav` - Sends the WAV audio note.
- `!website` - Sends the official Effects Academy website link.
- `!youtube` - Sends the MrBitEdits YouTube link.
- `!tiktok` - Sends the MrBitEdits TikTok link.
- `!nexlo` - Sends Nexlo's TikTok link.
- `!iusethis` - Sends iusethis's TikTok link.
- `!pc` - Sends MrBit's PC specs.
- `!laptop` - Sends iusethis's laptop note.
- `!members` - Sends the server member count.
- `!senioreditor` - Sends senior editor role info.
- `!moderator` - Sends the moderator application channel link.
- `!payhip` - Sends MrBit's Payhip link.
- `!presets` - Sends the presets channel link.
- `!programs` - Sends the programs website link.
- `!ifg` - Sends the IFG reply.
- `!reloadfaq` - Reloads `config/faqs.json` after you edit it. Requires the Discord **Manage Server** permission.

## Setup

1. Install [Node.js](https://nodejs.org/) 18 or newer.
2. In the Discord Developer Portal, create an application and bot.
3. Enable **Message Content Intent** for the bot.
4. Invite the bot to your server with these permissions:
   - View Channels
   - Send Messages
   - Read Message History
5. Copy `.env.example` to `.env`.
6. Put your bot token in `.env`.
7. Install and start:

```bash
npm install
npm start
```

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

After editing the file while the bot is running, use:

```text
!reloadfaq
```

## Changing the Prefix

Change `PREFIX=!` in `.env`.

For example:

```env
PREFIX=?
```

Then commands would start with `?` instead of `!`.

## Overlays Channel

Set `OVERLAYS_CHANNEL_URL` in `.env` or in Render's environment variables.

To get the channel link in Discord, right-click the overlays channel and choose **Copy Channel Link**.

## Topaz Channel

Set `TOPAZ_CHANNEL_URL` in `.env` or in Render's environment variables.

To get the channel link in Discord, right-click the Topaz versions channel and choose **Copy Channel Link**.

## Moderator Application Channel

Set `MODERATOR_APPLICATION_CHANNEL_URL` in `.env` or in Render's environment variables.

## Presets Channel

Set `PRESETS_CHANNEL_URL` in `.env` or in Render's environment variables.

## Edge DM

Set `MRBIT_USER_ID` in `.env` or in Render's environment variables so `!edge` can DM MrBit.

To get a Discord user ID, enable Developer Mode in Discord, right-click the user, and choose **Copy User ID**.
