import { Type } from "@google/genai";

export interface PostAnalysis {
  score: number; // 0-100
  summary: string;
  category: "ALPHA" | "NEWS" | "SHILL" | "SPAM" | "TECHNICAL";
  isNoise: boolean;
}

export interface Post {
  id: string;
  author: string;
  handle: string;
  content: string;
  url: string;
  timestamp: Date;
  analysis?: PostAnalysis;
}
