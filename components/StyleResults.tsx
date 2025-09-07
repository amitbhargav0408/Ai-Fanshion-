import React, { useState, useEffect } from 'react';
import type { FashionAdvice, OutfitSuggestion } from '../types';
import { ShirtIcon, PaletteIcon, StarIcon, LightbulbIcon, ArrowLeftIcon, HeartIcon, BookmarkIcon, ShareIcon, RefreshIcon } from './Icons';

interface StyleResultsProps {
  advice: FashionAdvice | null;
  onReset: () => void;
  onRegenerateOutfit: (index: number) => void;
}

const StyleResults: React.FC<StyleResultsProps> = ({ advice, onReset, onRegenerateOutfit }) => {
  const [favorites, setFavorites] = useState<OutfitSuggestion[]>([]);
  const [view, setView] = useState<'results' | 'favorites'>('results');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

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

  const handleShare = async () => {
    if (!advice) return;

    const suggestedStyles = advice.outfitSuggestions.map(s => s.style).join(', ');
    const shareText = `Check out my personalized fashion advice from the AI Stylist! It suggested styles like ${suggestedStyles} and cool outfit combos. #AIFashionStylist #PersonalStyle`;
    
    const shareData = {
      title: 'My AI Fashion Advice',
      text: shareText,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2500);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy advice to clipboard.');
      }
    }
  };


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
        <div className="flex items-center gap-2">
          <button onClick={() => setView('favorites')} className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-full hover:bg-purple-200 transition-colors">
            <BookmarkIcon className="w-5 h-5 mr-2" />
            View Saved ({favorites.length})
          </button>
          <button onClick={handleShare} className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50">
            <ShareIcon className="w-5 h-5 mr-2" />
            {shareStatus === 'copied' ? 'Copied!' : 'Share'}
          </button>
        </div>
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
            <StarIcon className="w-8 h-8 mr-3 text-yellow-500" />
            Virtual Try-On
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advice.outfitCombos.map((outfit, index) => (
              <div key={index} className="bg-stone-50 rounded-lg shadow-sm overflow-hidden flex flex-col border border-stone-200">
                 <div className="relative w-full h-80">
                  {outfit.imageUrl ? (
                    <img src={outfit.imageUrl} alt={`Virtual try-on for ${outfit.occasion}`} className="w-full h-full object-cover object-top"/>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center animate-pulse">
                      <div className="text-center text-gray-500">
                          <StarIcon className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                          <p className="font-semibold">Generating image...</p>
                      </div>
                    </div>
                  )}
                  {outfit.isRegenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                      <div className="text-center text-gray-700">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-3"></div>
                        <p className="font-semibold">Creating a new look...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{`Outfit ${index + 1}`}</h3>
                    <button 
                      onClick={() => onRegenerateOutfit(index)} 
                      className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label="Regenerate this outfit"
                      disabled={outfit.isRegenerating}
                    >
                      <RefreshIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 flex-grow">{outfit.summary}</p>
                </div>
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
                  <div key={cIndex} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-800 bg-white rounded-full shadow-sm border border-gray-200">
                    <span
                      className="w-4 h-4 rounded-full block border border-slate-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    ></span>
                    <span>{color}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-600">{combo.description}</p>
            </div>
          ))}
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