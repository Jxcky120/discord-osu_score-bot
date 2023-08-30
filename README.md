# osu!score bot
A discord bot that allows you to import local scores from your osu database and compare scores on it.

# 📦 Prerequisites
- Node.js v16.11.0 or higher
- Git
- Rust

# Install
```
git clone https://github.com/Jxcky120/discord-osu_score-bot.git
cd discord-osu_score-bot
npm install
```

Uses: discord token, osu api v1 token.
```
token="Discord token"
osuapi="Osu API v1"
clientid="Discord client id of the bot"
```
Packages: Rosu-pp-js, discord.js, osu-db-parser (forked version by me)

# Commands
``/help`` ``/compare`` ``/deletedatabase`` ``/deleteowndata`` ``/stats``<br />
You can reply to messages to compare with .c or .compare<br />
Prefix is ``.``<br />
You can also add beatmap link to the command.<br />
Tag a user to see their score if they imported the scores.<br />
