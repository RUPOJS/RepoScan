import path from "path";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

import { analyzeCodeChunk } from "./codeAnalysisService";
import { getAuthorshipInfo } from "./authorshipService";
import { saveSnapshot } from "./metricsService";

import { Document } from "langchain/document";
import crypto from "crypto";

function slug(str: string) {
  return crypto.createHash("sha1").update(str).digest("hex").slice(0, 20);
}

export async function indexRepository(repoPath: string) {
  /* 1. load files ---------------------------------------------------- */
  const loader = new DirectoryLoader(repoPath, {
    ".ts": (p) => new TextLoader(p),
    ".tsx": (p) => new TextLoader(p),
    ".js": (p) => new TextLoader(p),
    ".jsx": (p) => new TextLoader(p),
    ".py": (p) => new TextLoader(p),
    ".java": (p) => new TextLoader(p),
    ".go": (p) => new TextLoader(p),
    ".md": (p) => new TextLoader(p),
    ".json": (p) => new TextLoader(p),
    ".txt": (p) => new TextLoader(p),
  });

  const rawDocs = (await loader.load()).filter(
    (d) =>
      !d.metadata.source.includes(".git") &&
      !d.metadata.source.includes("node_modules")
  );

  /* 2. split + enrich ------------------------------------------------ */
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const chunks: Document[] = [];
  for (const doc of rawDocs) {
    const filePath = doc.metadata.source as string;
    const blame = getAuthorshipInfo(repoPath, filePath);

    for (const chunk of await splitter.splitDocuments([doc])) {
      const analysis = analyzeCodeChunk(chunk.pageContent);
      chunk.metadata = {
        ...chunk.metadata,
        filePath: path.relative(repoPath, filePath),
        complexity: analysis.complexity,
        antiPatterns: analysis.antiPatterns,
        authors: blame.map((b) => b.authorName),
      };
      chunks.push(chunk);
      saveSnapshot({ repo: slug(repoPath), ...chunk.metadata });
    }
  }

  /* 3. embed & store ------------------------------------------------- */
  const collection = slug(repoPath);
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const store = await HNSWLib.fromDocuments(chunks, embeddings);
  await store.save(
    path.join(process.cwd(), "vector-store", collection, "hnswlib.bin")
  );

  console.log(`Indexed ${chunks.length} chunks into collection ${collection}`);
}
