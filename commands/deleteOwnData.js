const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteowndata")
    .setDescription("Delete your own data"),
  async execute(interaction) {
    // at the top of your file
    if (!interaction.guild) return; // Returns as there is no guild

    // inside a command, event listener, etc.
    const exampleEmbed = new EmbedBuilder()
      .setColor(0xffc0cb)
      .setTitle("Deleted your data")

      .setDescription("Yikes...")

      .setTimestamp()
      .setFooter({
        text: "uwu~ hello there",
        iconURL: "https://i.imgur.com/vbrlsca.png",
      });

    const db = new sqlite3.Database(
      "./users.db",
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) return console.error(err.message);
      }
    );

    if (!interaction.guild) return; // Returns as there is no guild

    let userID = interaction.user.id;

    let sql = `DELETE FROM scores WHERE discord_id = ?`;

    db.serialize(() => {
      db.run(sql, [userID], (err) => {
        if (err) return console.error(err.message);
      });
    });

    db.close();

    await interaction.reply({ embeds: [exampleEmbed] });
  },
};
