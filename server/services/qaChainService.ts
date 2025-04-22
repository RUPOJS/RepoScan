/* ------------------------------------------------------------------ */
/*  qaChainService.ts   (multi‑tenant safe, SSE friendly)             */
/* ------------------------------------------------------------------ */
import path from "path";
import { ChatOllama } from "@langchain/ollama";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { OutputFixingParser } from "langchain/output_parsers";

/* ---------- types -------------------------------------------------- */
export type LlmJson = { answer: string; sources: string[] };
export type ChatToken = { type: "token"; text: string };
export type SourceChunk = { type: "sources"; sources: any[] };

/* ---------- tiny helpers ------------------------------------------ */
const isJson = (x: any): x is LlmJson =>
  x &&
  typeof x === "object" &&
  typeof x.answer === "string" &&
  Array.isArray(x.sources) &&
  x.sources.every((s) => typeof s === "string");

const stripFences = (t: string) =>
  t
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

/* ---------- build retriever for “current” repo -------------------- */
async function buildRetriever() {
  const slug = process.env.LAST_INDEXED_COLLECTION;
  if (!slug) throw new Error("No repo indexed yet");

  const store = await HNSWLib.load(
    path.join(process.cwd(), "vector-store", slug, "hnswlib.bin"),
    new HuggingFaceTransformersEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2",
    })
  );

  const retriever = ScoreThresholdRetriever.fromVectorStore(store, {
    minSimilarityScore: 0.4,
    kIncrement: 4,
    maxK: 20,
  });

  return { store, retriever };
}

/* ---------- common prompt pieces ---------------------------------- */
const documentPrompt = PromptTemplate.fromTemplate(
  "• {filePath}\n{page_content}"
);
const baseJsonParser = new JsonOutputParser<LlmJson>();
const repairParser = OutputFixingParser.fromLLM(
  new ChatOllama({ model: "deepseek-coder:6.7b" }),
  baseJsonParser
);

const systemPromptRaw = `
You are an API that returns *only* JSON.

The JSON must look like:
{{ "answer": string, "sources": string[] }}

If unsure, use {{ "answer": "I don't know.", "sources": [] }}.

DO NOT wrap the JSON in markdown or prose.
`;

/* ------------------------------------------------------------------ */
/*  synchronous answer (REST /ask)                                    */
/* ------------------------------------------------------------------ */
export async function answerQuestion(question: string, regex?: string) {
  const { store, retriever } = await buildRetriever();

  /*  prompt --------------------------------------------------------- */
  const qaPrompt = await ChatPromptTemplate.fromTemplate(
    `${systemPromptRaw}

      {format_instructions}

      <question>{input}</question>

      <context>
      {context}
      </context>

    JSON:`
  ).partial({ format_instructions: repairParser.getFormatInstructions() });

  /*  chain ---------------------------------------------------------- */
  const chain = await createRetrievalChain<LlmJson>({
    retriever,
    combineDocsChain: await createStuffDocumentsChain({
      llm: new ChatOllama({ model: "deepseek-coder:6.7b", temperature: 0.2 }),
      prompt: qaPrompt,
      documentPrompt,
      documentSeparator: "\n\n",
      outputParser: repairParser,
    }),
  });

  /*  run ------------------------------------------------------------ */
  const { answer: raw, context } = await chain.invoke({ input: question });

  const parsed: LlmJson = isJson(raw)
    ? raw
    : (() => {
        try {
          const clean = JSON.parse(stripFences(String(raw)));
          return isJson(clean) ? clean : { answer: String(raw), sources: [] };
        } catch {
          return { answer: String(raw), sources: [] };
        }
      })();

  /*  regex filter & confidence ------------------------------------- */
  const docs = regex
    ? context.filter((d) =>
        new RegExp(regex, "i").test(d.pageContent + JSON.stringify(d.metadata))
      )
    : context;

  const sims = (await store.similaritySearchWithScore(question, 20))
    .filter(([d]) =>
      docs.some((x) => x.metadata.filePath === d.metadata.filePath)
    )
    .map(([, s]) => s);

  const confidence = sims.length
    ? Number((sims.reduce((a, b) => a + b) / sims.length).toFixed(2))
    : 0;

  return {
    text: parsed.answer,
    sources: parsed.sources,
    confidence,
    sourceDocuments: docs,
  };
}

/* ------------------------------------------------------------------ */
/*  SSE answer (GET /ask/stream)                                      */
/* ------------------------------------------------------------------ */
export async function* streamAnswer(
  question: string,
  regex?: string
): AsyncGenerator<ChatToken | SourceChunk> {
  const buff: string[] = [];

  /* capture tokens as they arrive */
  const streamLLM = new ChatOllama({
    model: "deepseek-coder:6.7b",
    temperature: 0.2,
    callbacks: [
      { handleLLMNewToken: (t) => buff.push(t) },
      { handleLLMError: (e) => console.error("stream LLM error:", e) },
    ],
  });

  const { store, retriever } = await buildRetriever();

  const qaPrompt = await ChatPromptTemplate.fromTemplate(
    `${systemPromptRaw}

    {format_instructions}

    <question>{input}</question>

    <context>
    {context}
    </context>

    JSON:`
  ).partial({ format_instructions: repairParser.getFormatInstructions() });

  const chain = await createRetrievalChain<LlmJson>({
    retriever,
    combineDocsChain: await createStuffDocumentsChain({
      llm: streamLLM,
      prompt: qaPrompt,
      documentPrompt,
      documentSeparator: "\n\n",
      outputParser: repairParser,
    }),
  });

  /*  run  */
  let parsed: LlmJson = { answer: "", sources: [] };
  let contextDocs: any[] = [];

  try {
    const { answer, context } = await chain.invoke({ input: question });
    parsed = isJson(answer) ? answer : { answer: String(answer), sources: [] };
    contextDocs = context;
  } catch (err) {
    parsed.answer = "⚠️  Sorry, I hit an error.";
    console.error("chain error:", err);
  }

  /*  stream tokens gathered so far  */
  for (const ch of buff) yield { type: "token", text: ch };

  /*  final docs + confidence  */
  const finalDocs = regex
    ? contextDocs.filter((d) =>
        new RegExp(regex, "i").test(d.pageContent + JSON.stringify(d.metadata))
      )
    : contextDocs;

  const sims = (await store.similaritySearchWithScore(question, 20))
    .filter(([d]) =>
      finalDocs.some((x) => x.metadata.filePath === d.metadata.filePath)
    )
    .map(([, s]) => s);

  const confidence = sims.length
    ? Number((sims.reduce((a, b) => a + b) / sims.length).toFixed(2))
    : 0;

  yield {
    type: "sources",
    sources: finalDocs.map((d) => ({ ...d.metadata, confidence })),
  };
}
