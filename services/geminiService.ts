/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export const generateImage = async (query: string): Promise<GeneratedMedia> => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to generate image (${response.status})`);
  }
  return await response.json();
};

export const analyzeMediaContent = async (
  query: string, 
  mediaUrl: string, 
  audience: AudienceLevel,
  useLite: boolean = false
): Promise<AnalysisResult> => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mediaUrl, audience, useLite }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to analyze content (${response.status})`);
  }
  return await response.json();
};
