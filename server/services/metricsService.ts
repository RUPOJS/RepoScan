import Database from "better-sqlite3";
import path from "path";
import madge from "madge";

const db = new Database(path.join(process.cwd(), "metrics.db"));

db.exec(`CREATE TABLE IF NOT EXISTS snapshot(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER,
  repo TEXT,
  file TEXT,
  complexity INT,
  smells TEXT,
  authors TEXT
)`);

export function saveSnapshot(meta: any) {
  db.prepare(`INSERT INTO snapshot (ts,repo,file,complexity,smells,authors)
              VALUES (@ts,@repo,@file,@complexity,@smells,@authors)`).run({
    ts: Date.now(),
    repo: meta.repo,
    file: meta.filePath,
    complexity: meta.complexity,
    smells: JSON.stringify(meta.antiPatterns),
    authors: JSON.stringify(meta.authors),
  });
}

export function getDashboard(repo: string) {
  return db.prepare(`
    SELECT ROUND(AVG(complexity),2) as avgComplex,
           COUNT(*)                   as chunks
    FROM snapshot WHERE repo=@repo
  `).get({ repo });
}

export function getAuthorBreakdown(repo: string) {
  return db.prepare(`
    SELECT json_each.value  AS author,
           COUNT(*)         AS lines
    FROM snapshot, json_each(authors)
    WHERE repo=@repo
    GROUP BY author
    ORDER BY lines DESC
  `).all({ repo });
}

export async function buildGraph(repoPath: string) {
  if (!repoPath) return {};
  const res = await madge(repoPath, { includeNpm: false });
  return res.obj();
}
