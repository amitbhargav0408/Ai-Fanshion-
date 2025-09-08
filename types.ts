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

export interface OutfitCombo {
  id: string;
  occasion: string;
  top: string;
  bottom: string;
  shoes: string;
  accessories: string;
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