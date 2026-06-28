import "dotenv/config";
import express from "express";
import path from "path";
import { MongoClient, Collection } from "mongodb";
import { runScan } from "./scanner";
import type { ScanResult } from "./types";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

let scansCollection: Collection<ScanResult>;

async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  const client = new MongoClient(uri);
  await client.connect();
  scansCollection = client.db("jfrog-scorecard").collection<ScanResult>("scans");
  console.log("MongoDB connected");
}

async function loadHistory(): Promise<ScanResult[]> {
  return scansCollection
    .find({}, { projection: { _id: 0 }, sort: { timestamp: 1 } })
    .toArray();
}

app.get("/api/history", async (_req, res) => {
  res.json(await loadHistory());
});

app.get("/api/latest", async (_req, res) => {
  const h = await loadHistory();
  res.json(h.length ? h[h.length - 1] : null);
});

app.get("/api/scan", async (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event: string, data: unknown) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const history = await loadHistory();
  const prevScore = history.length ? history[history.length - 1].summary.overallScore : undefined;

  runScan(prevScore, async event => {
    if (event.type === "complete") {
      await scansCollection.insertOne({ ...event.result });
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

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🐸 http://localhost:${PORT}`));
});
