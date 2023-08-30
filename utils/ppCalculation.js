const { Beatmap, Calculator } = require("rosu-pp");

const ppCalc = async function (data, scores) {
  let ppArray = [];

  let map = new Beatmap().fromBytes(new Uint8Array(data));

  scores.forEach(function (elem) {
    const hit300 = elem.amount300;
    const hit100 = elem.amount100;
    const hit50 = elem.amount50;
    const miss = elem.amountMisses;
    const combo = elem.maxcombo;
    const mods = elem.mods;
    const mode = elem.mode[0];
    const nGeki = elem.amountGekis || 0;
    const nKatu = elem.amountKatus || 0;

    let score = {
      mode: mode, // osu!catch
      mods: mods, // HDDT
    };

    let calc = new Calculator(score);

    let maxAttrs = calc.performance(map);

    let setScore = {
      mode: mode, // osu!catch
      mods: mods, // HDDT
      nGeki: nGeki, // amount of n320 for mania, otherwise irrelevant
      nKatu: nKatu,
      n300: hit300,
      n100: hit100,
      n50: hit50,
      nMisses: miss,
      combo: combo,
    };

    let calcPlay = new Calculator(setScore);
    let currentAttrs = calcPlay.performance(map);

    ppArray.push({ maxAttrs, currentAttrs });
  });

  return ppArray;
};

module.exports = {
  ppCalc,
};
