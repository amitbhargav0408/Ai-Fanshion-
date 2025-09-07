import React, { useState, useEffect } from 'react';
import type { FashionAdvice, OutfitSuggestion } from '../types';
import { ShirtIcon, PaletteIcon, StarIcon, LightbulbIcon, ArrowLeftIcon, HeartIcon, BookmarkIcon } from './Icons';

interface StyleResultsProps {
  advice: FashionAdvice | null;
  onReset: () => void;
}

const StyleResults: React.FC<StyleResultsProps> = ({ advice, onReset }) => {
  const [favorites, setFavorites] = useState<OutfitSuggestion[]>([]);
  const [view, setView] = useState<'results' | 'favorites'>('results');

  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('fashionFavorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error("Failed to parse favorites from localStorage", error);
      setFavorites([]);
    }
  }, []);

  const toggleFavorite = (suggestion: OutfitSuggestion) => {
    let updatedFavorites;
    const isFavorited = favorites.some(fav => fav.id === suggestion.id);

    if (isFavorited) {
      updatedFavorites = favorites.filter(fav => fav.id !== suggestion.id);
    } else {
      updatedFavorites = [...favorites, suggestion];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('fashionFavorites', JSON.stringify(updatedFavorites));
  };

  const isFavorited = (id: string) => favorites.some(fav => fav.id === id);

  if (!advice) return null;
  
  const renderFavoritesView = () => (
    <div className="animate-fade-in">
      <button onClick={() => setView('results')} className="inline-flex items-center mb-6 text-gray-600 hover:text-gray-900 font-semibold transition-colors">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to Full Results
      </button>
      <h2 className="flex items-center text-3xl font-bold mb-4 text-gray-800">
        <BookmarkIcon className="w-8 h-8 mr-3 text-purple-500" />
        Saved Outfit Suggestions
      </h2>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((suggestion) => (
            <div key={suggestion.id} className="bg-stone-100 p-6 rounded-lg shadow-sm relative">
              <h3 className="font-bold text-xl text-gray-900 pr-10">{suggestion.style}</h3>
              <p className="text-gray-600 mt-2">{suggestion.description}</p>
              <button
                onClick={() => toggleFavorite(suggestion)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-100 transition-colors"
                aria-label="Remove from favorites"
              >
                <HeartIcon className="w-6 h-6 text-red-500" fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-stone-100 rounded-lg">
          <p className="text-gray-600">You haven't saved any outfit suggestions yet.</p>
          <p className="text-sm text-gray-500 mt-2">Click the heart icon on a suggestion to save it here.</p>
        </div>
      )}
    </div>
  );

  const renderResultsView = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onReset} className="inline-flex items-center text-gray-600 hover:text-gray-900 font-semibold transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Try a new photo
        </button>
        <button onClick={() => setView('favorites')} className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-full hover:bg-purple-200 transition-colors">
          <BookmarkIcon className="w-5 h-5 mr-2" />
          View Saved ({favorites.length})
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="flex items-center text-3xl font-bold mb-4 text-gray-800">
            <ShirtIcon className="w-8 h-8 mr-3 text-pink-500" />
            Outfit Suggestions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advice.outfitSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-stone-100 p-6 rounded-lg shadow-sm relative">
                <h3 className="font-bold text-xl text-gray-900 pr-10">{suggestion.style}</h3>
                <p className="text-gray-600 mt-2">{suggestion.description}</p>
                 <button
                  onClick={() => toggleFavorite(suggestion)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-100 transition-colors"
                  aria-label={isFavorited(suggestion.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <HeartIcon className={`w-6 h-6 ${isFavorited(suggestion.id) ? 'text-red-500' : 'text-gray-400'}`} fill={isFavorited(suggestion.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="flex items-center text-3xl font-bold mb-4 text-gray-800">
            <PaletteIcon className="w-8 h-8 mr-3 text-blue-500" />
            Color Combinations
          </h2>
          {advice.colorCombinations.map((combo, index) => (
            <div key={index} className="bg-stone-100 p-6 rounded-lg shadow-sm mb-4">
              <h3 className="font-bold text-xl text-gray-900">{combo.paletteName}</h3>
              <div className="flex flex-wrap gap-3 my-3">
                {combo.colors.map((color, cIndex) => (
                  <span key={cIndex} className="px-3 py-1 text-sm font-medium text-gray-800 bg-white rounded-full shadow-sm border border-gray-200">{color}</span>
                ))}
              </div>
              <p className="text-gray-600">{combo.description}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="flex items-center text-3xl font-bold mb-4 text-gray-800">
            <StarIcon className="w-8 h-8 mr-3 text-yellow-500" />
            Complete Outfit Combos
          </h2>
          <div className="space-y-6">
            {advice.outfitCombos.map((outfit, index) => (
              <div key={index} className="bg-stone-100 p-6 rounded-lg shadow-sm border-l-4 border-pink-400">
                <h3 className="font-bold text-xl text-gray-900 mb-3">{outfit.occasion}</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Top:</strong> {outfit.top}</li>
                  <li><strong>Bottom:</strong> {outfit.bottom}</li>
                  <li><strong>Shoes:</strong> {outfit.shoes}</li>
                  <li><strong>Accessories:</strong> {outfit.accessories}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="flex items-center text-3xl font-bold mb-4 text-gray-800">
            <LightbulbIcon className="w-8 h-8 mr-3 text-green-500" />
            Personalized Tips
          </h2>
          <ul className="space-y-3 list-disc list-inside bg-stone-100 p-6 rounded-lg shadow-sm text-gray-700">
            {advice.personalizedTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
  
  return view === 'results' ? renderResultsView() : renderFavoritesView();
};

export default StyleResults;