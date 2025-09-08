import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { FashionAdvice, Ootd, OutfitCombo, WeeklyPlan, Occasion, OccasionWearResults, DailyOutfit } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const productSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "A general description of the clothing item (e.g., 'A pair of high-waisted light-wash denim jeans')." },
        productName: { type: Type.STRING, description: "The specific name of a real-world product example (e.g., 'Levi's 501 Original Fit Jeans'). Use 'N/A' if not applicable." },
        purchaseLink: { type: Type.STRING, description: "A direct URL where the user can view or purchase the suggested product. Use 'N/A' if not applicable." }
    },
    required: ["description", "productName", "purchaseLink"]
};

const outfitProperties = {
  occasion: { type: Type.STRING, description: "The occasion for the outfit (e.g., 'Weekend Brunch', 'Work Meeting')." },
  top: { ...productSuggestionSchema, description: "Suggestion for the top wear." },
  bottom: { ...productSuggestionSchema, description: "Suggestion for the bottom wear." },
  shoes: { ...productSuggestionSchema, description: "Suggestion for footwear." },
  accessories: { ...productSuggestionSchema, description: "Suggested accessories. Use 'None' for description and 'N/A' for name and link if no accessory is suggested." },
  summary: { type: Type.STRING, description: "A concise, appealing, one-sentence summary of the complete outfit and its vibe. Example: 'White mini dress, classic watch, and stylish sunglasses – perfect for a chic daytime look.'" }
};

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
      description: "Provide at least 3 complete outfit combinations. For each item (top, bottom, shoes, accessories), suggest a real-world product example with a name and a direct purchase link.",
      items: {
        type: Type.OBJECT,
        properties: outfitProperties,
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
    properties: outfitProperties,
    required: ["occasion", "top", "bottom", "shoes", "accessories", "summary"]
};

const occasionWearSchema = {
    type: Type.ARRAY,
    description: "An array of 3-4 complete outfit combinations for a specific occasion.",
    items: {
        type: Type.OBJECT,
        properties: outfitProperties,
        required: ["occasion", "top", "bottom", "shoes", "accessories", "summary"]
    }
};

const weeklyPlanSchema = {
    type: Type.ARRAY,
    description: "A 7-day outfit plan, from Monday to Sunday.",
    items: {
        type: Type.OBJECT,
        properties: {
            day: { type: Type.STRING, description: "The day of the week (e.g., 'Monday')." },
            occasion: { type: Type.STRING, description: "A suitable occasion for the day's outfit (e.g., 'Work Presentation', 'Casual Weekend Walk')." },
            outfit: {
                type: Type.OBJECT,
                properties: {
                    top: { ...productSuggestionSchema, description: "Suggestion for the top wear." },
                    bottom: { ...productSuggestionSchema, description: "Suggestion for the bottom wear." },
                    shoes: { ...productSuggestionSchema, description: "Suggestion for footwear." },
                    accessories: { ...productSuggestionSchema, description: "Suggested accessories." },
                    summary: { type: Type.STRING, description: "A concise summary of the complete outfit." }
                },
                required: ["top", "bottom", "shoes", "accessories", "summary"]
            }
        },
        required: ["day", "occasion", "outfit"]
    }
};

async function generateImagesForCombos(combos: OutfitCombo[], imageBase64: string, mimeType: string): Promise<OutfitCombo[]> {
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    
    const imageGenerationPromises = combos.map(async (combo) => {
        const outfitDescription = `Top: ${combo.top.description}, Bottom: ${combo.bottom.description}, Shoes: ${combo.shoes.description}, Accessories: ${combo.accessories.description}.`;
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
                combo.imageUrl = `data:${mimeType};base64,${data}`;
            } else {
                combo.imageError = true;
            }
        } catch (error) {
            console.error(`Failed to generate image for combo: ${combo.occasion}`, error);
            combo.imageError = true;
        }
        return combo;
    });

    return Promise.all(imageGenerationPromises);
}


export const getFashionAdvice = async (imageBase64: string, mimeType: string): Promise<FashionAdvice> => {
  const prompt = "You are an expert AI fashion stylist. Analyze the person in this image and provide personalized fashion recommendations. Consider their apparent body type, face structure, skin tone, hair color, and estimated age. For each outfit combination, you MUST suggest a real-world product example for each item (top, bottom, shoes, accessories) including a product name and a direct, valid purchase link. If no specific accessory is suitable, use 'None' for the description and 'N/A' for the product name and link. Structure your response according to the provided JSON schema. Ensure your advice is positive, encouraging, and respectful.";

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

    advice.outfitCombos = advice.outfitCombos.map(combo => ({
      ...combo,
      id: crypto.randomUUID(),
    }));
    
    advice.outfitCombos = await generateImagesForCombos(advice.outfitCombos, imageBase64, mimeType);

    return advice;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get fashion advice from Gemini API.");
  }
};

