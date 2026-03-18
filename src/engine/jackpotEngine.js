const { SCATTER_SYMBOL } = require("./paylineEvaluator");

function createJackpotEngine({ rng, jackpotConfig }) {
  const contributionPercent =
    Number(jackpotConfig?.contributionPercent) >= 0
      ? Number(jackpotConfig.contributionPercent)
      : 0.02;
  const seedPool =
    Number(jackpotConfig?.seedPool) >= 0 ? Number(jackpotConfig.seedPool) : 10000;

  const trigger = jackpotConfig?.trigger || { type: "random", probability: 0.00001 };
  let pool = Number(jackpotConfig?.initialPool) >= 0 ? Number(jackpotConfig.initialPool) : seedPool;

  function contribute(bet) {
    const contribution = Math.floor(bet * contributionPercent);
    pool += contribution;
    return contribution;
  }

  function countSymbol(grid, symbol) {
    let count = 0;
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if (grid?.[row]?.[col] === symbol) count += 1;
      }
    }
    return count;
  }

  function shouldTrigger({ grid }) {
    if (trigger.type === "combo") {
      if (trigger.symbol === SCATTER_SYMBOL) {
        const needed = Number(trigger.count) || 5;
        return countSymbol(grid, SCATTER_SYMBOL) >= needed;
      }
      return false;
    }

    const probability =
      Number(trigger.probability) > 0 ? Number(trigger.probability) : 0.00001;
    return rng.randomFloat() < probability;
  }

  function maybeTrigger({ grid }) {
    if (!shouldTrigger({ grid })) return { won: false, payout: 0 };
    const payout = pool;
    pool = seedPool;
    return { won: true, payout };
  }

  function getPool() {
    return pool;
  }

  return { contribute, maybeTrigger, getPool };
}

module.exports = { createJackpotEngine };

