import React, { useState, useCallback, useEffect } from 'react';
import { getFashionAdvice, getOotd, regenerateOutfitCombo } from './services/geminiService';
import type { FashionAdvice, Ootd } from './types';
import ImageUploader from './components/ImageUploader';
import StyleResults from './components/StyleResults';
import LoadingSpinner from './components/LoadingSpinner';
import { SparklesIcon, ExclamationTriangleIcon, CalendarIcon, ShareIcon } from './components/Icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fashionAdvice, setFashionAdvice] = useState<FashionAdvice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // OOTD State
  const [ootd, setOotd] = useState<Ootd | null>(null);
  const [isOotdLoading, setIsOotdLoading] = useState<boolean>(false);
  const [ootdError, setOotdError] = useState<string | null>(null);
  const [isOotdDisplayed, setIsOotdDisplayed] = useState<boolean>(false);
  const [ootdShareStatus, setOotdShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setFashionAdvice(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
        const base64 = result.substring(result.indexOf(',') + 1);
        resolve({ base64, mimeType });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGetStyleAdvice = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setFashionAdvice(null);
    setError(null);
    localStorage.removeItem('fashionRatings'); // Clear old ratings

    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const advice = await getFashionAdvice(base64, mimeType);
      
      // Check for any saved ratings from this session
      try {
        const savedRatings = JSON.parse(localStorage.getItem('fashionRatings') || '{}');
        advice.outfitCombos.forEach(combo => {
            if (savedRatings[combo.id]) {
                combo.rating = savedRatings[combo.id];
            }
        });
      } catch (e) {
        console.error("Could not parse ratings from localStorage", e);
      }
      
      setFashionAdvice(advice);
    } catch (err) {
      console.error(err);
      setError('Sorry, something went wrong while getting your style advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);
  
  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setFashionAdvice(null);
    setError(null);
    setIsLoading(false);
    localStorage.removeItem('fashionRatings');
  }

  const handleFetchOotd = useCallback(async () => {
    setIsOotdDisplayed(true);
    setIsOotdLoading(true);
    setOotdError(null);
    setOotd(null);
    try {
      const result = await getOotd();
      setOotd(result);
    } catch (err) {
      console.error(err);
      setOotdError('Could not fetch the Outfit of the Day. Please try again later.');
    } finally {
      setIsOotdLoading(false);
    }
  }, []);

  const handleShareOotd = useCallback(async () => {
    if (!ootd) return;
    const shareText = `Check out today's Outfit of the Day inspiration! ✨\n\n${ootd.description}\n\n#OOTD #AIFashionStylist`;
    
    if (navigator.share) {
      try {
        await navigator.share({
            title: "Today's Outfit of the Day",
            text: shareText,
            url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            setOotdShareStatus('copied');
            setTimeout(() => setOotdShareStatus('idle'), 2500);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy advice to clipboard.');
        }
    }
  }, [ootd]);

  const handleRateOutfit = useCallback((outfitId: string, newRating: 'like' | 'dislike') => {
    if (!fashionAdvice) return;

    const updatedCombos = fashionAdvice.outfitCombos.map(combo => {
      if (combo.id === outfitId) {
        // If the user clicks the same rating again, toggle it off
        const finalRating = combo.rating === newRating ? undefined : newRating;
        return { ...combo, rating: finalRating };
      }
      return combo;
    });

    setFashionAdvice({ ...fashionAdvice, outfitCombos: updatedCombos });

    // Update localStorage
    try {
      const ratings = JSON.parse(localStorage.getItem('fashionRatings') || '{}');
      const comboToUpdate = updatedCombos.find(c => c.id === outfitId);
      if (comboToUpdate?.rating) {
        ratings[outfitId] = comboToUpdate.rating;
      } else {
        delete ratings[outfitId];
      }
      localStorage.setItem('fashionRatings', JSON.stringify(ratings));
    } catch (e) {
      console.error("Failed to save ratings to localStorage", e);
    }
  }, [fashionAdvice]);

  const handleRegenerateOutfit = useCallback(async (indexToRegenerate: number) => {
    if (!fashionAdvice || !imageFile) return;

    const originalAdvice = { ...fashionAdvice };
    const outfitToRegenerate = originalAdvice.outfitCombos[indexToRegenerate];

    // Set loading state for the specific card
    const updatedCombos = originalAdvice.outfitCombos.map((combo, index) => 
        index === indexToRegenerate ? { ...combo, isRegenerating: true } : combo
    );
    setFashionAdvice({ ...originalAdvice, outfitCombos: updatedCombos });
    setError(null);

    try {
        const { base64, mimeType } = await fileToBase64(imageFile);
        const newOutfit = await regenerateOutfitCombo(base64, mimeType, outfitToRegenerate);

        // Replace the old outfit with the new one
        const finalCombos = originalAdvice.outfitCombos.map((combo, index) => 
            index === indexToRegenerate ? { ...newOutfit, isRegenerating: false } : combo
        );
        setFashionAdvice({ ...originalAdvice, outfitCombos: finalCombos });

    } catch (err) {
        console.error('Failed to regenerate outfit:', err);
        setFashionAdvice(originalAdvice);
        const tempError = 'Sorry, we couldn\'t create a new look. Please try again.';
        setError(tempError);
        setTimeout(() => {
          setError(currentError => currentError === tempError ? null : currentError);
        }, 5000);
    }
  }, [fashionAdvice, imageFile]);

  const renderOotdSection = () => {
    if (!isOotdDisplayed) {
      return (
        <div className="text-center">
            <button
                onClick={handleFetchOotd}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                <CalendarIcon className="w-6 h-6 mr-2" />
                Get Today's Style Inspo
            </button>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md mx-auto">
        {isOotdLoading && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
              <p className="text-gray-600 font-semibold">Generating your daily inspiration...</p>
              <p className="text-sm text-gray-500 mt-1">This can take a moment.</p>
          </div>
        )}
        {ootdError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
            <p>{ootdError}</p>
          </div>
        )}
        {ootd && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in border border-stone-200">
            <img src={ootd.imageUrl} alt="Outfit of the day" className="w-full h-80 object-cover" />
            <div className="p-6">
              <p className="text-gray-700 italic">{ootd.description}</p>
              <div className="mt-4 text-right">
                   <button onClick={handleShareOotd} className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50">
                      <ShareIcon className="w-5 h-5 mr-2" />
                      {ootdShareStatus === 'copied' ? 'Copied!' : 'Share'}
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-stone-200 text-gray-800">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">AI Fashion Stylist</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">Upload your photo for personalized fashion recommendations, or get a dose of daily style inspiration!</p>
        </header>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl shadow-stone-300/50 overflow-hidden">
          <div className="p-6 md:p-10">
            {!fashionAdvice ? (
              <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Outfit of the Day</h2>
                    {renderOotdSection()}
                </section>

                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <section>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Share Your Look for Style Tips</h2>
                    <ImageUploader onImageUpload={handleImageUpload} imagePreviewUrl={imagePreview} onClear={handleReset} />
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleGetStyleAdvice}
                        disabled={!imageFile || isLoading}
                        className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner />
                            <span className="ml-2">Crafting your look...</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-6 h-6 mr-2" />
                            Get Style Advice
                          </>
                        )}
                      </button>
                    </div>
                </section>
              </div>
            ) : (
              <StyleResults advice={fashionAdvice} onReset={handleReset} onRegenerateOutfit={handleRegenerateOutfit} onRateOutfit={handleRateOutfit} />
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center animate-fade-in">
                <ExclamationTriangleIcon className="w-5 h-5 mr-3"/>
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Google Gemini. For entertainment purposes only.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;