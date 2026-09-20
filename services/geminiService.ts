
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AudienceLevel, GeneratedMedia } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced quota error detection.
 * Captures transient (429) and hard daily limits.
 */
export const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || "";
  const status = String(error.status || error.code || "");
  const toString = typeof error.toString === 'function' ? error.toString() : "";
  
  const errorContext = (message + " " + status + " " + toString).toLowerCase();
  
  return (
    status === "429" ||
    errorContext.includes("429") ||
    errorContext.includes("resource_exhausted") ||
    errorContext.includes("quota exceeded") ||
    errorContext.includes("rate_limit") ||
    errorContext.includes("user has exceeded quota")
  );
};

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && isQuotaError(error)) {
      // If it's a 429, wait briefly. If it's a hard limit, this will still fail.
      await sleep(2000);
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const formatErrorMessage = (error: any): string => {
  if (!error) return "An unexpected error occurred.";
  const rawMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
  
  if (rawMsg.includes("403") || rawMsg.includes("PERMISSION_DENIED") || rawMsg.includes("caller does not have permission")) {
    return "Permission Denied (403): The API key does not have permission for this model or feature. Please check your project permissions and model access.";
  }
  if (isQuotaError(error)) {
    return "Rate limit / Quota reached (429): Free tier or per-minute token threshold reached. Please wait a moment.";
  }
  return rawMsg;
};

export const generateImage = async (query: string): Promise<GeneratedMedia> => {
  return withRetry(async () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: `A hyper-detailed cinematic concept visualization of: ${query}. Masterpiece quality, sharp focus, immersive lighting, artistic excellence, high-resolution style.` }]
        },
        config: {
          imageConfig: { 
            aspectRatio: "16:9"
          }
        }
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) throw new Error("Image generation completed without returning an image.");
      return { url: imageUrl, type: 'image' };
    } catch (error: any) {
      console.error("Internal Image Gen Error:", error);
      throw new Error(formatErrorMessage(error));
    }
  });
};

export const analyzeMediaContent = async (
  query: string, 
  mediaUrl: string, 
  audience: AudienceLevel,
  useLite: boolean = false
): Promise<AnalysisResult> => {
  return withRetry(async () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const modelName = useLite ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

    const audiencePrompts = {
      seed: "Explain for a 5-year old child. Simple, magical, story-like.",
      sprout: "Explain for a curious student. Educational, insightful, clear facts.",
      oak: "Explain for an expert. Technical, deep analysis, complex systems engineering."
    };

    const schema = {
      type: Type.OBJECT,
      properties: {
        segments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              format: { type: Type.STRING, enum: ['compact', 'stats', 'detailed', 'mini'] },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              icon: { type: Type.STRING },
              stats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ['label', 'value']
                }
              },
              bounds: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER }
                },
                required: ['x', 'y', 'width', 'height']
              }
            },
            required: ['label', 'format', 'description', 'icon', 'bounds']
          }
        }
      },
      required: ['segments']
    };

    try {
      const base64Data = mediaUrl.split(',')[1];
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            { text: `Analyze this visualization of "${query}" for an ${audience.toUpperCase()} audience. Style: ${audiencePrompts[audience]} Identify 5 key features with percentage coords (0-100).` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      return JSON.parse(response.text || '{}') as AnalysisResult;
    } catch (error: any) {
      console.error(`Internal Analysis Error (${modelName}):`, error);
      throw new Error(formatErrorMessage(error));
    }
  });
};
