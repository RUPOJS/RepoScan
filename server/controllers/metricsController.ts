import { Request, Response } from "express";
import { getDashboard, getAuthorBreakdown, buildGraph } from "../services/metricsService";

export async function getMetrics(req: Request, res: Response) {
  const repo = process.env.LAST_INDEXED_COLLECTION || "default";
  return res.json(await getDashboard(repo));
}

export async function getAuthors(req: Request, res: Response) {
  const repo = process.env.LAST_INDEXED_COLLECTION || "default";
  return res.json(await getAuthorBreakdown(repo));
}

export async function getGraph(req: Request, res: Response) {
  const repoPath = process.env.LAST_INDEXED_PATH || "";
  return res.json(await buildGraph(repoPath));
}
