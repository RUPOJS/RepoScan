import { indexRepository } from './indexingService';

/**
 * initWatchers: sets up endpoints or watchers for real-time updates.
 * Example: a GitHub webhook receiving push events, re-indexing changed files.
 */
export function initWatchers(app: any, repoPath: string) {
  app.post('/webhook', async (req: any, res: any) => {
    // parse event from GitHub: what files changed, commits, etc.
    // re-index the changed files or entire repo:
    await indexRepository(repoPath);
    res.sendStatus(200);
  });
}
