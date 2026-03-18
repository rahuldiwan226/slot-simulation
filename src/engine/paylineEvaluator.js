const WILD_SYMBOL = "W";
const SCATTER_SYMBOL = "S";

function createPaylineEvaluator({ paylinesConfig, paytableConfig }) {
  const paylines = paylinesConfig?.paylines;
  if (!Array.isArray(paylines) || paylines.length === 0) {
    throw new Error("paylines.json must contain { paylines: [...] }");
  }

  const paytable = paytableConfig || {};

  function getCell(grid, row, col) {
    return grid?.[row]?.[col];
  }

  function getPayMultiplier(symbol, count) {
    const entry = paytable?.[symbol];
    if (!entry) return 0;
    const multiplier = entry[String(count)];
    return Number.isFinite(Number(multiplier)) ? Number(multiplier) : 0;
  }

  function evaluateLine({ grid, lineRows, bet }) {
    let baseSymbol = null;
    let count = 0;

    for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
      const symbol = getCell(grid, lineRows[reelIndex], reelIndex);
      if (!symbol || symbol === SCATTER_SYMBOL) break;

      if (!baseSymbol) {
        count += 1;
        if (symbol !== WILD_SYMBOL) baseSymbol = symbol;
        continue;
      }

      if (symbol === baseSymbol || symbol === WILD_SYMBOL) {
        count += 1;
      } else {
        break;
      }
    }

    if (!baseSymbol) baseSymbol = WILD_SYMBOL;

    if (count < 3) return { win: 0, symbol: baseSymbol, count };

    const multiplier = getPayMultiplier(baseSymbol, count);
    const win = Math.floor(multiplier * bet);

    return { win, symbol: baseSymbol, count, multiplier };
  }

  function evaluate({ grid, bet }) {
    const wins = [];
    let totalWin = 0;

    for (const payline of paylines) {
      const id = payline.id ?? String(wins.length + 1);
      const rows = payline.rows;
      if (!Array.isArray(rows) || rows.length !== 5) continue;

      const result = evaluateLine({ grid, lineRows: rows, bet });
      if (result.win > 0) {
        wins.push({ id, rows, ...result });
        totalWin += result.win;
      }
    }

    return { totalWin, wins };
  }

  return { evaluate };
}

module.exports = { createPaylineEvaluator, WILD_SYMBOL, SCATTER_SYMBOL };

