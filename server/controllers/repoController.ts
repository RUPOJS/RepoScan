import { Request, Response } from 'express';
import { cloneAndIndexRepo } from '../services/repoClonerService';

export async function addRepository(req: Request, res: Response) {
  try {
    const { repoUrl, token } = req.body;
    await cloneAndIndexRepo(repoUrl, token);
    return res.json({ message: 'Repository indexed!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to index repository' });
  }
}
