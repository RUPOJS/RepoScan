import express from "express";
import cors from "cors";
import { repoRoutes } from "./routes/repoRoutes";
import { chatRoutes } from "./routes/chatRoutes";
import { initWatchers } from "./services/realTimeIndexWatcher";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/repo", repoRoutes);
app.use("/api/chat", chatRoutes);

// live‑reindex webhook (one shared repoPath for demo)
initWatchers(app, process.env.LAST_INDEXED_PATH || "");

export default app;
