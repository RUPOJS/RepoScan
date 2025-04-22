import { Router } from "express";
import { addRepository } from "../controllers/repoController";
import { getMetrics, getAuthors, getGraph } from "../controllers/metricsController";

export const repoRoutes = Router();

repoRoutes.post("/", addRepository);
repoRoutes.get("/metrics", getMetrics);
repoRoutes.get("/authors", getAuthors);
repoRoutes.get("/graph", getGraph);
