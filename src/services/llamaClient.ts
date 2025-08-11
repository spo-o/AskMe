// backend/src/services/llamaClient.ts

import { Together } from 'together-ai';

const client = new Together({
  apiKey: process.env.TOGETHER_API_KEY!,
});

/**
 * Ask LLaMA via Together to extract structured property filters and detect intent.
 */
export async function askLLAMA(prompt: string): Promise<{
    filters: {
      budget?: number;
      location?: string;
      purpose?: string;
      preferences?: string[];
      zip?: string;
      squareFootage?: number;
      yearBuilt?: number;
      min_area?: number;
      min_year_built?: number;
    };
    is_property_query: boolean;
  }> {
    const response = await client.chat.completions.create({
      model: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
      messages: [
        {
          role: 'system',
          content: `You are an API that extracts structured property filters from real estate questions.
  
  ONLY return a compact JSON object in this exact structure and nothing else. No explanation, no markdown:
  
  {
    "filters": {
      "budget": 100000,
      "location": "detroit",
      "purpose": "restaurant",
      "preferences": ["walkability"],
      "zip": "48225",
      "squareFootage": 2500,
      "yearBuilt": 1990,
      "min_area": 2000,
      "min_year_built": 1950
    },
    "is_property_query": true
  }
  
  If values are missing or not found in the question, return empty or omit them. Never add extra text or say "Here's your result".`,
        },
        {
          role: 'user',
          content: `Prompt: "${prompt}"`,
        },
      ],
      stream: false,
    });
  
    const content = response.choices?.[0]?.message?.content ?? '{}';
  
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (err) {
      console.warn(' Failed to parse LLaMA response JSON:', err);
      console.log(' LLaMA Raw Output:', content);
      return {
        filters: {},
        is_property_query: false,
      };
    }
  }
  