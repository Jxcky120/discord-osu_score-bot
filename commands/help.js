const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("This provides everything the bot does and can handle!"),
  async execute(interaction) {
    // at the top of your file

    // inside a command, event listener, etc.
    const exampleEmbed = new EmbedBuilder()
      .setColor(0xFFC0CB)
      .setTitle("Welcome to osu!score")
      
      .setDescription("This osu bot allows you to import your local ranking scores on your own osu. This way it shows all the scores on a map including different mods, scorev1'd scores.\n\n The score database can be found at your osu location. The file name is ``scores.db``. Usual location is at: ``C:/Users/<Username>/AppData/Local/osu!``. ")
      .setThumbnail("https://i.imgur.com/vbrlsca.png")
      .addFields(
        { name: "Commands", value: "/help\n/import\n/compare\n/stats\n/deletedatabase\n/deleteowndata" },
      )
      .setTimestamp()
      .setFooter({
        text: "uwu~ hello there",
        iconURL: "https://i.imgur.com/vbrlsca.png",
      })

    await interaction.reply({ embeds: [exampleEmbed] });
  },
};
