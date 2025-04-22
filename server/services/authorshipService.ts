import { execSync } from 'child_process';

interface BlameResult {
  authorName: string;
  authorEmail: string;
}

export function getAuthorshipInfo(repoPath: string, filePath: string): BlameResult[] {
  try {
    const output = execSync(`git -C "${repoPath}" blame -p -- "${filePath}"`).toString();
    return parseBlame(output);
  } catch (err) {
    console.error('Blame failed:', err);
    return [];
  }
}

function parseBlame(str: string): BlameResult[] {
  const authors = new Set<string>();
  str.split('\n').forEach(l => {
    if (l.startsWith('author ')) authors.add(l.replace('author ', '').trim());
  });
  return Array.from(authors).map(a => ({ authorName: a, authorEmail: 'unknown@example.com' }));
}
