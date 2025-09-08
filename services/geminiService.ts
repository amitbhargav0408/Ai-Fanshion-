import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { FashionAdvice, Ootd, OutfitCombo, WeeklyPlan, Occasion, OccasionWearResults, DailyOutfit, CoordinatedAdvice, CoordinatedOutfitSet, UserPreferences } from "../types";

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
  top: { ...productSuggestionSchema, description: "Suggestion for the top wear. Omit if the outfit is a one-piece like a dress or jumpsuit." },
  bottom: { ...productSuggestionSchema, description: "Suggestion for the bottom wear. Omit if the outfit is a one-piece like a dress or jumpsuit." },
  dress: { ...productSuggestionSchema, description: "Suggestion for a one-piece outfit like a dress or jumpsuit. Omit if the outfit consists of a separate top and bottom." },
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
        required: ["occasion", "shoes", "accessories", "summary"]
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
    required: ["occasion", "shoes", "accessories", "summary"]
};

const occasionWearSchema = {
    type: Type.ARRAY,
    description: "An array of 3-4 complete outfit combinations for a specific occasion.",
    items: {
        type: Type.OBJECT,
        properties: outfitProperties,
        required: ["occasion", "shoes", "accessories", "summary"]
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
                    top: { ...productSuggestionSchema, description: "Suggestion for the top wear. Omit if 'dress' is provided." },
                    bottom: { ...productSuggestionSchema, description: "Suggestion for the bottom wear. Omit if 'dress' is provided." },
                    dress: { ...productSuggestionSchema, description: "Suggestion for a one-piece outfit like a dress or jumpsuit. Omit if 'top' and 'bottom' are provided." },
                    shoes: { ...productSuggestionSchema, description: "Suggestion for footwear." },
                    accessories: { ...productSuggestionSchema, description: "Suggested accessories." },
                    summary: { type: Type.STRING, description: "A concise summary of the complete outfit." }
                },
                required: ["shoes", "accessories", "summary"]
            }
        },
        required: ["day", "occasion", "outfit"]
    }
};

const detectPeopleSchema = {
    type: Type.OBJECT,
    properties: {
        people: {
            type: Type.ARRAY,
            description: "A list of all people detected in the image.",
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: "A short, non-identifying description of the person (e.g., 'person on the left wearing a blue shirt', 'person on the right with glasses')." }
                },
                required: ["description"]
            }
        }
    },
    required: ["people"]
};

// Fix: 'Omit' is a TypeScript type, not a runtime function. Create a new object without the 'occasion' property for the schema.
const { occasion: _unused, ...outfitPropertiesWithoutOccasion } = outfitProperties;

const coordinatedAdviceSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: {
            type: Type.STRING,
            description: "A brief, encouraging summary about the combined style potential of the people in the photo."
        },
        outfitSets: {
            type: Type.ARRAY,
            description: "Provide 3 coordinated outfit sets for different occasions: one Casual, one Formal, and one Special Event (e.g., Party, Wedding).",
            items: {
                type: Type.OBJECT,
                properties: {
                    occasion: { type: Type.STRING, description: "The occasion for this coordinated look (e.g., 'Casual Weekend Brunch', 'Formal Evening Gala')." },
                    person1Outfit: { 
                        type: Type.OBJECT, 
                        // Fix: 'Omit' is a TypeScript type and cannot be used as a value here.
                        properties: outfitPropertiesWithoutOccasion,
                        required: ["shoes", "accessories", "summary"],
                        description: "Outfit for the first person (e.g., person on the left)."
                    },
                    person2Outfit: {
                        type: Type.OBJECT,
                        // Fix: 'Omit' is a TypeScript type and cannot be used as a value here.
                        properties: outfitPropertiesWithoutOccasion,
                        required: ["shoes", "accessories", "summary"],
                        description: "Outfit for the second person (e.g., person on the right)."
                    },
                    coordinationRationale: {
                        type: Type.STRING,
                        description: "A detailed explanation of why these two outfits work well together, mentioning color harmony, style balance, or thematic connection."
                    }
                },
                required: ["occasion", "person1Outfit", "person2Outfit", "coordinationRationale"]
            }
        }
    },
    required: ["overallSummary", "outfitSets"]
};


