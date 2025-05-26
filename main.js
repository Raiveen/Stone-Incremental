function E(x) { return new Decimal(x); }
var player = {
  stone: E(0),
  upgrades: {
    stoneGain: { level: 0, cost: E(5), effect: E(1) },
    stoneBoost: { level: 0, cost: E(500) }
  },
  prestige: { unl: false, level: 0, cost: E(100), locked: false },
  rebirth: {
    unlocked: false,
    count: 0,
    copper: E(0),
    copperGain: E(0),
    buyables: [
      { bought: false, cost: E(5), desc: "Multiply stone gain by 3" },
      { bought: false, cost: E(50), desc: "Boost stone gain by ^1.2" },
      { bought: false, cost: E(400), desc: "Divide prestige cost by 5" },
    ]
  }
};

const rebirthInfos = [
  "Unlock copper and copper buyables.",
  "Unlock tin and tba",
];

function format(x) {
  return (typeof x === "object" && x.toFixed) ? x.toFixed(2) : Number(x).toFixed(2);
}

function setElemText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = text;
}

function setElemDisplay(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? "" : "none";
}

function update() {
  setElemText("stonemined", format(player.stone) + " Stone");
  setElemText("stoneminedpersecond", "(" + format(stonegain().mul(100)) + "/s)");
  setElemText("stoneUpgradeInfo",
    "Multiply stone gain by +" + format(stonegaineffect()) + "x (x" +
    format(player.upgrades.stoneGain.level * stonegaineffect() + 1) + ")"
  );
  const stoneUpgradeBtn = document.getElementById("stoneUpgradeBtn");
  if (stoneUpgradeBtn)
    stoneUpgradeBtn.innerText = "Cost: " + format(player.upgrades.stoneGain.cost) + " Stone";

  // Stone Boost upgrade info and button
  const stoneBoostUpgradeElem = document.getElementById("stoneBoostUpgradeInfo");
  if (stoneBoostUpgradeElem) {
    const boost = player.upgrades.stoneBoost.level * 0.75;
    stoneBoostUpgradeElem.innerHTML =
      "Boost 1st upgrade effect by +0.75x each (+" +
      format(player.prestige.level >= 5 ? E(boost).pow(2) : E(boost)) + "x)";
  }
  const stoneBoostUpgradeBtn = document.getElementById("stoneBoostUpgradeBtn");
  const stoneBoostUpgradeMaxBtn = document.getElementById("stoneBoostUpgradeMaxBtn");
  const showBoost = player.prestige.level >= 4;
  if (stoneBoostUpgradeBtn) {
    stoneBoostUpgradeBtn.innerText = "Cost: " + format(player.upgrades.stoneBoost.cost) + " Stone";
    stoneBoostUpgradeBtn.style.display = showBoost ? "" : "none";
  }
  if (stoneBoostUpgradeMaxBtn) stoneBoostUpgradeMaxBtn.style.display = showBoost ? "" : "none";
  if (stoneBoostUpgradeElem) stoneBoostUpgradeElem.style.display = showBoost ? "" : "none";

  // Prestige
  if (player.stone.gte(100) || player.prestige.unl) {
    player.prestige.unl = true;
    setElemDisplay("prestige", true);
  }
  setElemDisplay("prestige", player.prestige.unl);

  const prestigeInfoElem = document.getElementById("prestigeInfo");
  if (prestigeInfoElem) {
    prestigeInfoElem.innerText = player.prestige.level = 5 && player.rebirth.unlocked
      ? "Buy a mine for more pickaxes."
      : (prestigeInfos[player.prestige.level] || "No more prestige levels.") +
        "\nCost: " + format(player.prestige.cost) + " Stone";
  }

  // Copper and rebirth UI
  setElemText("copper", player.rebirth.unlocked ? format(player.rebirth.copper) + " Copper" : "");
  setElemText("coppergainedpersecond", player.rebirth.unlocked ? "(" + format(getCopperGain().mul(100)) + "/s)" : "");

  const rebirthBtn = document.getElementById("rebirth");
  if (rebirthBtn) {
    rebirthBtn.style.display = (player.prestige.level >= 5 || player.rebirth.unlocked) ? "" : "none";
    rebirthBtn.innerText = player.rebirth.unlocked
      ? (rebirthInfos[player.rebirth.count] || "No more rebirth upgrades.") +
        "\nRequires: Prestige " + format(getRebirthCost())
      : "Buy a Copper Mine\nRequires: Prestige 5";
  }

  // Buyables UI
  player.rebirth.buyables.forEach((b, i) => {
    const buyBtn = document.getElementById("buyable" + i);
    if (buyBtn) {
      buyBtn.style.display = player.rebirth.unlocked ? "" : "none";
      buyBtn.disabled = b.bought || player.rebirth.copper.lt(b.cost);
      buyBtn.innerText = b.bought
        ? "Bought (" + b.desc + ")"
        : "Buyable " + (i + 1) + ": " + b.desc + " (Cost: " + format(b.cost) + " Copper)";
    }
  });
}

