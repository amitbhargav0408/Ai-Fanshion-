import { GoogleGenAI, Type } from "@google/genai";
import type { FashionAdvice } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fashionAdviceSchema = {
  type: Type.OBJECT,
  properties: {
    outfitSuggestions: {
      type: Type.ARRAY,
      description: "Recommend clothing styles (e.g., casual, formal, party wear) that match the user’s body type, face structure, and apparent age group.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for this specific outfit suggestion (e.g., 'outfit-1')." },
          style: { type: Type.STRING, description: "The name of the clothing style (e.g., 'Business Casual')." },
          description: { type: Type.STRING, description: "A detailed description of why this style is suitable." }
        },
        required: ["id", "style", "description"]
      }
    },
    colorCombinations: {
      type: Type.ARRAY,
      description: "Suggest color palettes for clothing, accessories, and footwear that complement the user’s skin tone and hair color.",
      items: {
        type: Type.OBJECT,
        properties: {
          paletteName: { type: Type.STRING, description: "The name of the color palette (e.g., 'Earthy Tones')." },
          colors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of complementary colors within the palette." },
          description: { type: Type.STRING, description: "Explanation of why this palette works for the user." }
        },
        required: ["paletteName", "colors", "description"]
      }
    },
    outfitCombos: {
      type: Type.ARRAY,
      description: "Provide at least 3 complete outfit combinations (top, bottom, shoes, and optional accessories) suitable for different occasions.",
      items: {
        type: Type.OBJECT,
        properties: {
          occasion: { type: Type.STRING, description: "The occasion for the outfit (e.g., 'Weekend Brunch')." },
          top: { type: Type.STRING, description: "Description of the top wear." },
          bottom: { type: Type.STRING, description: "Description of the bottom wear." },
          shoes: { type: Type.STRING, description: "Description of the footwear." },
          accessories: { type: Type.STRING, description: "Suggested accessories (e.g., 'watch, sunglasses'). Can be 'None'." }
        },
        required: ["occasion", "top", "bottom", "shoes", "accessories"]
      }
    },
    personalizedTips: {
      type: Type.ARRAY,
      description: "Give specific styling tips such as hairstyle, accessories, or patterns that enhance their overall look.",
      items: { type: Type.STRING }
    }
  },
  required: ["outfitSuggestions", "colorCombinations", "outfitCombos", "personalizedTips"]
};


export const getFashionAdvice = async (imageBase64: string, mimeType: string): Promise<FashionAdvice> => {
  const prompt = "You are an expert AI fashion stylist. Analyze the person in this image and provide personalized fashion recommendations. Consider their apparent body type, face structure, skin tone, hair color, and estimated age to give detailed and helpful advice. Structure your response according to the provided JSON schema. Ensure your advice is positive, encouraging, and respectful.";

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType
    }
  };

  const textPart = {
    text: prompt
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: fashionAdviceSchema,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as FashionAdvice;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get fashion advice from Gemini API.");
  }
};