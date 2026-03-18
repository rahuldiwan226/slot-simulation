# Slot Engine MVP

A modular, reel-based slot machine engine with a simple web UI and a JSON API suitable for integrating with a Unity client.

## Tech stack

- Backend: Node.js + Express
- Frontend: HTML, CSS, JavaScript (served from the backend)
- Config: JSON files

## Project structure

```
slot-engine/
  src/
    engine/
      rng.js
      reelEngine.js
      paylineEvaluator.js
      bonusEngine.js
      jackpotEngine.js
    config/
      reels.json
      paytable.json
      paylines.json
      jackpot.json
    simulation/
      simulator.js
    api/
      spinController.js
    public/
      index.html
  server.js
  package.json
  README.md
```

## Core behavior

- 5 reels, configurable symbol strips from JSON
- RNG stop position per reel, produces a 5x3 visible grid (3 rows × 5 columns)
- 5 paylines (top, middle, bottom, V, inverted V)
- Wins evaluated left-to-right, minimum 3-of-a-kind, wild substitution supported
- Scatter symbol counted anywhere; 3+ scatters sets `bonus: true`
- Progressive jackpot pool:
  - Each spin contributes a configurable percent of the bet
  - Trigger is configurable (default: random probability)
  - Jackpot pool value is returned in every spin response
- Exposure control: `max_win = bet * 100` (caps total win returned)

## Installation

From the `slot-engine/` folder:

```bash
npm install
```

If PowerShell blocks `npm` scripts on Windows, use:

```bash
npm.cmd install
```

## Run the engine (API + UI)

```bash
npm start
```

If PowerShell blocks `npm` scripts on Windows, use:

```bash
npm.cmd start
```

Open:

- http://localhost:3000/ (or the port printed in the server console if 3000 is in use)

## Trigger spins (API)

### POST /spin

Request:

```json
{ "bet": 100 }
```

Response (minimum required fields):

```json
{
  "grid": [["A","K","Q","J","A"],["A","A","W","Q","S"],["K","Q","A","A","A"]],
  "win": 500,
  "jackpot": 12050,
  "bonus": false
}
```

The response also includes a `details` object with per-line wins and jackpot trigger info to help with testing.

### POST /simulate

Runs a batch simulation and returns summary stats.

Request:

```json
{ "spins": 50000, "bet": 100 }
```

Response:

```json
{
  "spins": 50000,
  "bet": 100,
  "totalWagered": 5000000,
  "totalReturned": 4700000,
  "rtp": 0.94,
  "hitFrequency": 0.33,
  "jackpotTriggerCount": 0,
  "maxWinObserved": 10000
}
```

## Run simulation (CLI)

```bash
npm run simulate -- --spins 100000 --bet 100
```

Notes:

- RTP formula: `RTP = total_returned / total_wagered`
- The simulator uses the same engine modules and configuration as the API.
