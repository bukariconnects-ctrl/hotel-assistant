import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing environment variable: GOOGLE_GENERATIVE_AI_API_KEY"
      );
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}
