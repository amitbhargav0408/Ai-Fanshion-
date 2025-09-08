export interface OutfitSuggestion {
  id: string;
  style: string;
  description: string;
}

export interface ColorCombination {
  paletteName: string;
  colors: string[];
  description: string;
}

export interface ProductSuggestion {
  description: string;
  productName: string;
  purchaseLink: string;
}

export interface OutfitCombo {
  id: string;
  occasion: string;
  top?: ProductSuggestion;
  bottom?: ProductSuggestion;
  dress?: ProductSuggestion;
  shoes: ProductSuggestion;
  accessories: ProductSuggestion;
  summary: string;
  imageUrl?: string;
  isRegenerating?: boolean;
  imageError?: boolean;
  rating?: 'like' | 'dislike';
}

export interface FashionAdvice {
  outfitSuggestions: OutfitSuggestion[];
  colorCombinations: ColorCombination[];
  outfitCombos: OutfitCombo[];
  personalizedTips: string[];
}

export interface Ootd {
  description: string;
  imageUrl: string;
}

// New types for the Weekly Planner feature
export interface DailyOutfit {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  occasion: string;
  outfit: Omit<OutfitCombo, 'rating' | 'isRegenerating'>;
}

export type WeeklyPlan = DailyOutfit[];

// New types for the Occasion Wear feature
export type Occasion = 'Wedding' | 'Reception' | 'Party' | 'Mehendi' | 'Festival' | 'Saree';
export type OccasionWearResults = OutfitCombo[];

// New types for Coordinated Styling
export interface CoordinatedOutfitSet {
  id: string;
  occasion: string;
  person1Outfit: Omit<OutfitCombo, 'id' | 'occasion' | 'rating' | 'isRegenerating' | 'imageError' | 'imageUrl'>;
  person2Outfit: Omit<OutfitCombo, 'id' | 'occasion' | 'rating' | 'isRegenerating' | 'imageError' | 'imageUrl'>;
  coordinationRationale: string;
  imageUrl?: string;
  imageError?: boolean;
}

export interface CoordinatedAdvice {
  overallSummary: string;
  outfitSets: CoordinatedOutfitSet[];
}

export interface UserPreferences {
  preferredColors?: string;
  dislikedStyles?: string;
}
