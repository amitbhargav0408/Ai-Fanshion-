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
  occasion: string;
  top: string;
  bottom: string;
  shoes: string;
  accessories: string;
  summary: string;
  imageUrl?: string;
  isRegenerating?: boolean;
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