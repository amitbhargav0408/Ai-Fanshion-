import React, { useState, useEffect } from 'react';
import type { FashionAdvice, OutfitSuggestion, OutfitCombo } from '../types';
import { ShirtIcon, PaletteIcon, StarIcon, LightbulbIcon, ArrowLeftIcon, HeartIcon, BookmarkIcon, ShareIcon, RefreshIcon, ExclamationTriangleIcon, ThumbsUpIcon, ThumbsDownIcon, CheckIcon, DownloadIcon } from './Icons';
import ProductItem from './ProductItem';

interface StyleResultsProps {
  advice: FashionAdvice | null;
  onReset: () => void;
  onRegenerateOutfit: (index: number) => void;
  onRateOutfit: (outfitId: string, rating: 'like' | 'dislike') => void;
  onImageZoom: (url: string) => void;
  onDownloadImage: (imageUrl: string, filename: string) => void;
}

const StyleResults: React.FC<StyleResultsProps> = ({ advice, onReset, onRegenerateOutfit, onRateOutfit, onImageZoom, onDownloadImage }) => {
  const [favorites, setFavorites] = useState<OutfitSuggestion[]>([]);
  const [view, setView] = useState<'results' | 'favorites'>('results');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [copiedOutfitId, setCopiedOutfitId] = useState<string | null>(null);

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

    const parts = [
      "I just got some amazing, personalized fashion advice from the AI Stylist! Here's a peek at my new style guide:\n",
    ];

    // Add more detailed style suggestions
    if (advice.outfitSuggestions.length > 0) {
      parts.push('✨ Top Style Suggestion:');
      const topSuggestion = advice.outfitSuggestions[0];
      // A short snippet of the description, taking the first sentence.
      const descriptionSnippet = topSuggestion.description.split('. ')[0];
      parts.push(`- ${topSuggestion.style}: "${descriptionSnippet}."`);
    }

    // Add more detailed color palette info
    if (advice.colorCombinations.length > 0) {
      const combo = advice.colorCombinations[0];
      // List first 3 colors for a richer preview
      const colorExamples = combo.colors.slice(0, 3).join(', ');
      parts.push(`\n🎨 Recommended Color Palette: ${combo.paletteName} (e.g., ${colorExamples})`);
    }
    
    // Add a key personalized tip
    if (advice.personalizedTips.length > 0) {
      parts.push(`\n💡 Key Personalized Tip:`);
      parts.push(`- "${advice.personalizedTips[0]}"`);
    }
    
    // Add a mention of a favorite virtual outfit to make it more engaging
    if (advice.outfitCombos.length > 0) {
        const favoriteLook = advice.outfitCombos[0];
        parts.push(`\n👗 My Favorite Virtual Look: A stunning outfit for a "${favoriteLook.occasion}"!`);
    }

    parts.push("\n\nReady to discover your perfect style? Try the AI Fashion Stylist! #AIFashionStylist #PersonalStyle #AIStylist #FashionTech");
    
    const shareText = parts.join('\n');
    
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
  
  const handleShareOutfit = async (outfit: OutfitCombo) => {
    const items = [
        outfit.dress && `* Outfit: ${outfit.dress.description}`,
        outfit.top && `* Top: ${outfit.top.description}`,
        outfit.bottom && `* Bottom: ${outfit.bottom.description}`,
        `* Shoes: ${outfit.shoes.description}`,
        outfit.accessories.description.toLowerCase() !== 'none' && `* Accessories: ${outfit.accessories.description}`
    ].filter(Boolean).join('\n');

    const shareText = `Check out this AI-styled look for a "${outfit.occasion}"! ✨\n\n*Summary:* ${outfit.summary}\n\n${items}\n\n#AIFashionStylist`;
    
    const shareData = {
        title: `AI Outfit for ${outfit.occasion}`,
        text: shareText,
        url: window.location.href,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else { // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            setCopiedOutfitId(outfit.id);
            setTimeout(() => setCopiedOutfitId(null), 2500);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy outfit details to clipboard.');
        }
    }
  };


  if (!advice) return null;
  
  const renderFavoritesView = () => (
    <div className="animate-fade-in">
      <button onClick={() => setView('results')} className="inline-flex items-center mb-6 text-gray-600 hover:text-black font-semibold transition-colors">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to Full Results
      </button>
      <h2 className="flex items-center text-3xl font-bold mb-4 text-black">
        <BookmarkIcon className="w-8 h-8 mr-3 text-yellow-400" />
        Saved Outfit Suggestions
      </h2>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((suggestion) => (
            <div key={suggestion.id} className="bg-gray-100 p-6 rounded-lg shadow-sm relative">
              <h3 className="font-bold text-xl text-black pr-10">{suggestion.style}</h3>
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
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <p className="text-gray-600">You haven't saved any outfit suggestions yet.</p>
          <p className="text-sm text-gray-400 mt-2">Click the heart icon on a suggestion to save it here.</p>
        </div>
      )}
    </div>
  );

  const renderResultsView = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onReset} className="inline-flex items-center text-gray-600 hover:text-black font-semibold transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Start Over
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('favorites')} className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 font-semibold rounded-full hover:bg-yellow-200 transition-colors">
            <BookmarkIcon className="w-5 h-5 mr-2" />
            View Saved ({favorites.length})
          </button>
          <button onClick={handleShare} className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50">
            <ShareIcon className="w-5 h-5 mr-2" />
            {shareStatus === 'copied' ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="flex items-center text-3xl font-bold mb-4 text-black">
            <ShirtIcon className="w-8 h-8 mr-3 text-yellow-400" />
            Outfit Suggestions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advice.outfitSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-gray-100 p-6 rounded-lg shadow-sm relative">
                <h3 className="font-bold text-xl text-black pr-10">{suggestion.style}</h3>
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
          <h2 className="flex items-center text-3xl font-bold mb-4 text-black">
            <StarIcon className="w-8 h-8 mr-3 text-yellow-400" />
            Virtual Try-On
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advice.outfitCombos.map((outfit, index) => (
              <div key={outfit.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-200">
                 <div className="relative w-full h-80">
                  {outfit.imageError ? (
                     <div className="w-full h-full bg-red-50 border-b border-red-200 flex items-center justify-center p-4">
                        <div className="text-center text-red-600">
                          <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-80"/>
                          <p className="font-semibold">Image Generation Failed</p>
                          <p className="text-sm mt-1">Please try regenerating.</p>
                        </div>
                      </div>
                  ) : outfit.imageUrl ? (
                    <>
                      <div onClick={() => onImageZoom(outfit.imageUrl!)} className="w-full h-full cursor-zoom-in">
                        <img src={outfit.imageUrl} alt={`Virtual try-on for ${outfit.occasion}`} className="w-full h-full object-cover object-top"/>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDownloadImage(outfit.imageUrl!, `virtual-try-on-${outfit.occasion.toLowerCase().replace(/\s+/g, '-')}`) }}
                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                        title="Download image"
                        aria-label="Download image"
                      >
                          <DownloadIcon className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
                            <p className="font-semibold">Generating image...</p>
                        </div>
                    </div>
                  )}
                  {outfit.isRegenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                      <div className="text-center text-gray-700">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto mb-3"></div>
                        <p className="font-semibold">Creating a new look...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-lg text-black">{`Outfit for ${outfit.occasion}`}</h3>
                  <div className="flex-grow mt-1">
                    <p className="text-sm text-gray-600">{outfit.summary}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                        <ul className="space-y-3 text-gray-700">
                          {outfit.dress && <ProductItem label="Dress" product={outfit.dress} />}
                          {outfit.top && <ProductItem label="Top" product={outfit.top} />}
                          {outfit.bottom && <ProductItem label="Bottom" product={outfit.bottom} />}
                          <ProductItem label="Shoes" product={outfit.shoes} />
                          <ProductItem label="Accessories" product={outfit.accessories} />
                        </ul>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center gap-2">
                     <button 
                       onClick={() => onRegenerateOutfit(index)} 
                       className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-black transition-colors disabled:opacity-50"
                       disabled={outfit.isRegenerating}
                       aria-label="Get a new look for this outfit"
                     >
                       <RefreshIcon className="w-4 h-4 mr-2" />
                       <span>New Look</span>
                     </button>
                     <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShareOutfit(outfit)}
                          aria-label={copiedOutfitId === outfit.id ? 'Copied to clipboard!' : 'Share this outfit'}
                          title={copiedOutfitId === outfit.id ? 'Copied!' : 'Share this outfit'}
                          className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                          disabled={copiedOutfitId === outfit.id}
                        >
                          {copiedOutfitId === outfit.id ? (
                            <CheckIcon className="w-6 h-6 text-green-500" />
                          ) : (
                            <ShareIcon className="w-6 h-6 text-gray-500 hover:text-blue-500" />
                          )}
                        </button>
                       <button onClick={() => onRateOutfit(outfit.id, 'like')} aria-label="Like this outfit">
                          <ThumbsUpIcon className="w-6 h-6 text-gray-500 hover:text-green-500 transition-colors" fill={outfit.rating === 'like' ? 'currentColor' : 'none'}/>
                       </button>
                       <button onClick={() => onRateOutfit(outfit.id, 'dislike')} aria-label="Dislike this outfit">
                          <ThumbsDownIcon className="w-6 h-6 text-gray-500 hover:text-red-500 transition-colors" fill={outfit.rating === 'dislike' ? 'currentColor' : 'none'}/>
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="flex items-center text-3xl font-bold mb-4 text-black">
            <PaletteIcon className="w-8 h-8 mr-3 text-yellow-400" />
            Color Combinations
          </h2>
          {advice.colorCombinations.map((combo, index) => (
            <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-sm mb-4">
              <h3 className="font-bold text-xl text-black">{combo.paletteName}</h3>
              <div className="flex flex-wrap gap-3 my-3">
                {combo.colors.map((color, cIndex) => (
                  <div key={cIndex} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-700 bg-white rounded-full shadow-sm border border-gray-300">
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
          <h2 className="flex items-center text-3xl font-bold mb-4 text-black">
            <LightbulbIcon className="w-8 h-8 mr-3 text-yellow-400" />
            Personalized Tips
          </h2>
          <ul className="space-y-3 list-disc list-inside bg-gray-100 p-6 rounded-lg shadow-sm text-gray-700">
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