import 'dotenv/config';

export default {
  openaiApiKey: process.env.OPENAI_API_KEY,
  chromaUrl: process.env.CHROMA_DB_URL || 'http://localhost:8000',
};
