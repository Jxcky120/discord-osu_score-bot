const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const OsuDBParser = require("osu-db-parser");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("import")
    .setDescription("Import your local osu scores!")
    .addAttachmentOption((option) =>
      option
        .setRequired(true)
        .setName("file")
        .setDescription(
          "Upload the scores.db file. Note: It needs to be named scores.db. Check /help for more information."
        )
    ),
  async execute(interaction) {
    const attachment = interaction.options.getAttachment("file");

    const name = attachment.name;

    if (name != "scores.db") {
      return await interaction.reply(
        `you uploaded ${name}, that's the wrong file you goofy baka~.`
      );
    }

    const data = await fetch(attachment.attachment);
    const response = await data.arrayBuffer();

    let scoreBuffer = Buffer.from(response);
    const scoreDB = new OsuDBParser(null, null, scoreBuffer); // Yeah, that's okay

    let scores = scoreDB.getScoreData(); // This is collection.db data you can make with this all that you want.

    const db = new sqlite3.Database(
      "./users.db",
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) return console.error(err.message);
      }
    );

    if (!interaction.guild) return; // Returns as there is no guild

    let userID = interaction.user.id;

    let sql = `INSERT OR REPLACE INTO scores(discord_id, score_json, last_updated)
    VALUES (?, ?, ?)`;

    db.serialize(() => {
      db.run(sql, [userID, JSON.stringify(scores), new Date()], (err) => {
        if (err) return console.error(err.message);
      });
    });

    db.close();

    await interaction.reply(`you uploaded ${name}`);
  },
};
