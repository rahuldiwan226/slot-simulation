function runSimulation({ spins, bet, engine }) {
  let totalWagered = 0;
  let totalReturned = 0;
  let hitCount = 0;
  let jackpotTriggerCount = 0;
  let maxWinObserved = 0;

  for (let i = 0; i < spins; i += 1) {
    totalWagered += bet;
    const result = engine.spin({ bet });
    totalReturned += result.win;
    if (result.win > 0) hitCount += 1;
    if (result.details?.jackpotWon) jackpotTriggerCount += 1;
    if (result.win > maxWinObserved) maxWinObserved = result.win;
  }

  const rtp = totalWagered > 0 ? totalReturned / totalWagered : 0;
  const hitFrequency = spins > 0 ? hitCount / spins : 0;

  return {
    spins,
    bet,
    totalWagered,
    totalReturned,
    rtp,
    hitFrequency,
    jackpotTriggerCount,
    maxWinObserved
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--")) continue;
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

function createDefaultEngine() {
  const path = require("path");
  const { createRng } = require("../engine/rng");
  const { createReelEngine } = require("../engine/reelEngine");
  const { createPaylineEvaluator } = require("../engine/paylineEvaluator");
  const { createBonusEngine } = require("../engine/bonusEngine");
  const { createJackpotEngine } = require("../engine/jackpotEngine");

  const reelsConfig = require(path.join(__dirname, "..", "config", "reels.json"));
  const paylinesConfig = require(path.join(__dirname, "..", "config", "paylines.json"));
  const paytableConfig = require(path.join(__dirname, "..", "config", "paytable.json"));
  const jackpotConfig = require(path.join(__dirname, "..", "config", "jackpot.json"));

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
      jackpotEngine.contribute(bet);
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
          jackpotWon: jackpotResult.won,
          jackpotPayout: jackpotResult.payout,
          scatters: bonusEngine.countScatters({ grid })
        }
      };
    }
  };
}

if (require.main === module) {
  const args = parseArgs(process.argv);
  const spins = Number(args.spins ?? 100000);
  const bet = Number(args.bet ?? 100);

  if (!Number.isFinite(spins) || spins <= 0 || Math.floor(spins) !== spins) {
    process.stderr.write("Invalid --spins (positive integer)\n");
    process.exit(1);
  }
  if (!Number.isFinite(bet) || bet <= 0) {
    process.stderr.write("Invalid --bet (positive number)\n");
    process.exit(1);
  }

  const engine = createDefaultEngine();
  const summary = runSimulation({ spins, bet, engine });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

module.exports = { runSimulation };