async function generateImagesForCombos(combos: OutfitCombo[], imageBase64: string, mimeType: string): Promise<OutfitCombo[]> {
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    
    const imageGenerationPromises = combos.map(async (combo) => {
        const outfitDescription = combo.dress 
            ? `A one-piece outfit: ${combo.dress.description}`
            : `Top: ${combo.top?.description}, Bottom: ${combo.bottom?.description}`;
        const fullOutfitDescription = `${outfitDescription}, Shoes: ${combo.shoes.description}, Accessories: ${combo.accessories.description}.`;
        
        const imageGenPrompt = `From the provided image, create a new photorealistic image of the person, but dress them in a different outfit suitable for a '${combo.occasion}'. The new outfit is: ${fullOutfitDescription}. Preserve the person's face, hair, and likeness from the original photo. The background should be a clean, minimalist studio setting.`;
        
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

async function generateCoordinatedImagesForSets(sets: CoordinatedOutfitSet[], imageBase64: string, mimeType: string): Promise<CoordinatedOutfitSet[]> {
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    
    const imageGenerationPromises = sets.map(async (set) => {
        const outfit1Desc = set.person1Outfit.dress
            ? `A one-piece outfit: ${set.person1Outfit.dress.description}`
            : `Top: ${set.person1Outfit.top?.description}, Bottom: ${set.person1Outfit.bottom?.description}`;
        const outfit2Desc = set.person2Outfit.dress
            ? `A one-piece outfit: ${set.person2Outfit.dress.description}`
            : `Top: ${set.person2Outfit.top?.description}, Bottom: ${set.person2Outfit.bottom?.description}`;
        
        const imageGenPrompt = `From the provided image containing two people, create a new photorealistic image of BOTH people together. Dress them in new, coordinated outfits for a '${set.occasion}'.
        - The first person's outfit is: ${outfit1Desc}, Shoes: ${set.person1Outfit.shoes.description}, Accessories: ${set.person1Outfit.accessories.description}.
        - The second person's outfit is: ${outfit2Desc}, Shoes: ${set.person2Outfit.shoes.description}, Accessories: ${set.person2Outfit.accessories.description}.
        Preserve both individuals' faces, hair, and likenesses from the original photo. The background should be a clean, minimalist studio setting relevant to the occasion.`;
        
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
                set.imageUrl = `data:${mimeType};base64,${data}`;
            } else {
                set.imageError = true;
            }
        } catch (error) {
            console.error(`Failed to generate coordinated image for set: ${set.occasion}`, error);
            set.imageError = true;
        }
        return set;
    });

    return Promise.all(imageGenerationPromises);
}


export const getFashionAdvice = async (imageBase64: string, mimeType: string, personDescription?: string, preferences?: UserPreferences): Promise<FashionAdvice> => {
  const targetPerson = personDescription ? `the person described as '${personDescription}'` : "the person";

  let preferencesPrompt = "";
    if (preferences) {
        const preferenceParts = [];
        if (preferences.preferredColors) {
            preferenceParts.push(`They have a preference for the following colors or styles: ${preferences.preferredColors}.`);
        }
        if (preferences.dislikedStyles) {
            preferenceParts.push(`They dislike and want to avoid: ${preferences.dislikedStyles}.`);
        }
        if (preferenceParts.length > 0) {
            preferencesPrompt = `\n\nAdditionally, take the following user preferences into account: ${preferenceParts.join(' ')}`;
        }
    }

  const prompt = `You are an expert AI fashion stylist. Analyze ${targetPerson} in this image and provide personalized fashion recommendations. Consider their apparent body type, face structure, skin tone, hair color, and estimated age. For each outfit combination, you can suggest either a top and bottom combination OR a one-piece item like a dress or jumpsuit. If suggesting a one-piece, use the 'dress' property and omit 'top' and 'bottom'. Otherwise, use 'top' and 'bottom' and omit 'dress'. You MUST suggest a real-world product example for each item including a product name and a direct, valid purchase link. If no specific accessory is suitable, use 'None' for the description and 'N/A' for the product name and link. Structure your response according to the provided JSON schema. Ensure your advice is positive, encouraging, and respectful.${preferencesPrompt}`;

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
    You can suggest either a top/bottom combo or a one-piece like a dress/jumpsuit. For the new outfit, suggest real-world product examples for each item and provide valid purchase links. If no accessory is needed, use 'None' for the description and 'N/A' for other fields.
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
      const outfitDescription = newComboText.dress 
        ? `A one-piece outfit: ${newComboText.dress.description}`
        : `Top: ${newComboText.top?.description}, Bottom: ${newComboText.bottom?.description}`;
      const fullOutfitDescription = `${outfitDescription}, Shoes: ${newComboText.shoes.description}, Accessories: ${newComboText.accessories.description}.`;

      const imageGenPrompt = `From the provided image, create a new photorealistic image of the person, but dress them in a different outfit suitable for a '${newComboText.occasion}'. The new outfit is: ${fullOutfitDescription}. Preserve the person's face, hair, and likeness from the original photo. The background should be a clean, minimalist studio setting.`;
      
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
    const textPrompt = "Describe a trendy, stylish, and inspiring 'Outfit of the Day' for today. Be specific about the items (e.g., top, bottom, dress, shoes, accessories) and the overall vibe or occasion. The description should be concise and appealing, perfect for a fashion inspiration post. The description must be suitable to be used as a prompt for an image generation model.";
    
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
    const prompt = "You are an expert AI fashion stylist. Analyze the person in this image. Create a personalized 7-day style plan from Monday to Sunday. For each day, suggest a suitable occasion and a complete outfit. For each outfit, you can suggest either a top and bottom combination OR a one-piece item like a dress or jumpsuit. You MUST suggest a real-world product example for each item with a product name and a direct, valid purchase link. If an item isn't needed, use 'None' or 'N/A' appropriately. Ensure your advice is positive, encouraging, and respectful. Structure your response according to the provided JSON schema.";

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
    const prompt = occasion === 'Saree'
      ? `You are an expert AI fashion stylist. Analyze the person in this image. Create 3 complete, stylish Saree outfit combinations. For each outfit:
- The 'top' MUST be the blouse.
- The 'bottom' MUST be the Saree itself.
- Suggest appropriate shoes and accessories.
- For each item, you MUST suggest a real-world product example with a product name and a direct, valid purchase link.
- If no specific accessory is suitable, use 'None' for the description and 'N/A' for the product name and link.
Ensure your advice is positive, encouraging, and respectful. Structure your response according to the provided JSON schema. The occasion for each generated outfit must be 'Elegant Saree Look'.`
      : `You are an expert AI fashion stylist. Analyze the person in this image. Create 3 complete, stylish, and appropriate outfit combinations for a "${occasion}" event. For each outfit, you can suggest either a top and bottom combination OR a one-piece item like a dress or jumpsuit. Suggest real-world product examples for each item including a product name and a direct, valid purchase link. If no specific accessory is suitable, use 'None' for the description and 'N/A' for the product name and link. Ensure your advice is positive, encouraging, and respectful. Structure your response according to the provided JSON schema. The occasion for each generated outfit must be '${occasion}'.`;

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

export const detectPeople = async (imageBase64: string, mimeType: string): Promise<{ description: string }[]> => {
    const prompt = "Analyze this image and identify each person visible. For each person, provide a short, non-identifying description. For example: 'person on the left with a red shirt' or 'person on the right with glasses'. If there is only one person, describe them. If there are no people, return an empty array.";
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: detectPeopleSchema,
            }
        });
        const result = JSON.parse(response.text.trim());
        return result.people || [];
    } catch (error) {
        console.error("Error detecting people:", error);
        throw new Error("Could not analyze the image for people.");
    }
};

