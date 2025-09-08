import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getFashionAdvice, getOotd, regenerateOutfitCombo, getWeeklyPlan, getOccasionWear } from './services/geminiService';
import type { FashionAdvice, Ootd, WeeklyPlan, Occasion, OccasionWearResults } from './types';
import ImageUploader from './components/ImageUploader';
import StyleResults from './components/StyleResults';
import LoadingSpinner from './components/LoadingSpinner';
import WeeklyPlanView from './components/WeeklyPlanView';
import OccasionWearResultsView from './components/OccasionWearResultsView';
// FIX: Added StarIcon to the import list to resolve a 'Cannot find name' error.
import { SparklesIcon, ExclamationTriangleIcon, CalendarIcon, ShareIcon, CalendarWeekIcon, CheckCircleIcon, GiftIcon, ShoppingBagIcon, InstagramIcon, PinterestIcon, TikTokIcon, HeartIcon, StarIcon } from './components/Icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // State for different results
  const [fashionAdvice, setFashionAdvice] = useState<FashionAdvice | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [occasionWearResults, setOccasionWearResults] = useState<OccasionWearResults | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  
  // OOTD State
  const [ootd, setOotd] = useState<Ootd | null>(null);
  const [isOotdLoading, setIsOotdLoading] = useState<boolean>(false);
  const [ootdError, setOotdError] = useState<string | null>(null);
  const [isOotdDisplayed, setIsOotdDisplayed] = useState<boolean>(false);
  const [ootdShareStatus, setOotdShareStatus] = useState<'idle' | 'copied'>('idle');

  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const trendsSectionRef = useRef<HTMLDivElement>(null);

  const clearAllResults = () => {
      setFashionAdvice(null);
      setWeeklyPlan(null);
      setOccasionWearResults(null);
      setSelectedOccasion(null);
      setError(null);
      localStorage.removeItem('fashionRatings');
  }

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    clearAllResults();
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
    setLoadingMessage('Crafting your personal style...');
    clearAllResults();
    
    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const advice = await getFashionAdvice(base64, mimeType);
      
      try {
        const savedRatings = JSON.parse(localStorage.getItem('fashionRatings') || '{}');
        advice.outfitCombos.forEach(combo => {
            if (savedRatings[combo.id]) {
                combo.rating = savedRatings[combo.id];
            }
        });
      } catch (e) { console.error("Could not parse ratings from localStorage", e); }
      
      setFashionAdvice(advice);
    } catch (err) {
      console.error(err);
      setError('Sorry, something went wrong while getting your style advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);
  
  const handleGetWeeklyPlan = useCallback(async () => {
    if (!imageFile) {
        setError('Please upload an image to generate a weekly plan.');
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Planning your week in style...');
    clearAllResults();

    try {
        const { base64, mimeType } = await fileToBase64(imageFile);
        const plan = await getWeeklyPlan(base64, mimeType);
        setWeeklyPlan(plan);
    } catch (err) {
        console.error(err);
        setError('We couldn\'t generate your weekly plan. Please try again.');
    } finally {
        setIsLoading(false);
    }
  }, [imageFile]);

  const handleGetOccasionWear = useCallback(async (occasion: Occasion) => {
    if (!imageFile) {
        alert('Please upload an image first to get occasion wear suggestions.');
        uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        uploadSectionRef.current?.classList.add('animate-pulse');
        setTimeout(() => uploadSectionRef.current?.classList.remove('animate-pulse'), 2000);
        return;
    }
    setIsLoading(true);
    setLoadingMessage(`Finding the perfect look for a ${occasion}...`);
    clearAllResults();
    setSelectedOccasion(occasion);
    
    try {
        const { base64, mimeType } = await fileToBase64(imageFile);
        const results = await getOccasionWear(occasion, base64, mimeType);
        setOccasionWearResults(results);
    } catch (err) {
        console.error(err);
        setError(`We couldn't generate outfits for your ${occasion}. Please try again.`);
    } finally {
        setIsLoading(false);
    }
  }, [imageFile]);


  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    clearAllResults();
    setIsLoading(false);
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
      try { await navigator.share({ title: "Today's Outfit of the Day", text: shareText, url: window.location.href }); } 
      catch (err) { console.error('Error sharing:', err); }
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
    const updatedCombos = fashionAdvice.outfitCombos.map(combo => combo.id === outfitId ? { ...combo, rating: combo.rating === newRating ? undefined : newRating } : combo);
    setFashionAdvice({ ...fashionAdvice, outfitCombos: updatedCombos });
    try {
      const ratings = JSON.parse(localStorage.getItem('fashionRatings') || '{}');
      const comboToUpdate = updatedCombos.find(c => c.id === outfitId);
      if (comboToUpdate?.rating) ratings[outfitId] = comboToUpdate.rating;
      else delete ratings[outfitId];
      localStorage.setItem('fashionRatings', JSON.stringify(ratings));
    } catch (e) { console.error("Failed to save ratings to localStorage", e); }
  }, [fashionAdvice]);

  const handleRegenerateOutfit = useCallback(async (indexToRegenerate: number) => {
    if (!fashionAdvice || !imageFile) return;
    const originalAdvice = { ...fashionAdvice };
    const outfitToRegenerate = originalAdvice.outfitCombos[indexToRegenerate];
    const updatedCombos = originalAdvice.outfitCombos.map((combo, index) => index === indexToRegenerate ? { ...combo, isRegenerating: true } : combo);
    setFashionAdvice({ ...originalAdvice, outfitCombos: updatedCombos });
    setError(null);
    try {
        const { base64, mimeType } = await fileToBase64(imageFile);
        const newOutfit = await regenerateOutfitCombo(base64, mimeType, outfitToRegenerate);
        const finalCombos = originalAdvice.outfitCombos.map((combo, index) => index === indexToRegenerate ? { ...newOutfit, isRegenerating: false } : combo);
        setFashionAdvice({ ...originalAdvice, outfitCombos: finalCombos });
    } catch (err) {
        console.error('Failed to regenerate outfit:', err);
        setFashionAdvice(originalAdvice);
        const tempError = 'Sorry, we couldn\'t create a new look. Please try again.';
        setError(tempError);
        setTimeout(() => { setError(currentError => currentError === tempError ? null : currentError); }, 5000);
    }
  }, [fashionAdvice, imageFile]);

  const renderOotdSection = () => {
    // This is part of the landing page now, simplified
    if (!isOotdDisplayed) {
      return (
        <div className="text-center">
            <button
                onClick={handleFetchOotd}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-800 font-semibold rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-md"
            >
                <CalendarIcon className="w-6 h-6 mr-2 text-pink-500" />
                Get Today's Style Inspo
            </button>
        </div>
      );
    }
    return (
      <div className="w-full max-w-md mx-auto">
        {isOotdLoading && ( <div className="text-center p-8 bg-white/50 rounded-lg backdrop-blur-sm"><div className="flex justify-center mb-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div><p className="text-gray-600 font-semibold">Generating daily inspiration...</p></div> )}
        {ootdError && ( <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-3" /><p>{ootdError}</p></div> )}
        {ootd && ( <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in border border-stone-200"><img src={ootd.imageUrl} alt="Outfit of the day" className="w-full h-80 object-cover" /><div className="p-6"><p className="text-gray-700 italic">{ootd.description}</p><div className="mt-4 text-right"><button onClick={handleShareOotd} className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"><ShareIcon className="w-5 h-5 mr-2" />{ootdShareStatus === 'copied' ? 'Copied!' : 'Share'}</button></div></div></div> )}
      </div>
    );
  };
  
  const renderLandingPage = () => {
    const occasions: { name: Occasion; icon: React.ReactNode }[] = [
        { name: 'Wedding', icon: <HeartIcon className="w-8 h-8 mx-auto mb-2 text-pink-500"/> },
        { name: 'Reception', icon: <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500"/> },
        { name: 'Party', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>},
        { name: 'Mehendi', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18.364 5.636l-3.536 3.536m0 0l-3.535 3.536m3.535-3.536l3.536 3.535M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
        { name: 'Festival', icon: <StarIcon className="w-8 h-8 mx-auto mb-2 text-orange-500"/> },
    ];
    return (
        <div className="space-y-24 md:space-y-32">
            <div className="relative rounded-3xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 animated-gradient-background -z-10" />
              <header className="text-center px-4 py-16 md:py-24">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Your AI Fashion Stylist</h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8">Personalized Outfits, Weekly Plans & Occasion Wear. Upload your photo and get instant outfit suggestions, color matches, and shopping links tailored for you.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">👉 Try Now</button>
                    <button onClick={() => trendsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-3 bg-white text-gray-800 font-semibold rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-md">See Latest Trends</button>
                </div>
              </header>
            </div>
            
            <section className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-pink-500"/> <h3 className="font-bold text-lg">AI Outfit of the Day</h3> <p className="text-sm text-gray-600 mt-1">Get fresh daily style inspo</p></div>
                    <div className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <CalendarWeekIcon className="w-12 h-12 mx-auto mb-4 text-teal-500"/> <h3 className="font-bold text-lg">Weekly Outfit Planner</h3> <p className="text-sm text-gray-600 mt-1">Personalized looks for Monday–Sunday</p></div>
                    <div className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <GiftIcon className="w-12 h-12 mx-auto mb-4 text-purple-500"/> <h3 className="font-bold text-lg">Special Occasion Wear</h3> <p className="text-sm text-gray-600 mt-1">Wedding, party & festival outfits</p></div>
                    <div className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 text-blue-500"/> <h3 className="font-bold text-lg">Shop the Look</h3> <p className="text-sm text-gray-600 mt-1">Buy clothing & accessories directly</p></div>
                </div>
            </section>
            
            <section ref={trendsSectionRef}>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Latest Fashion Trends</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80)'}}>Streetwear</div>
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80)'}}>Business Casual</div>
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80)'}}>Party Wear</div>
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1595493974330-9428a633a691?w=500&q=80)'}}>Wedding Styles</div>
                </div>
            </section>
            
            <section ref={uploadSectionRef} className="p-8 bg-white rounded-2xl shadow-2xl shadow-stone-300/50">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Get Your Personalized Style</h2>
                <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">Upload a photo, let AI work its magic, and get your personalized style report in seconds.</p>
                <ImageUploader onImageUpload={handleImageUpload} imagePreviewUrl={imagePreview} onClear={handleReset} />
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={handleGetStyleAdvice} disabled={!imageFile || isLoading} className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"><SparklesIcon className="w-6 h-6 mr-2" />Get Style Tips</button>
                    <button onClick={handleGetWeeklyPlan} disabled={!imageFile || isLoading} className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"><CalendarWeekIcon className="w-6 h-6 mr-2" />Create Weekly Plan</button>
                </div>
            </section>

            <section>
                 <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Need an Outfit for a Special Occasion?</h2>
                 <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">Upload your photo above, then select an event below to get stunning, AI-curated looks.</p>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {occasions.map(({ name, icon }) => (
                        <button key={name} onClick={() => handleGetOccasionWear(name)} disabled={isLoading} className="p-6 bg-white rounded-xl shadow-lg text-center transition-all transform hover:-translate-y-2 hover:shadow-xl disabled:opacity-50 disabled:cursor-wait">
                            {icon}
                            <h3 className="font-bold text-lg">{name}</h3>
                        </button>
                    ))}
                 </div>
            </section>
             <section>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Outfit of the Day</h2>
                {renderOotdSection()}
            </section>
        </div>
    );
  };
  
  const renderLoadingScreen = () => (
     <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
        <LoadingSpinner />
        <p className="text-gray-700 font-semibold text-xl mt-6">{loadingMessage}</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment while our AI works its magic!</p>
    </div>
  );

  const renderResults = () => {
     return (
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl shadow-stone-300/50 overflow-hidden">
            <div className="p-6 md:p-10">
                {fashionAdvice && <StyleResults advice={fashionAdvice} onReset={handleReset} onRegenerateOutfit={handleRegenerateOutfit} onRateOutfit={handleRateOutfit} />}
                {weeklyPlan && <WeeklyPlanView plan={weeklyPlan} onReset={handleReset} />}
                {occasionWearResults && selectedOccasion && <OccasionWearResultsView results={occasionWearResults} occasion={selectedOccasion} onReset={handleReset} />}
            </div>
        </div>
     );
  }

  const hasResults = fashionAdvice || weeklyPlan || occasionWearResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-stone-200 text-gray-800 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        
        {isLoading ? renderLoadingScreen() : hasResults ? renderResults() : renderLandingPage()}

        {error && !hasResults && (
            <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center animate-fade-in">
                <ExclamationTriangleIcon className="w-5 h-5 mr-3"/>
                <p>{error}</p>
            </div>
        )}

        <footer className="text-center mt-16 pt-8 border-t border-stone-300">
            <div className="flex justify-center gap-6 mb-4">
                <a href="#" className="text-gray-500 hover:text-gray-900"><InstagramIcon className="w-6 h-6"/></a>
                <a href="#" className="text-gray-500 hover:text-gray-900"><PinterestIcon className="w-6 h-6"/></a>
                <a href="#" className="text-gray-500 hover:text-gray-900"><TikTokIcon className="w-6 h-6"/></a>
            </div>
            <div className="flex justify-center gap-4 text-sm text-gray-600 mb-4">
                <a href="#" className="hover:underline">About</a>
                <a href="#" className="hover:underline">Contact</a>
                <a href="#" className="hover:underline">Privacy Policy</a>
            </div>
            <p className="text-gray-500 text-sm">Powered by AI • Styled for You</p>
            <p className="text-xs text-gray-400 mt-2">For entertainment purposes only.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;