function stonegain() {
  let x = E(1).mul(player.upgrades.stoneGain.level * stonegaineffect() + 1);
  if (player.prestige.level >= 1) x = x.mul(3);
  if (player.prestige.level >= 3) x = x.mul(E(1.5).pow(player.prestige.level));
  // Apply rebirth buyable 2 effect: boost stone gain by ^1.2
  if (player.rebirth.buyables[1] && player.rebirth.buyables[1].bought) {
    x = x.pow(1.2);
  }
  // Apply rebirth buyable 1 effect: multiply stone gain by 3
  if (player.rebirth.buyables[0] && player.rebirth.buyables[0].bought) {
    x = x.mul(3);
  }
  return x.div(100);
}

function stonegaineffect() {
  let x = E(1);
  if (player.prestige.level >= 2) x = x.add(1.5);
  if (player.prestige.level >= 5)
    x = x.add(E(0.75).mul(player.upgrades.stoneBoost.level).pow(2));
  else if (player.prestige.level >= 4)
    x = x.add(E(0.75).mul(player.upgrades.stoneBoost.level));
  player.upgrades.stoneGain.effect = x;
  return x;
}

function getCopperGain() {
  let x = E(1);
  if (player.prestige.level >= 6) x = x.mul(3);
  return x.div(100);
}

// Main game loop (combine update and tick logic for efficiency)
setInterval(function () {
  player.stone = player.stone.add(stonegain());
  if (player.rebirth.unlocked)
    player.rebirth.copper = player.rebirth.copper.add(player.rebirth.copperGain || E(0));
  update();
}, 10);

// Save game loop
setInterval(function () {
  localStorage.setItem("stoneSave", JSON.stringify(player));
}, 15000);

// Load game
var savegame = JSON.parse(localStorage.getItem("stoneSave"));
if (savegame !== null) {
  if (savegame.stone !== undefined) player.stone = E(savegame.stone);
  if (savegame.upgrades !== undefined) {
    if (savegame.upgrades.stoneGain !== undefined) {
      player.upgrades.stoneGain.level = savegame.upgrades.stoneGain.level;
      player.upgrades.stoneGain.cost = E(savegame.upgrades.stoneGain.cost);
      player.upgrades.stoneGain.effect = savegame.upgrades.stoneGain.effect !== undefined
        ? E(savegame.upgrades.stoneGain.effect)
        : E(1);
    }
    if (savegame.upgrades.stoneBoost !== undefined) {
      player.upgrades.stoneBoost.level = savegame.upgrades.stoneBoost.level;
      player.upgrades.stoneBoost.cost = E(savegame.upgrades.stoneBoost.cost);
    }
  }
  if (savegame.prestige !== undefined) {
    player.prestige.unl = savegame.prestige.unl !== undefined ? savegame.prestige.unl : false;
    player.prestige.level = savegame.prestige.level !== undefined ? savegame.prestige.level : 0;
    player.prestige.cost = savegame.prestige.cost !== undefined
      ? E(savegame.prestige.cost)
      : E(100);
  }
  if (savegame.rebirth !== undefined) {
    player.rebirth.unlocked = savegame.rebirth.unlocked || false;
    player.rebirth.count = savegame.rebirth.count || 0;
    player.rebirth.copper = savegame.rebirth.copper !== undefined ? E(savegame.rebirth.copper) : E(0);
    player.rebirth.copperGain = savegame.rebirth.copperGain !== undefined ? E(savegame.rebirth.copperGain) : E(0);
    if (Array.isArray(savegame.rebirth.buyables)) {
      for (let i = 0; i < player.rebirth.buyables.length; i++) {
        if (savegame.rebirth.buyables[i]) {
          player.rebirth.buyables[i].bought = savegame.rebirth.buyables[i].bought || false;
        }
      }
    }
  }
  update();
}

function reset() {
  localStorage.removeItem("stoneSave");
  player.stone = E(0);
  player.upgrades.stoneGain.level = 0;
  player.upgrades.stoneGain.cost = E(5);
  player.upgrades.stoneGain.effect = E(1);
  player.upgrades.stoneBoost.level = 0;
  player.upgrades.stoneBoost.cost = E(500);
  player.prestige.unl = false;
  player.prestige.level = 0;
  player.prestige.cost = E(100);
  player.rebirth.unlocked = false;
  player.rebirth.count = 0;
  player.rebirth.copper = E(0);
  player.rebirth.copperGain = E(0);
  player.rebirth.buyables.forEach(b => b.bought = false);
  update();
}

