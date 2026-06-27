import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { runScan } from "./scanner";
import type { ScanResult } from "./types";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const DATA_FILE = path.join(__dirname, "..", "data", "results.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function loadHistory(): ScanResult[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); }
  catch { return []; }
}

function saveHistory(history: ScanResult[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
}

app.get("/api/history", (_req, res) => res.json(loadHistory()));
app.get("/api/latest", (_req, res) => {
  const h = loadHistory();
  res.json(h.length ? h[h.length - 1] : null);
});

app.get("/api/scan", (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event: string, data: unknown) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const history = loadHistory();
  const prevScore = history.length ? history[history.length - 1].summary.overallScore : undefined;

  runScan(prevScore, event => {
    if (event.type === "complete") {
      history.push(event.result);
      saveHistory(history);
      send("complete", event.result);
      res.end();
    } else {
      send(event.type, event);
    }
  }).catch(err => {
    send("error", { message: String(err) });
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`🐸 http://localhost:${PORT}`);
});
