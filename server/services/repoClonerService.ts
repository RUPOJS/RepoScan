import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { indexRepository } from './indexingService';
import crypto from "crypto";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_REPOS_BASE = path.join(__dirname, '../../temp-repos');

function injectTokenIntoUrl(url: string, token: string) {
  return url.replace('https://', `https://x-access-token:${token}@`);
}

function slug(str: string) {
    return crypto.createHash("sha1").update(str).digest("hex").slice(0, 20);
  }
  

export async function cloneAndIndexRepo(repoUrl: string, token?: string) {
  fs.mkdirSync(TEMP_REPOS_BASE, { recursive: true });
  const localPath = path.join(TEMP_REPOS_BASE, `repo-${Date.now()}`);

  const cloneUrl = token ? injectTokenIntoUrl(repoUrl, token) : repoUrl;
  console.log('Cloning', cloneUrl);
  execSync(`git clone --depth 1 "${cloneUrl}" "${localPath}"`, { stdio: 'inherit' });

  await indexRepository(localPath);
  process.env.LAST_INDEXED_COLLECTION = slug(localPath);
}
