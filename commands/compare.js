const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
let lastMessage = require("../utils/messageHolder");

const {
  mode,
  calculateAccuracy,
  numberWithCommas,
  numToMod,
  calculate_rank,
} = require("../utils/utils");

const {ppCalc} = require('../utils/ppCalculation');

require("dotenv").config();
const api = process.env.osuapi;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Comapres all your local scores from the last message.")
    .addUserOption(option => option.setName('user').setDescription('discord user').setRequired(false)),
  async execute(interaction) {
    // at the top of your file
    if (!interaction.guild) return; // Returns as there is no guild
    let userSelected = interaction.options.getUser('user');
    let userID;
    if(userSelected){
      userID = userSelected.id;
    }else{
      userID = interaction.user.id;
    }
    

    if (!lastMessage.get(interaction.guildId))
      return await interaction.reply("No map found.");

    const data = await fetch(
      `https://osu.ppy.sh/api/get_beatmaps?k=${api}&b=${
        lastMessage.get(interaction.guildId).split("https://osu.ppy.sh/b/")[1]
      }`
    );

    const response = await data.json();
    
    if (!response[0]) return message.reply("Map not found.");

    const hash = response[0]["file_md5"];

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

    db.get(sql, [userID], async (err, row) => {
      if (err) {
        return console.error(err.message);
      }

      if (!row) return interaction.reply("No database found. Import your scores using the /import command");

      const json = JSON.parse(row.json);

      const maps = json.scorebeatmaps;

      const filtered = json.scorebeatmaps.filter((elem, index) => {
        return elem.hash == hash;
      });

      if (!filtered[0]) return await interaction.reply("No scores found.");

      let page = 1;
      let maxPage = Math.ceil(filtered[0].scores.length / 5);

      let resp = await fetch("https://osu.ppy.sh/osu/" + lastMessage.get(interaction.guildId).split("https://osu.ppy.sh/b/")[1]);

      let blob = await resp.blob();
      const data = await blob.arrayBuffer();

      let exampleEmbed = await getEmbed(page, maxPage, filtered[0], response, data);

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
        let repliedMessage = await interaction.reply({ embeds: [exampleEmbed], components: [buttons] });
        const collector = repliedMessage.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async i => {
          if(!i.message.interaction) return;
          try {
            if (i.customId === 'right') {
              page++
              if(page > maxPage) page = 1;
            }else if(i.customId === "left"){
              page--;
              if(page < 1) page = maxPage;
            }

            await i.deferUpdate();

            await interaction.editReply({ embeds: [await getEmbed(page, maxPage, filtered[0], response, data)], components: [buttons] });
          }catch(e){console.log(e)}
        });
      } else {
        await interaction.reply({ embeds: [exampleEmbed] });
      }
    });
  },
};

async function getEmbed(page, maxPage, array, response, data) {
  const scores = array.scores.filter((_, index) => {
    return index < page * 5 && index > (page - 1) * 5 - 1;
  });
  
  let string = "";

  let ppJson = await ppCalc(data, scores);

  scores.forEach(async function (elem, index) {
    let acc = (
      calculateAccuracy(
        elem.amount300,
        elem.amount100,
        elem.amount50,
        elem.amountMisses,
        elem.mode[0],
        elem.amountKatus,
        elem.amountGekis
      ) * 100
    ).toFixed(2);
    string +=
      `**${index + 1} ]**` +
      "``" +
      numToMod(elem.mods).join("") +
      "``" +
      "Score set by ``" +
      elem.playerName +
      "``" +
      ` for **${mode(elem.mode[0])}**\n${calculate_rank(
        elem.amountMisses,
        acc,
        numToMod(elem.mods).join("")
      )} > **Acc**: ${acc}% > **${ppJson[index].currentAttrs.pp.toFixed(2)}pp** / ${ppJson[index].maxAttrs.pp.toFixed(2)}pp > <t:${parseInt(
        new Date(elem.timestamp).getTime() / 1000,
        10
      )}:R>\n**${numberWithCommas(elem.score)}** > x${elem.maxcombo}/${
        response[0].max_combo
      } > **[${elem.amount300}/${elem.amount100}/${elem.amount50}/${
        elem.amountMisses
      }]**\n`;
  });

  const exampleEmbed = new EmbedBuilder()
    .setColor(0xffc0cb)
    .setTitle(`Top osu! play on ${response[0].title} [${response[0].version}]`)
    .setThumbnail("https://i.imgur.com/vbrlsca.png")
    .setDescription(string)
    .setTimestamp()
    .setFooter({
      text: "uwu~ hello there~" + `Page ${page}/${maxPage}`,
      iconURL: "https://i.imgur.com/vbrlsca.png",
    });

  return exampleEmbed;
}
