const mode = function (x) {
  switch (x) {
    case 0:
      return "Standard";
    case 1:
      return "Taiko";
    case 2:
      return "CTB";
    case 3:
      return "osu!mania";
  }
};

const calculateAccuracy = function (x300, x100, x50, xmiss, mode, katu, geki) {
  let total;
  switch (mode) {
    case 0:
      total = x50 + x100 + x300 + xmiss;
      return total === 0
        ? 0
        : (x300 * 300 + x100 * 100 + x50 * 50) / (total * 300);
    case 1:
      total = x100 + x300 + xmiss;
      return total === 0 ? 0 : ((x300 + x100 * 0.5) * 300) / (total * 300);

    case 2:
      total = x50 + x100 + x300 + katu + xmiss;
      return total === 0 ? 0 : (x50 + x100 + x300) / total;

    case 3:
      total = x50 + x100 + x300 + katu + geki + xmiss;
      return total === 0
        ? 0
        : (x50 * 50 + x100 * 100 + katu * 200 + (x300 + geki) * 300) /
            (total * 300);
  }
};

const numberWithCommas = function (x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const numToMod = function (num) {
  let number = parseInt(num);
  let mod_list = [];

  if (number & (1 << 0)) mod_list.push("NF");
  if (number & (1 << 1)) mod_list.push("EZ");
  if (number & (1 << 3)) mod_list.push("HD");
  if (number & (1 << 4)) mod_list.push("HR");
  if (number & (1 << 5)) mod_list.push("SD");
  if (number & (1 << 9)) mod_list.push("NC");
  else if (number & (1 << 6)) mod_list.push("DT");
  if (number & (1 << 7)) mod_list.push("RX");
  if (number & (1 << 8)) mod_list.push("HT");
  if (number & (1 << 10)) mod_list.push("FL");
  if (number & (1 << 12)) mod_list.push("SO");
  if (number & (1 << 14)) mod_list.push("PF");
  if (number & (1 << 15)) mod_list.push("4 KEY");
  if (number & (1 << 16)) mod_list.push("5 KEY");
  if (number & (1 << 17)) mod_list.push("6 KEY");
  if (number & (1 << 18)) mod_list.push("7 KEY");
  if (number & (1 << 19)) mod_list.push("8 KEY");
  if (number & (1 << 20)) mod_list.push("FI");
  if (number & (1 << 24)) mod_list.push("9 KEY");
  if (number & (1 << 25)) mod_list.push("10 KEY");
  if (number & (1 << 26)) mod_list.push("1 KEY");
  if (number & (1 << 27)) mod_list.push("3 KEY");
  if (number & (1 << 28)) mod_list.push("2 KEY");

  if (mod_list.length == 0) {
    mod_list.push("No mod");
  }
  return mod_list;
};

const calculate_rank = function (miss, acc, mods) {
  let rank;
  if (acc == 100) {
    rank = "X";
  } else if (acc >= 93) {
    if (miss == 0) {
      rank = "S";
    } else {
      rank = "A";
    }
  } else if (acc >= 86) {
    if (miss == 0) {
      rank = "A";
    } else {
      rank = "B";
    }
  } else if (acc >= 81) {
    if (miss == 0) {
      rank = "B";
    } else {
      rank = "C";
    }
  } else {
    rank = "D";
  }

  if (mods.includes("HD") && (rank == "S" || rank == "X")) {
    rank += "H";
  }

  return rank;
};

module.exports = {
  mode,
  calculateAccuracy,
  numberWithCommas,
  numToMod,
  calculate_rank,
};
