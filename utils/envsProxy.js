import dotenv from "dotenv";

dotenv.config();

export const envsProxy = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  AI_MODEL_NAME: process.env.AI_MODEL_NAME,
  SERPER_API_KEY: process.env.SERPER_API_KEY,
};
