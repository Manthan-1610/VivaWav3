import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/api", apiRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`ViVaWav3 API listening on http://localhost:${port}`);
});