function setVisible(id) {
  setElemDisplay(id, true);
}

function buyUpgrade(type) {
  var upgrade = player.upgrades[type];
  if (!upgrade) return;
  if (player.stone.gte(upgrade.cost)) {
    player.stone = player.stone.sub(upgrade.cost);
    upgrade.level += 1;
    if (type === "stoneGain") upgrade.cost = upgrade.cost.mul(1.5);
    if (type === "stoneBoost") {
      let x = E(upgrade.level + 1);
      upgrade.cost = upgrade.cost.mul(x.pow(x.mul(0.15)));
    }
    update();
  }
}

function buyMaxUpgrade(type) {
  var upgrade = player.upgrades[type];
  if (!upgrade) return;
  while (player.stone.gte(upgrade.cost)) {
    player.stone = player.stone.sub(upgrade.cost);
    upgrade.level += 1;
    upgrade.cost = upgrade.cost.mul(1.5);
  }
  update();
}

const prestigeInfos = [
  "Buy a better pickaxe: wooden pickaxe (3x stone gain)",
  "Buy a better pickaxe: stone pickaxe (1st upgrade is +2.5x).",
  "Buy a better pickaxe: copper pickaxe (1.4x stone per prestige level).",
  "Buy a better pickaxe: tin pickaxe (Unlock the 2nd upgrade).",
  "Buy a better pickaxe: iron pickaxe (Square 2nd upgrade effect).",
  "Buy a better pickaxe: steel pickaxe (3x copper gain).",
];

function prestigeAction() {
  if (player.stone.gte(player.prestige.cost) && !player.prestige.locked) {
    player.stone = E(0);
    player.upgrades.stoneGain.level = 0;
    player.upgrades.stoneGain.cost = E(5);
    player.upgrades.stoneGain.effect = E(1);
    player.upgrades.stoneBoost.level = 0;
    player.upgrades.stoneBoost.cost = E(500);
    player.prestige.unl = true;
    player.prestige.level += 1;
    let x = player.prestige.level + 1;
    let cost = E(100).mul(E(x).pow(x * 0.85));
    // Apply rebirth buyable 3 effect: decrease prestige cost by half
    if (player.rebirth.buyables[2] && player.rebirth.buyables[2].bought) {
      cost = cost.div(5);
    }
    player.prestige.cost = cost;
    if (player.prestige.level >= 5) player.prestige.locked = true;
    update();
  }
}

function unlockPrestige() {
  player.prestige.locked = false;
  update();
}

function rebirthAction() {
  if (!player.rebirth.unlocked && player.prestige.level >= 5) {
    let copperGain = getCopperGain();
    player.rebirth.copper = player.rebirth.copper.add(copperGain);
    player.rebirth.copperGain = copperGain;
    player.rebirth.unlocked = true;
    player.rebirth.count = 1;
    player.stone = E(0);
    player.upgrades.stoneGain.level = 0;
    player.upgrades.stoneGain.cost = E(5);
    player.upgrades.stoneGain.effect = E(1);
    player.upgrades.stoneBoost.level = 0;
    player.upgrades.stoneBoost.cost = E(500);
    player.prestige.unl = false;
    player.prestige.level = 0;
    player.prestige.cost = E(100);
    player.prestige.locked = false;
    update();
    return;
  }
  if (player.rebirth.unlocked && player.rebirth.copper.gte(getRebirthCost())) {
    player.rebirth.copper = player.rebirth.copper.sub(getRebirthCost());
    player.rebirth.count += 1;
    player.stone = E(0);
    player.upgrades.stoneGain.level = 0;
    player.upgrades.stoneGain.cost = E(5);
    player.upgrades.stoneGain.effect = E(1);
    player.upgrades.stoneBoost.level = 0;
    player.upgrades.stoneBoost.cost = E(500);
    player.prestige.unl = false;
    player.prestige.level = 0;
    player.prestige.cost = E(100);
    player.prestige.locked = false;
    update();
  }
}

function buyRebirthBuyable(i) {
  if (!player.rebirth.unlocked) return;
  let b = player.rebirth.buyables[i];
  if (b.bought) return;
  if (player.rebirth.copper.gte(b.cost)) {
    player.rebirth.copper = player.rebirth.copper.sub(b.cost);
    b.bought = true;
    // Apply buyable effects immediately if needed
    if (i === 0) {
      // First buyable: multiply current stone by 3
      player.stone = player.stone.mul(3);
    }
    update();
  }
}

function getRebirthCost() {
  return E(1).mul(E(10).pow(player.rebirth.count));
}
