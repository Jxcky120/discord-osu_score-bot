const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const sqlite3 = require("sqlite3").verbose();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Returns a stat of your osu scores!")
    .addUserOption((option) =>
      option.setName("user").setDescription("discord user").setRequired(false)
    ),
  async execute(interaction) {
    // at the top of your file
    if (!interaction.guild) return; // Returns as there is no guild

    let userSelected = interaction.options.getUser("user");
    let userID;
    if (userSelected) {
      userID = userSelected.id;
    } else {
      userID = interaction.user.id;
    }

    const db = new sqlite3.Database(
      "./users.db",
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) return console.error(err.message);
      }
    );

    let sql = `SELECT discord_id id,
    score_json json
FROM scores
WHERE discord_id  = ?`;

    // first row only
    db.get(sql, [userID], async (err, row) => {
      if (err) {
        return console.error(err.message);
      }

      if (!row)
        return interaction.reply(
          "No database found. Import your scores using the /import command"
        );

      const json = JSON.parse(row.json);

      const maps = json.scorebeatmaps;

      let counter = {};

      maps.forEach(function (data) {
        data.scores.forEach(function (elem) {
          if (counter[elem.playerName]) {
            counter[elem.playerName] += 1;
          } else {
            counter[elem.playerName] = 1;
          }
        });
      });

      let sortedName = Object.keys(counter).sort((a, b) => {
        return counter[b] - counter[a];
      });

      let sortedNumbers = [];

      sortedName.forEach(function (elem) {
        sortedNumbers.push(counter[elem]);
      });

      let page = 1;
      let maxPage = Math.ceil(sortedName.length / 10);

      const leftButton = new ButtonBuilder()
        .setCustomId("left")
        .setLabel("◀")
        .setStyle(ButtonStyle.Success);

      const rightButton = new ButtonBuilder()
        .setCustomId("right")
        .setLabel("▶")
        .setStyle(ButtonStyle.Success);

      const buttons = new ActionRowBuilder().addComponents(
        leftButton,
        rightButton
      );

      if (maxPage > 1) {
        let repliedMessage = await interaction.reply({
          embeds: [getEmbed(page, maxPage, sortedName, sortedNumbers)],
          components: [buttons],
        });
        const collector = repliedMessage.createMessageComponentCollector({
          time: 30000,
        });

        collector.on("collect", async (i) => {
          if (!i.message.interaction) return;
          try {
            if (i.customId === "right") {
              page++;
              if (page > maxPage) page = 1;
            } else if (i.customId === "left") {
              page--;
              if (page < 1) page = maxPage;
            }

            await i.deferUpdate();

            await interaction.editReply({
              embeds: [getEmbed(page, maxPage, sortedName, sortedNumbers)],
              components: [buttons],
            });
          } catch (e) {
            console.log(e);
          }
        });
      } else {
        await interaction.reply({
          embeds: [getEmbed(page, maxPage, sortedName, sortedNumbers)],
        });
      }
    });

    // close the database connection
    db.close();
  },
};

function getEmbed(page, maxPage, sortedName, sortedNumbers) {
  sortedName = sortedName.filter((elem, index) => {
    return index < page * 10 && index > (page - 1) * 10 - 1;
  });
  sortedNumbers = sortedNumbers.filter((elem, index) => {
    return index < page * 10 && index > (page - 1) * 10 - 1;
  });

  const stringName = ("``" + sortedName.join("``\n``") + "``").replace(
    "````",
    "``No Name``"
  );
  const stringNumbers = "``" + sortedNumbers.join("x``\n``") + "x``";

  const exampleEmbed = new EmbedBuilder()
    .setColor(0xffc0cb)
    .setTitle("stats")
    .setThumbnail("https://i.imgur.com/vbrlsca.png")
    .addFields({ name: "Username", value: stringName, inline: true })
    .addFields({
      name: "amount of scores found",
      value: stringNumbers,
      inline: true,
    })
    .setTimestamp()
    .setFooter({
      text: "uwu~ hello there " + `${page}/${maxPage}`,
      iconURL: "https://i.imgur.com/vbrlsca.png",
    });

  return exampleEmbed;
}
