import { indexRepository } from "./indexingService";

export function initWatchers(app: any, repoPath: string) {
  app.post("/api/repo/webhook", async (_, res) => {
    if (repoPath) await indexRepository(repoPath);
    res.sendStatus(202);
  });
}
