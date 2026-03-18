function createReelEngine({ rng, reelsConfig }) {
  const reels = reelsConfig?.reels;
  if (!Array.isArray(reels) || reels.length !== 5) {
    throw new Error("reels.json must contain { reels: [ ...5 reels... ] }");
  }

  const normalizedReels = reels.map((strip, idx) => {
    if (!Array.isArray(strip) || strip.length < 3) {
      throw new Error(`Reel ${idx + 1} must be an array with at least 3 symbols`);
    }
    return strip.map(String);
  });

  function spinStops() {
    return normalizedReels.map((strip) => rng.randomInt(strip.length));
  }

  function stopToWindow(strip, stopIndex) {
    const len = strip.length;
    return [0, 1, 2].map((offset) => strip[(stopIndex + offset) % len]);
  }

  function spinGrid() {
    const stops = spinStops();
    const columns = normalizedReels.map((strip, reelIndex) =>
      stopToWindow(strip, stops[reelIndex])
    );

    const grid = [[], [], []];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        grid[row][col] = columns[col][row];
      }
    }

    return grid;
  }

  return { spinGrid };
}

module.exports = { createReelEngine };

