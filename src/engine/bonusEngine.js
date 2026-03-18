const { SCATTER_SYMBOL } = require("./paylineEvaluator");

function createBonusEngine() {
  function countScatters({ grid }) {
    let count = 0;
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if (grid?.[row]?.[col] === SCATTER_SYMBOL) count += 1;
      }
    }
    return count;
  }

  function isBonusTriggered({ grid }) {
    return countScatters({ grid }) >= 3;
  }

  return { countScatters, isBonusTriggered };
}

module.exports = { createBonusEngine };

