import { Request, Response } from "express";
import { answerQuestion, streamAnswer } from "../services/qaChainService";

export async function askQuestionHandler(req: Request, res: Response) {
  const question = req.query.question as string;
  const regex = req.query.regex as string;

  if (!question) {
    return res.status(400).json({ error: "Missing question" });
  }

  const result = await answerQuestion(question, regex);
  return res.json(result);
}

export async function streamAnswerHandler(req: Request, res: Response) {
  const { question, regex } = req.query as Record<string, string>;

  if (!question) {
    res.status(400).end("Missing question");
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();           // 🔑 send headers ASAP

  try {
    for await (const chunk of streamAnswer(question, regex)) {
      res.write(`data:${JSON.stringify(chunk)}\n\n`);
    }
    res.write("data:[DONE]\n\n");
  } catch (err) {
    console.error("SSE stream error:", err);
    res.write(`data:${JSON.stringify({ type: "token", text: "⚠️  Server error" })}\n\n`);
    res.write("data:[DONE]\n\n");
  } finally {
    res.end();
  }
}

