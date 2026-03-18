const path = require("path");
const express = require("express");

const { createSpinRouter } = require("./src/api/spinController");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "src", "public")));

app.use("/", createSpinRouter());

const preferredPort = process.env.PORT ? Number(process.env.PORT) : 3000;
const maxPortAttempts = 20;

function listenWithFallback(startPort) {
  let attemptPort = startPort;

  const server = app.listen(attemptPort, () => {
    process.stdout.write(`Slot Engine listening on http://localhost:${attemptPort}\n`);
  });

  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE" && attemptPort < startPort + maxPortAttempts) {
      attemptPort += 1;
      server.close(() => {
        listenWithFallback(attemptPort);
      });
      return;
    }
    process.stderr.write(`${err?.stack || err}\n`);
    process.exit(1);
  });
}

listenWithFallback(preferredPort);
