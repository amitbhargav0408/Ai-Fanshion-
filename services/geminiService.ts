import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { FashionAdvice, Ootd, OutfitCombo } from "../types";

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
          colors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of complementary colors within the palette. Each color should be a valid CSS color name or a hex code (e.g., 'skyblue', '#FF5733')." },
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
          accessories: { type: Type.STRING, description: "Suggested accessories (e.g., 'watch, sunglasses'). Can be 'None'." },
          summary: { type: Type.STRING, description: "A concise, appealing, one-sentence summary of the complete outfit and its vibe. Example: 'White mini dress, classic watch, and stylish sunglasses – perfect for a chic daytime look.'" }
        },
        required: ["occasion", "top", "bottom", "shoes", "accessories", "summary"]
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

const singleOutfitComboSchema = {
    type: Type.OBJECT,
    properties: {
        occasion: { type: Type.STRING, description: "The occasion for the outfit (e.g., 'Weekend Brunch')." },
        top: { type: Type.STRING, description: "Description of the top wear." },
        bottom: { type: Type.STRING, description: "Description of the bottom wear." },
        shoes: { type: Type.STRING, description: "Description of the footwear." },
        accessories: { type: Type.STRING, description: "Suggested accessories (e.g., 'watch, sunglasses'). Can be 'None'." },
        summary: { type: Type.STRING, description: "A concise, appealing, one-sentence summary of the complete outfit and its vibe. Example: 'White mini dress, classic watch, and stylish sunglasses – perfect for a chic daytime look.'" }
    },
    required: ["occasion", "top", "bottom", "shoes", "accessories", "summary"]
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
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: fashionAdviceSchema,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const jsonText = textResponse.text.trim();
    const advice = JSON.parse(jsonText) as FashionAdvice;
    
    // Generate images for each outfit combo
    const imageGenerationPromises = advice.outfitCombos.map(async (combo) => {
      const outfitDescription = `Top: ${combo.top}, Bottom: ${combo.bottom}, Shoes: ${combo.shoes}, Accessories: ${combo.accessories}.`;
      const imageGenPrompt = `From the provided image, create a new photorealistic image of the person, but dress them in a different outfit suitable for a '${combo.occasion}'. The new outfit is: ${outfitDescription}. Preserve the person's face, hair, and likeness from the original photo. The background should be a clean, minimalist studio setting.`;
      
      const imageGenTextPart = { text: imageGenPrompt };

      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts: [imagePart, imageGenTextPart] },
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
        });
        
        const generatedImagePart = imageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (generatedImagePart && generatedImagePart.inlineData) {
          const { data, mimeType } = generatedImagePart.inlineData;
          return `data:${mimeType};base64,${data}`;
        }
        return null;
      } catch (error) {
        console.error(`Failed to generate image for combo: ${combo.occasion}`, error);
        return null;
      }
    });

    const generatedImageUrls = await Promise.all(imageGenerationPromises);

    advice.outfitCombos.forEach((combo, index) => {
      if (generatedImageUrls[index]) {
        combo.imageUrl = generatedImageUrls[index] as string;
      }
    });

    return advice;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get fashion advice from Gemini API.");
  }
};

export const regenerateOutfitCombo = async (imageBase64: string, mimeType: string, existingCombo: OutfitCombo): Promise<OutfitCombo> => {
  const imagePart = { inlineData: { data: imageBase64, mimeType } };

  try {
    // Step 1: Generate new text description
    const textGenPrompt = `You are an expert AI fashion stylist. Analyze the person in the provided image. Suggest a *new and different* outfit combination for the occasion: '${existingCombo.occasion}'. 
    Your previous suggestion was: "${existingCombo.summary}". Please provide a fresh alternative.
    Structure your response according to the provided JSON schema. Ensure your advice is positive and encouraging. The occasion must remain '${existingCombo.occasion}'.`;
    
    const textPart = { text: textGenPrompt };

    const textResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: singleOutfitComboSchema,
          temperature: 0.8,
        }
    });
    
    const newComboText = JSON.parse(textResponse.text.trim()) as Omit<OutfitCombo, 'imageUrl' | 'isRegenerating'>;

    // Step 2: Generate new image based on the new description
    const outfitDescription = `Top: ${newComboText.top}, Bottom: ${newComboText.bottom}, Shoes: ${newComboText.shoes}, Accessories: ${newComboText.accessories}.`;
    const imageGenPrompt = `From the provided image, create a new photorealistic image of the person, but dress them in a different outfit suitable for a '${newComboText.occasion}'. The new outfit is: ${outfitDescription}. Preserve the person's face, hair, and likeness from the original photo. The background should be a clean, minimalist studio setting.`;
    
    const imageGenTextPart = { text: imageGenPrompt };

    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, imageGenTextPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const generatedImagePart = imageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (generatedImagePart && generatedImagePart.inlineData) {
      const { data, mimeType: imgMimeType } = generatedImagePart.inlineData;
      const imageUrl = `data:${imgMimeType};base64,${data}`;
      return { ...newComboText, imageUrl };
    } else {
      throw new Error("Failed to generate a new image for the outfit.");
    }
  } catch (error) {
    console.error("Error regenerating outfit combo:", error);
    throw new Error("Failed to regenerate outfit combo.");
  }
};

export const getOotd = async (): Promise<Ootd> => {
  try {
    const textPrompt = "Describe a trendy, stylish, and inspiring 'Outfit of the Day' for today. Be specific about the items (top, bottom, shoes, accessories) and the overall vibe or occasion. The description should be concise and appealing, perfect for a fashion inspiration post. The description must be suitable to be used as a prompt for an image generation model.";
    
    const textResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: textPrompt,
        config: {
            temperature: 0.9,
        }
    });

    const description = textResponse.text.trim();
    if (!description) {
      throw new Error("Failed to generate OOTD description.");
    }

    const imagePrompt = `A high-quality, realistic fashion photograph of the following outfit: ${description}. The image should be well-lit, stylish, and focus on the clothing. No text or logos.`;

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '3:4',
        },
    });

    const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
      throw new Error("Failed to generate OOTD image.");
    }

    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return { description, imageUrl };

  } catch (error) {
    console.error("Error getting OOTD from Gemini API:", error);
    throw new Error("Failed to get Outfit of the Day.");
  }
};