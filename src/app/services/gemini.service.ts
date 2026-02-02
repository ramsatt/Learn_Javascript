import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }

  setApiKey(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }

  async analyzeAndEnhanceContent(content: string, retryCount = 0): Promise<string> {
    if (!this.model) {
      throw new Error("Gemini API Key not set. Please provide a valid API key.");
    }

    const cacheKey = this.generateCacheKey(content);
    const cachedResult = localStorage.getItem(cacheKey);
    if (cachedResult) {
      console.log('Returning cached content for:', content.substring(0, 50) + '...');
      return cachedResult;
    }

    const prompt = `
      You are an expert technical content writer and programmer. 
      Analyze the following educational content and enhance it. 
      Your goals are:
      1. Improve clarity and readability.
      2. Fix any technical inaccuracies.
      3. Provide better, more interactive-looking code examples.
      4. Add a "Key Takeaways" section at the end.
      5. Output the result in beautiful Markdown format.

      Content to analyze:
      ${content}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        localStorage.setItem(cacheKey, text);
      } catch (e) {
        console.warn('LocalStorage full, could not cache Gemini response');
      }
      
      return text;
    } catch (error: any) {
      // Handle Rate Limiting (429)
      if (error.status === 429 || error.message?.includes('429') && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
        console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        return this.analyzeAndEnhanceContent(content, retryCount + 1);
      }
      
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  private generateCacheKey(content: string): string {
    let hash = 0;
    if (content.length === 0) return `gemini_cache_${hash}`;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `gemini_cache_${hash}`;
  }
}
