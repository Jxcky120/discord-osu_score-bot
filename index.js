const fs = require("fs");

require("dotenv").config();

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Intents,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { REST, Routes } = require("discord.js");

const {
  mode,
  calculateAccuracy,
  numberWithCommas,
  numToMod,
  calculate_rank,
} = require("./utils/utils");

const {ppCalc} = require('./utils/ppCalculation');

//Database connection and table creation.

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
});

let lastMessage = require("./utils/messageHolder");

let sql =
  "CREATE TABLE IF NOT EXISTS scores(`discord_id` NOT NULL, score_json, last_updated, PRIMARY KEY (`discord_id`))";

db.serialize(() => {
  db.run(sql);
});

db.close();

// Env.

const token = process.env.token;
const api = process.env.osuapi;

let clientId = process.env.clientId;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

client.commands = new Collection();

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

const rest = new REST({ version: "10" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (!message.guildId) return;
  // Select the last beatmap sent by osu bot.
  if (message.author.bot && message.author.id != client.user.id) {
    if (message.embeds[0]) {
      try {
        if (message.embeds[0].data.author.url) {
          let url = message.embeds[0].data.author.url;
          if (url.match("https://osu.ppy.sh/b/")) {
            lastMessage.update(url, message.guildId);
          }
        }
        if (message.embeds[0].data.url) {
          let url = message.embeds[0].data.url;
          if (url.match("https://osu.ppy.sh/beatmaps/")) {
            url =
              "https://osu.ppy.sh/b/" +
              url.split("https://osu.ppy.sh/beatmaps/")[1];
            lastMessage.update(url, message.guildId);
          }
          if (url.match("https://osu.ppy.sh/b/")) {
            lastMessage.update(url, message.guildId);
          }
        }
        if (message.embeds[0].data.description.match(/sh\/b\/\d+/g)) {
          let id = message.embeds[0].data.description
            .match(/sh\/b\/\d+/g)[0]
            .slice(5);

          lastMessage.update("https://osu.ppy.sh/b/" + id, message.guildId);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
  // Check if commands is used.
  if (message.author.bot == false) {
    let msg = message.content.toLowerCase();

    if (msg.startsWith(".c") || msg.startsWith(".compare")) {
      // Check if any map replied to by the user or any map/mapid in the command args.
      if (message.mentions.repliedUser) {
        const channel = client.channels.cache.get(message.reference.channelId);
        const messageReplied = await channel.messages.fetch(
          message.reference.messageId
        );

        if (messageReplied) {
          if (messageReplied.embeds[0]) {
            try {
              if (messageReplied.embeds[0].data.author.url) {
                let url = messageReplied.embeds[0].data.author.url;
                if (url.match("https://osu.ppy.sh/b/")) {
                  lastMessage.update(url, messageReplied.guildId);
                }
              }
              if (messageReplied.embeds[0].data.url) {
                let url = messageReplied.embeds[0].data.url;
                if (url.match("https://osu.ppy.sh/beatmaps/")) {
                  url =
                    "https://osu.ppy.sh/b/" +
                    url.split("https://osu.ppy.sh/beatmaps/")[1];
                  lastMessage.update(url, messageReplied.guildId);
                }
                if (url.match("https://osu.ppy.sh/b/")) {
                  lastMessage.update(url, messageReplied.guildId);
                }
              }
              if (
                messageReplied.embeds[0].data.description.match(/sh\/b\/\d+/g)
              ) {
                let id =
                  messageReplied.embeds[0].data.description.match(
                    /sh\/b\/\d+/g
                  )[0];

                lastMessage.update(
                  "https://osu.ppy.sh/b/" + id,
                  messageReplied.guildId
                );
              }
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
      // Regex to check for beatmap in the message.
      if (message.content.match(/\d+/g)) {
        message.content.match(/\d+/g).forEach((id) => {
          if (message.content.match("@" + id)) return;
          lastMessage.update("https://osu.ppy.sh/b/" + id, message.guildId);
        });
      }
      // Check for mentions
      let userID;
      if(message.mentions.users.first()){
        userID = message.mentions.users.first().id;
      }else{
        userID = message.author.id;
      }
      

      if (!lastMessage.get(message.guildId))
        return await message.reply("No map found.");

      const data = await fetch(
        `https://osu.ppy.sh/api/get_beatmaps?k=${api}&b=${
          lastMessage.get(message.guildId).split("https://osu.ppy.sh/b/")[1]
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

      // first row only
      db.get(sql, [userID], async (err, row) => {
        if (err) {
          return console.error(err.message);
        }

        if (!row)
          return message.reply(
            "No database found. Import your scores using the /import command"
          );

        const json = JSON.parse(row.json);

        const filtered = json.scorebeatmaps.filter((elem, index) => {
          return elem.hash == hash;
        });

        if (!filtered[0]) return await message.reply("No scores found.");

        let page = 1;
        let maxPage = Math.ceil(filtered[0].scores.length / 5);

        let resp = await fetch("https://osu.ppy.sh/osu/" + lastMessage.get(message.guildId).split("https://osu.ppy.sh/b/")[1]);

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
          let returnedMessage = await message.reply({
            embeds: [exampleEmbed],
            components: [buttons],
          });
          const collector = returnedMessage.createMessageComponentCollector({
            time: 30000,
          });

          collector.on("collect", async (i) => {
            try {
              if (i.customId === "right") {
                page++;
                if (page > maxPage) page = 1;
              } else if (i.customId === "left") {
                page--;
                if (page < 1) page = maxPage;
              }

              await i.deferUpdate();

              await returnedMessage.edit({
                embeds: [await getEmbed(page, maxPage, filtered[0], response, data)],
                components: [buttons],
              });
            } catch (e) {
              console.log(e);
            }
          });
        } else {
          await message.reply({ embeds: [exampleEmbed] });
        }
      });
    }
    // db.close();
  }
});

client.once("ready", (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(token);

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
