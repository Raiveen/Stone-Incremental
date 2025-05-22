function E(x) { return new Decimal(x); }
var player = {
  stone: E(0),
  upgrades: {
    stoneGain: { level: 0, cost: E(5), effect: E(1) },
    stoneBoost: { level: 0, cost: E(500) } // New upgrade
  },
  prestige: { unl: false, level: 0, cost: E(100) }
}


function format(x) {
  // Simple format function for Decimal or number
  if (typeof x === "object" && x.toFixed) return x.toFixed(2);
  return Number(x).toFixed(2);
}

function update() {
  var stoneElem = document.getElementById("stonemined");
  if (stoneElem) stoneElem.innerHTML = format(player.stone) + " Stone";

  var stoneGainElem = document.getElementById("stoneminedpersecond");
  if (stoneGainElem) stoneGainElem.innerHTML = "("+format(stonegain().mul(100)) + "/s)";
  
  var stoneGainUpgradeElem = document.getElementById("stoneUpgradeInfo");
  if (stoneGainUpgradeElem) stoneGainUpgradeElem.innerHTML =
      "Multiply stone gain by +" + stonegaineffect() + "x (x" + format(player.upgrades.stoneGain.level*stonegaineffect()+1) + ")";

  var stoneUpgradeBtn = document.getElementById("stoneUpgradeBtn");
  if (stoneUpgradeBtn) {
    stoneUpgradeBtn.innerText = "Cost: " + format(player.upgrades.stoneGain.cost) + " Stone";
  }

  // Stone Boost upgrade info and button
  var stoneBoostUpgradeElem = document.getElementById("stoneBoostUpgradeInfo");
  if (stoneBoostUpgradeElem) stoneBoostUpgradeElem.innerHTML =
    "Boost 1st upgrade effect by +0.5x each (+" + player.upgrades.stoneBoost.level*0.5 + "x)";
  var stoneBoostUpgradeBtn = document.getElementById("stoneBoostUpgradeBtn");
  if (stoneBoostUpgradeBtn) {
    stoneBoostUpgradeBtn.innerText = "Cost: " + format(player.upgrades.stoneBoost.cost) + " Stone";
    // Unlock after prestige level 3
    document.getElementById("stoneBoostUpgradeMaxBtn").style.display = player.prestige.level >= 4 ? "" : "none";
    stoneBoostUpgradeBtn.style.display = player.prestige.level >= 4 ? "" : "none";
    if (stoneBoostUpgradeElem) stoneBoostUpgradeElem.style.display = player.prestige.level >= 4 ? "" : "none";
  }

  // Once player reaches 100 stone, prestige button stays visible forever
  if (player.stone.gte(100) || player.prestige.unl) {
    player.prestige.unl = true;
    setVisible("prestige");
  }

  // Prestige button info
  var prestigeBtn = document.getElementById("prestige");
  var prestigeInfoElem = document.getElementById("prestigeInfo");
  if (prestigeBtn) {
    prestigeBtn.style.display = player.prestige.unl ? "" : "none";
  }
  if (prestigeInfoElem) {
    prestigeInfoElem.innerText =
      (prestigeInfos[player.prestige.level] || "No more prestige levels.") +
      "\nCost: " + format(player.prestige.cost) + " Stone";
  }
}

function stonegain() {
  let x = E(1);
  x = x.mul(player.upgrades.stoneGain.level*stonegaineffect()+1);
  if (player.prestige.level >= 1) x = x.mul(2.5);
  if (player.prestige.level >= 3) x = x.mul(E(1.4).pow(player.prestige.level));
  return x.div(100);
}

function stonegaineffect() {
  let x = E(1);
  if (player.prestige.level >= 2) x = x.add(1.5);
  // Add boost from stoneBoost upgrade
  if (player.prestige.level >= 4) x = x.add(E(0.5).mul(player.upgrades.stoneBoost.level));
  player.upgrades.stoneGain.effect = x;
  return x;
}

// Stone gain per second
setInterval(function() {
  player.stone = player.stone.add(stonegain());
  update();
}, 10);

function buyUpgrade(type) {
  var upgrade = player.upgrades[type];
  if (!upgrade) return; // prevent buying non-existent upgrades
  if (player.stone.gte(upgrade.cost)) {
    player.stone = player.stone.sub(upgrade.cost);
    upgrade.level += 1;
    if (type === "stoneGain")  upgrade.cost = upgrade.cost.mul(1.6);
    if (type === "stoneBoost") {
      let x = E(upgrade.level+1);
      upgrade.cost = upgrade.cost.mul(x.pow(x.mul(0.2)));
    }
    update();
  }
}

function buyMaxUpgrade(type) {
  var upgrade = player.upgrades[type];
  if (!upgrade) return;
  // Buy as many as possible
  while (player.stone.gte(upgrade.cost)) {
    player.stone = player.stone.sub(upgrade.cost);
    upgrade.level += 1;
    upgrade.cost = upgrade.cost.mul(1.5);
  }
  update();
}

// Prestige info placeholders and cost scaling
const prestigeInfos = [
  "Buy a better pickaxe: wooden pickaxe (2.5x stone gain)",
  "Buy a better pickaxe: stone pickaxe (1st upgrade is +2.5x).",
  "Buy a better pickaxe: copper pickaxe (1.4x stone per prestige level).",
  "Buy a better pickaxe: tin pickaxe (Unlock the 2nd upgrade).",
];



var mainGameLoop = window.setInterval(function() {
  update()
}, 100)

var saveGameLoop = window.setInterval(function() {
  localStorage.setItem("stoneSave", JSON.stringify(player))
}, 15000)


var savegame = JSON.parse(localStorage.getItem("stoneSave"))
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
    // Restore stoneBoost upgrade
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
  update()
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
  update();
}

function setVisible(id) {
  var elem = document.getElementById(id);
  if (elem) {
    elem.style.display = "";
  }
}

function prestigeAction() {
  if (player.stone.gte(player.prestige.cost)) {
    player.stone = E(0);
    player.upgrades.stoneGain.level = 0;
    player.upgrades.stoneGain.cost = E(5);
    player.upgrades.stoneGain.effect = E(1);
    player.upgrades.stoneBoost.level = 0;
    player.upgrades.stoneBoost.cost = E(500);
    player.prestige.unl = true;
    player.prestige.level += 1;
    let x = player.prestige.level+1;
    player.prestige.cost = E(100).mul(E(x).pow(x*0.85));
    update();
  }
}
