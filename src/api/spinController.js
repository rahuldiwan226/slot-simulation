const path = require("path");
const express = require("express");

const { createRng } = require("../engine/rng");
const { createReelEngine } = require("../engine/reelEngine");
const { createPaylineEvaluator } = require("../engine/paylineEvaluator");
const { createBonusEngine } = require("../engine/bonusEngine");
const { createJackpotEngine } = require("../engine/jackpotEngine");

const { runSimulation } = require("../simulation/simulator");

function loadJsonConfig(configFileName) {
  return require(path.join(__dirname, "..", "config", configFileName));
}

function createEngine() {
  const reelsConfig = loadJsonConfig("reels.json");
  const paylinesConfig = loadJsonConfig("paylines.json");
  const paytableConfig = loadJsonConfig("paytable.json");
  const jackpotConfig = loadJsonConfig("jackpot.json");

  const rng = createRng();
  const reelEngine = createReelEngine({ rng, reelsConfig });
  const paylineEvaluator = createPaylineEvaluator({
    paylinesConfig,
    paytableConfig
  });
  const bonusEngine = createBonusEngine();
  const jackpotEngine = createJackpotEngine({ rng, jackpotConfig });

  return {
    spin: ({ bet }) => {
      const contribution = jackpotEngine.contribute(bet);
      const grid = reelEngine.spinGrid();
      const lineWins = paylineEvaluator.evaluate({ grid, bet });
      const bonus = bonusEngine.isBonusTriggered({ grid });
      const jackpotResult = jackpotEngine.maybeTrigger({ grid, bet });

      const maxWin = bet * 100;
      const uncappedWin = lineWins.totalWin + jackpotResult.payout;
      const win = Math.min(uncappedWin, maxWin);

      return {
        grid,
        win,
        jackpot: jackpotEngine.getPool(),
        bonus,
        details: {
          bet,
          lineWins: lineWins.wins,
          lineWinTotal: lineWins.totalWin,
          maxWin,
          jackpotContribution: contribution,
          jackpotWon: jackpotResult.won,
          jackpotPayout: jackpotResult.payout,
          scatters: bonusEngine.countScatters({ grid })
        }
      };
    }
  };
}

function createSpinRouter() {
  const router = express.Router();
  const engine = createEngine();

  router.post("/spin", (req, res) => {
    const betRaw = req.body?.bet;
    const bet = Number(betRaw);

    if (!Number.isFinite(bet) || bet <= 0) {
      res.status(400).json({ error: "Invalid bet. Provide a positive number." });
      return;
    }

    res.json(engine.spin({ bet }));
  });

  router.post("/simulate", (req, res) => {
    const spins = Number(req.body?.spins);
    const bet = Number(req.body?.bet);

    if (!Number.isFinite(spins) || spins <= 0 || Math.floor(spins) !== spins) {
      res
        .status(400)
        .json({ error: "Invalid spins. Provide a positive integer." });
      return;
    }

    if (!Number.isFinite(bet) || bet <= 0) {
      res.status(400).json({ error: "Invalid bet. Provide a positive number." });
      return;
    }

    const summary = runSimulation({ spins, bet, engine });
    res.json(summary);
  });

  return router;
}

module.exports = { createSpinRouter };