export const getCoordinatedAdvice = async (imageBase64: string, mimeType: string): Promise<CoordinatedAdvice> => {
    const prompt = "You are an expert fashion stylist for couples and groups. Analyze the people in the image. Create a coordinated fashion report for them. Provide an encouraging overall summary and then 3 distinct, coordinated outfit sets for the following occasions: Casual, Formal, and a Special Event (like a party or wedding). For each set, provide a complete outfit for each person. Each outfit can be a top/bottom combo or a one-piece (dress/jumpsuit). You must include real-world product examples with valid purchase links for every item. Crucially, also provide a 'coordination rationale' explaining *why* the outfits complement each other (e.g., matching color palettes, complementary styles, thematic links). Structure your response according to the provided JSON schema.";
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };

    try {
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: coordinatedAdviceSchema,
                temperature: 0.7,
            }
        });

        const advice = JSON.parse(textResponse.text.trim()) as CoordinatedAdvice;
        
        advice.outfitSets = advice.outfitSets.map(set => ({
          ...set,
          id: crypto.randomUUID(),
        }));

        advice.outfitSets = await generateCoordinatedImagesForSets(advice.outfitSets, imageBase64, mimeType);
        
        return advice;

    } catch (error) {
        console.error("Error getting coordinated advice:", error);
        throw new Error("Failed to get coordinated fashion advice.");
    }
};