export const regenerateOutfitCombo = async (imageBase64: string, mimeType: string, existingCombo: OutfitCombo): Promise<OutfitCombo> => {
  const imagePart = { inlineData: { data: imageBase64, mimeType } };

  try {
    // Step 1: Generate new text description, incorporating feedback
    let feedbackContext = "";
    if (existingCombo.rating) {
      if (existingCombo.rating === 'like') {
        feedbackContext = `The user LIKED the previous suggestion. Create something with a similar vibe but with a creative, alternative twist.`;
      } else {
        feedbackContext = `The user DISLIKED the previous suggestion. Please generate something completely different and avoid elements from the last one.`;
      }
    }

    const textGenPrompt = `You are an expert AI fashion stylist. Analyze the person in the provided image. Suggest a *new and different* outfit combination for the occasion: '${existingCombo.occasion}'. 
    For the new outfit, suggest real-world product examples for each item and provide valid purchase links. If no accessory is needed, use 'None' for the description and 'N/A' for other fields.
    Your previous suggestion was: "${existingCombo.summary}". 
    ${feedbackContext}
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
    
    const newComboText = JSON.parse(textResponse.text.trim()) as Omit<OutfitCombo, 'id' | 'imageUrl' | 'isRegenerating' | 'rating'>;

    try {
      const outfitDescription = `Top: ${newComboText.top.description}, Bottom: ${newComboText.bottom.description}, Shoes: ${newComboText.shoes.description}, Accessories: ${newComboText.accessories.description}.`;
      const imageGenPrompt = `From the provided image, create a new photorealistic image of the person, but dress them in a different outfit suitable for a '${newComboText.occasion}'. The new outfit is: ${outfitDescription}. Preserve the person's face, hair, and likeness from the original photo. The background should be a clean, minimalist studio setting.`;
      
      const imageGenTextPart = { text: imageGenPrompt };

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, imageGenTextPart] },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const newId = crypto.randomUUID();
      const generatedImagePart = imageResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
      if (generatedImagePart && generatedImagePart.inlineData) {
        const { data, mimeType: imgMimeType } = generatedImagePart.inlineData;
        const imageUrl = `data:${imgMimeType};base64,${data}`;
        return { ...newComboText, id: newId, imageUrl, imageError: false };
      } else {
        console.warn("Image generation failed for regenerated outfit, using previous image as fallback.");
        return { ...newComboText, id: newId, imageUrl: existingCombo.imageUrl, imageError: true };
      }
    } catch (imageError) {
      console.error("Error during image generation for regenerated outfit:", imageError);
      const newId = crypto.randomUUID();
      return { ...newComboText, id: newId, imageUrl: existingCombo.imageUrl, imageError: true };
    }
  } catch (error) {
    console.error("Error regenerating outfit combo text:", error);
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

export const getWeeklyPlan = async (imageBase64: string, mimeType: string): Promise<WeeklyPlan> => {
    const prompt = "You are an expert AI fashion stylist. Analyze the person in this image. Create a personalized 7-day style plan from Monday to Sunday. For each day, suggest a suitable occasion and a complete outfit. For each outfit item (top, bottom, shoes, accessories), you MUST suggest a real-world product example with a product name and a direct, valid purchase link. If an item isn't needed, use 'None' or 'N/A' appropriately. Ensure your advice is positive, encouraging, and respectful. Structure your response according to the provided JSON schema.";

    const imagePart = {
        inlineData: { data: imageBase64, mimeType: mimeType }
    };

    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: weeklyPlanSchema,
                temperature: 0.8,
            }
        });

        const jsonText = response.text.trim();
        const planData: Omit<DailyOutfit, 'outfit'>[] = JSON.parse(jsonText);

        const outfitsToProcess: OutfitCombo[] = planData.map((dayPlan: any) => ({
            ...dayPlan.outfit,
            id: crypto.randomUUID(),
            occasion: dayPlan.occasion,
        }));

        const outfitsWithImages = await generateImagesForCombos(outfitsToProcess, imageBase64, mimeType);

        const imageMap = new Map(outfitsWithImages.map(o => [o.id, o]));
        
        const finalPlan: WeeklyPlan = planData.map((dayPlan, index) => {
            const originalOutfitWithId = outfitsToProcess[index];
            const processedOutfit = imageMap.get(originalOutfitWithId.id);
            return {
                ...dayPlan,
                outfit: processedOutfit!,
            };
        });

        return finalPlan;

    } catch (error) {
        console.error("Error calling Gemini API for weekly plan:", error);
        throw new Error("Failed to get weekly plan from Gemini API.");
    }
};

export const getOccasionWear = async (occasion: Occasion, imageBase64: string, mimeType: string): Promise<OccasionWearResults> => {
    const prompt = `You are an expert AI fashion stylist. Analyze the person in this image. Create 3 complete, stylish, and appropriate outfit combinations for a "${occasion}" event. For each outfit, suggest real-world product examples for each item (top, bottom, shoes, accessories) including a product name and a direct, valid purchase link. If no specific accessory is suitable, use 'None' for the description and 'N/A' for the product name and link. Ensure your advice is positive, encouraging, and respectful. Structure your response according to the provided JSON schema. The occasion for each generated outfit must be '${occasion}'.`;

    const imagePart = {
        inlineData: { data: imageBase64, mimeType: mimeType }
    };
    const textPart = { text: prompt };

    try {
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: occasionWearSchema,
                temperature: 0.8,
            }
        });
        
        let results = JSON.parse(textResponse.text.trim()) as OccasionWearResults;

        results = results.map(combo => ({
          ...combo,
          id: crypto.randomUUID(),
        }));

        results = await generateImagesForCombos(results, imageBase64, mimeType);
        
        return results;

    } catch (error) {
        console.error(`Error calling Gemini API for ${occasion} wear:`, error);
        throw new Error(`Failed to get ${occasion} wear from Gemini API.`);
    }
};