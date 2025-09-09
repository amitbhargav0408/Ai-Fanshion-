import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getFashionAdvice, getOotd, regenerateOutfitCombo, getWeeklyPlan, getOccasionWear, detectPeople, getCoordinatedAdvice } from './services/geminiService';
import type { FashionAdvice, Ootd, WeeklyPlan, Occasion, OccasionWearResults, CoordinatedAdvice, CoordinatedOutfitSet, UserPreferences } from './types';
import ImageUploader from './components/ImageUploader';
import StyleResults from './components/StyleResults';
import LoadingSpinner from './components/LoadingSpinner';
import WeeklyPlanView from './components/WeeklyPlanView';
import OccasionWearResultsView from './components/OccasionWearResultsView';
import ProductItem from './components/ProductItem';
import { SparklesIcon, ExclamationTriangleIcon, CalendarIcon, ShareIcon, CalendarWeekIcon, CheckCircleIcon, GiftIcon, ShoppingBagIcon, InstagramIcon, PinterestIcon, FacebookIcon, WhatsAppIcon, HeartIcon, StarIcon, SareeIcon, ArrowLeftIcon, UserIcon, UsersIcon, StylistLogoIcon, DownloadIcon } from './components/Icons';
import ImageZoomModal from './components/ImageZoomModal';

const handleDownloadImage = (imageUrl: string, filename: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const mimeType = imageUrl.split(';')[0].split(':')[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Sub-component for displaying Coordinated Advice Results
const CoordinatedAdviceView: React.FC<{ advice: CoordinatedAdvice; onReset: () => void; onImageZoom: (url: string) => void; }> = ({ advice, onReset, onImageZoom }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onReset} className="inline-flex items-center text-gray-600 hover:text-black font-semibold transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Start Over
                </button>
            </div>
            <section>
                <h2 className="flex items-center text-3xl font-bold mb-4 text-black">
                    <UsersIcon className="w-8 h-8 mr-3 text-yellow-400" />
                    Your Coordinated Style Guide
                </h2>
                <p className="mb-8 text-lg text-gray-700 bg-gray-100 p-4 rounded-lg">{advice.overallSummary}</p>
                <div className="space-y-8">
                    {advice.outfitSets.map((set) => (
                        <div key={set.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-5 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-2xl text-black">{set.occasion}</h3>
                            </div>
                            <div className="p-5 space-y-6">
                                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-200">
                                   {set.imageError ? (
                                    <div className="w-full h-full bg-red-50 border border-red-200 flex items-center justify-center p-4">
                                      <div className="text-center text-red-600">
                                        <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-80" />
                                        <p className="font-semibold">Image Generation Failed</p>
                                      </div>
                                    </div>
                                  ) : set.imageUrl ? (
                                    <>
                                      <div onClick={() => onImageZoom(set.imageUrl!)} className="w-full h-full cursor-zoom-in">
                                        <img src={set.imageUrl} alt={`Virtual try-on for ${set.occasion}`} className="w-full h-full object-cover object-top" />
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDownloadImage(set.imageUrl!, `coordinated-outfit-${set.occasion.toLowerCase().replace(/\s+/g, '-')}`) }}
                                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                                        title="Download image"
                                        aria-label="Download image"
                                      >
                                          <DownloadIcon className="w-6 h-6" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center animate-pulse">
                                      <div className="text-center text-gray-400">
                                        <StarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="font-semibold">Generating image...</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-bold text-blue-800">Coordination Rationale</h4>
                                    <p className="text-blue-700 mt-1">{set.coordinationRationale}</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold text-lg text-black mb-2">Look 1</h4>
                                        <p className="text-sm italic text-gray-600 mb-4">{set.person1Outfit.summary}</p>
                                        <ul className="space-y-3 text-gray-600 text-sm">
                                            {set.person1Outfit.dress && <ProductItem label="Dress" product={set.person1Outfit.dress} />}
                                            {set.person1Outfit.top && <ProductItem label="Top" product={set.person1Outfit.top} />}
                                            {set.person1Outfit.bottom && <ProductItem label="Bottom" product={set.person1Outfit.bottom} />}
                                            <ProductItem label="Shoes" product={set.person1Outfit.shoes} />
                                            <ProductItem label="Accessories" product={set.person1Outfit.accessories} />
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-black mb-2">Look 2</h4>
                                        <p className="text-sm italic text-gray-600 mb-4">{set.person2Outfit.summary}</p>
                                        <ul className="space-y-3 text-gray-600 text-sm">
                                            {set.person2Outfit.dress && <ProductItem label="Dress" product={set.person2Outfit.dress} />}
                                            {set.person2Outfit.top && <ProductItem label="Top" product={set.person2Outfit.top} />}
                                            {set.person2Outfit.bottom && <ProductItem label="Bottom" product={set.person2Outfit.bottom} />}
                                            <ProductItem label="Shoes" product={set.person2Outfit.shoes} />
                                            <ProductItem label="Accessories" product={set.person2Outfit.accessories} />
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

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
  const [coordinatedAdvice, setCoordinatedAdvice] = useState<CoordinatedAdvice | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // State for multi-person detection
  const [detectedPeople, setDetectedPeople] = useState<{ description: string }[] | null>(null);
  const [selectedPersonOption, setSelectedPersonOption] = useState<number | 'both' | null>(null);
  
  // State for user preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});

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
      setCoordinatedAdvice(null);
      setError(null);
      localStorage.removeItem('fashionRatings');
  }

  const analyzeImageForPeople = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Analyzing photo for people...');
    setDetectedPeople(null);
    setSelectedPersonOption(null);
    try {
        const { base64, mimeType } = await fileToBase64(file);
        const people = await detectPeople(base64, mimeType);
        setDetectedPeople(people);
    } catch (err) {
        console.error(err);
        setError("Sorry, we couldn't analyze your photo. Please try another one.");
        handleReset(); // Clear image if analysis fails
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    clearAllResults();
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    analyzeImageForPeople(file);
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

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateAdvice = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    // Check if a selection is needed but not made
    if (detectedPeople && detectedPeople.length > 1 && selectedPersonOption === null) {
        setError("Please select who you'd like to style.");
        return;
    }

    setIsLoading(true);
    clearAllResults();
    
    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      
      if (selectedPersonOption === 'both') {
          setLoadingMessage('Creating coordinated styles...');
          const advice = await getCoordinatedAdvice(base64, mimeType);
          setCoordinatedAdvice(advice);
      } else {
          setLoadingMessage('Crafting your personal style...');
          const personDescription = (typeof selectedPersonOption === 'number' && detectedPeople) 
              ? detectedPeople[selectedPersonOption].description 
              : undefined;

          const advice = await getFashionAdvice(base64, mimeType, personDescription, userPreferences);
          
          try {
            const savedRatings = JSON.parse(localStorage.getItem('fashionRatings') || '{}');
            advice.outfitCombos.forEach(combo => {
                if (savedRatings[combo.id]) {
                    combo.rating = savedRatings[combo.id];
                }
            });
          } catch (e) { console.error("Could not parse ratings from localStorage", e); }
          
          setFashionAdvice(advice);
      }
    } catch (err) {
      console.error(err);
      setError('Sorry, something went wrong while getting your style advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, detectedPeople, selectedPersonOption, userPreferences]);
  
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
    setDetectedPeople(null);
    setSelectedPersonOption(null);
    setUserPreferences({});
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
  
  const handleImageZoom = (url: string) => {
    if (url) setZoomedImageUrl(url);
  };

  const handleCloseZoom = () => {
    setZoomedImageUrl(null);
  };

  const renderOotdSection = () => {
    if (!isOotdDisplayed) {
      return (
        <div className="text-center">
            <button
                onClick={handleFetchOotd}
                className="inline-flex items-center justify-center px-6 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-md"
            >
                <CalendarIcon className="w-6 h-6 mr-2 text-black" />
                Get Today's Style Inspo
            </button>
        </div>
      );
    }
    return (
      <div className="w-full max-w-md mx-auto">
        {isOotdLoading && ( <div className="text-center p-8 bg-gray-100/50 rounded-lg backdrop-blur-sm"><div className="flex justify-center mb-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div></div><p className="text-gray-700 font-semibold">Generating daily inspiration...</p></div> )}
        {ootdError && ( <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-3" /><p>{ootdError}</p></div> )}
        {ootd && ( <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"><img src={ootd.imageUrl} alt="Outfit of the day" className="w-full h-80 object-cover" /><div className="p-6"><p className="text-gray-600 italic">{ootd.description}</p><div className="mt-4 flex justify-end items-center gap-2">
            <button
                onClick={() => handleDownloadImage(ootd.imageUrl, 'outfit-of-the-day')}
                className="p-2.5 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors"
                aria-label="Download image"
                title="Download Image"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
            <button onClick={handleShareOotd} className="inline-flex items-center px-4 py-2 bg-blue-400 text-black font-semibold rounded-full hover:bg-blue-300 transition-colors disabled:opacity-50"><ShareIcon className="w-5 h-5 mr-2" />{ootdShareStatus === 'copied' ? 'Copied!' : 'Share'}</button>
        </div></div></div> )}
      </div>
    );
  };
  
  const renderPersonSelector = () => {
    if (!imagePreview || !detectedPeople || detectedPeople.length <= 1) return null;
    return (
        <div className="mt-6 p-6 bg-gray-100 rounded-xl border border-gray-200 animate-fade-in">
            <h3 className="text-xl font-bold text-center text-black">Multiple People Detected</h3>
            <p className="text-center text-gray-600 mt-1 mb-4">Who should we style?</p>
            <div className="flex flex-col gap-3">
                {detectedPeople.map((person, index) => (
                    <button key={index} onClick={() => setSelectedPersonOption(index)}
                        className={`p-4 rounded-lg text-left font-semibold transition-all flex items-center gap-3 border ${selectedPersonOption === index ? 'bg-yellow-400 text-black shadow-md border-yellow-400' : 'bg-white text-black hover:bg-gray-200 border-gray-300'}`}>
                        <UserIcon className="w-6 h-6" /> {person.description}
                    </button>
                ))}
                <button onClick={() => setSelectedPersonOption('both')}
                    className={`p-4 rounded-lg text-left font-semibold transition-all flex items-center gap-3 border ${selectedPersonOption === 'both' ? 'bg-yellow-400 text-black shadow-md border-yellow-400' : 'bg-white text-black hover:bg-gray-200 border-gray-300'}`}>
                    <UsersIcon className="w-6 h-6" /> Both Together
                </button>
            </div>
        </div>
    );
  };

  const renderPreferencesSelector = () => {
    if (!imagePreview) return null;
    return (
      <div className="mt-6 p-6 bg-gray-100 rounded-xl border border-gray-200 animate-fade-in">
        <h3 className="text-xl font-bold text-center text-black">Fine-Tune Your Style (Optional)</h3>
        <p className="text-center text-gray-600 mt-1 mb-4 text-sm">Tell us what you like and dislike for better recommendations.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="preferredColors" className="block text-sm font-medium text-gray-700 mb-1">Likes</label>
            <input
                type="text"
                name="preferredColors"
                id="preferredColors"
                value={userPreferences.preferredColors || ''}
                onChange={handlePreferenceChange}
                placeholder="e.g., earthy tones, floral prints"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
          </div>
          <div>
            <label htmlFor="dislikedStyles" className="block text-sm font-medium text-gray-700 mb-1">Dislikes</label>
            <input
                type="text"
                name="dislikedStyles"
                id="dislikedStyles"
                value={userPreferences.dislikedStyles || ''}
                onChange={handlePreferenceChange}
                placeholder="e.g., animal prints, baggy clothes"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderLandingPage = () => {
    const occasions: { name: Occasion; icon: React.ReactNode }[] = [
        { name: 'Wedding', icon: <HeartIcon className="w-8 h-8 mx-auto mb-2 text-yellow-400"/> },
        { name: 'Reception', icon: <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-yellow-400"/> },
        { name: 'Party', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>},
        { name: 'Mehendi', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18.364 5.636l-3.536 3.536m0 0l-3.535 3.536m3.535-3.536l3.536 3.535M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
        { name: 'Festival', icon: <StarIcon className="w-8 h-8 mx-auto mb-2 text-yellow-400"/> },
        { name: 'Saree', icon: <SareeIcon className="w-8 h-8 mx-auto mb-2 text-yellow-400"/> },
    ];
    
    const isAdviceButtonDisabled = !imageFile || isLoading || (detectedPeople != null && detectedPeople.length > 1 && selectedPersonOption === null);

    return (
        <div className="space-y-24 md:space-y-32">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gray-50 -z-10" />
              <header className="text-center px-4 py-16 md:py-24">
                <StylistLogoIcon className="w-24 h-24 mx-auto mb-6 text-yellow-400" />
                <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">AI Styling for Every Occasion</h1>
                <h2 className="text-2xl md:text-3xl text-amber-500 font-semibold mb-6">Look Smart. Feel Confident.</h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">Upload your photo and get instant outfit suggestions, color matches, and shopping links tailored for you.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg">👉 Try Now</button>
                    <button onClick={() => trendsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-3 bg-transparent border-2 border-yellow-400 text-yellow-500 font-semibold rounded-full hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-105 shadow-md">See Latest Trends</button>
                </div>
              </header>
            </div>
            
            <section className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white border p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400"/> <h3 className="font-bold text-lg text-black">AI Outfit of the Day</h3> <p className="text-sm text-gray-500 mt-1">Get fresh daily style inspo</p></div>
                    <div className="bg-white border p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <CalendarWeekIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400"/> <h3 className="font-bold text-lg text-black">Weekly Outfit Planner</h3> <p className="text-sm text-gray-500 mt-1">Personalized looks for Monday–Sunday</p></div>
                    <div className="bg-white border p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <GiftIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400"/> <h3 className="font-bold text-lg text-black">Special Occasion Wear</h3> <p className="text-sm text-gray-500 mt-1">Wedding, party & festival outfits</p></div>
                    <div className="bg-white border p-6 rounded-xl shadow-lg text-center transition-transform transform hover:-translate-y-2"> <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400"/> <h3 className="font-bold text-lg text-black">Shop the Look</h3> <p className="text-sm text-gray-500 mt-1">Buy clothing & accessories directly</p></div>
                </div>
            </section>
            
            <section ref={trendsSectionRef}>
                <h2 className="text-3xl font-bold text-center text-black mb-8">Latest Fashion Trends</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80)'}}>Streetwear</div>
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80)'}}>Business Casual</div>
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80)'}}>Party Wear</div>
                    <div className="h-64 rounded-lg bg-gray-700 bg-cover bg-center flex items-end p-4 text-white font-bold shadow-lg transition-transform transform hover:scale-105" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(https://images.unsplash.com/photo-1511285560931-16081d605179?w=500&q=80)'}}>Wedding Styles</div>
                </div>
            </section>
            
            <section ref={uploadSectionRef} className="p-8 bg-gray-50 rounded-2xl shadow-xl shadow-gray-200">
                <h2 className="text-3xl font-bold text-center text-black mb-4">Get Your Personalized Style</h2>
                <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">Upload a photo, let AI work its magic, and get your personalized style report in seconds.</p>
                <ImageUploader onImageUpload={handleImageUpload} imagePreviewUrl={imagePreview} onClear={handleReset} />
                {renderPersonSelector()}
                {renderPreferencesSelector()}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={handleGenerateAdvice} disabled={isAdviceButtonDisabled} className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"><SparklesIcon className="w-6 h-6 mr-2" />Get Style Tips</button>
                    <button onClick={handleGetWeeklyPlan} disabled={!imageFile || isLoading} className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-teal-500 text-white font-semibold rounded-full hover:bg-teal-600 transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"><CalendarWeekIcon className="w-6 h-6 mr-2" />Create Weekly Plan</button>
                </div>
            </section>

            <section>
                 <h2 className="text-3xl font-bold text-center text-black mb-8">Need an Outfit for a Special Occasion?</h2>
                 <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">Upload your photo above, then select an event below to get stunning, AI-curated looks.</p>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {occasions.map(({ name, icon }) => (
                        <button key={name} onClick={() => handleGetOccasionWear(name)} disabled={isLoading} className="p-6 bg-white border rounded-xl shadow-lg text-center transition-all transform hover:-translate-y-2 hover:shadow-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait">
                            {icon}
                            <h3 className="font-bold text-lg text-black">{name}</h3>
                        </button>
                    ))}
                 </div>
            </section>
             <section>
                <h2 className="text-3xl font-bold text-center text-black mb-8">Outfit of the Day</h2>
                {renderOotdSection()}
            </section>
        </div>
    );
  };
  
  const renderLoadingScreen = () => (
     <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400"></div>
        <p className="text-black font-semibold text-xl mt-6">{loadingMessage}</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment while our AI works its magic!</p>
    </div>
  );

  const renderResults = () => {
     return (
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl shadow-gray-200 overflow-hidden">
            <div className="p-6 md:p-10">
                {fashionAdvice && <StyleResults advice={fashionAdvice} onReset={handleReset} onRegenerateOutfit={handleRegenerateOutfit} onRateOutfit={handleRateOutfit} onImageZoom={handleImageZoom} onDownloadImage={handleDownloadImage} />}
                {weeklyPlan && <WeeklyPlanView plan={weeklyPlan} onReset={handleReset} onImageZoom={handleImageZoom} onDownloadImage={handleDownloadImage} />}
                {occasionWearResults && selectedOccasion && <OccasionWearResultsView results={occasionWearResults} occasion={selectedOccasion} onReset={handleReset} onImageZoom={handleImageZoom} onDownloadImage={handleDownloadImage} />}
                {coordinatedAdvice && <CoordinatedAdviceView advice={coordinatedAdvice} onReset={handleReset} onImageZoom={handleImageZoom} />}
            </div>
        </div>
     );
  }

  const hasResults = fashionAdvice || weeklyPlan || occasionWearResults || coordinatedAdvice;

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        
        {isLoading ? renderLoadingScreen() : hasResults ? renderResults() : renderLandingPage()}

        {error && !hasResults && (
            <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center animate-fade-in">
                <ExclamationTriangleIcon className="w-5 h-5 mr-3"/>
                <p>{error}</p>
            </div>
        )}

        {zoomedImageUrl && <ImageZoomModal imageUrl={zoomedImageUrl} onClose={handleCloseZoom} onDownload={handleDownloadImage} />}

        <footer className="text-center mt-16 pt-8 border-t border-gray-200">
            <div className="flex justify-center gap-6 mb-4">
                <a href="#" className="text-gray-500 hover:text-black"><InstagramIcon className="w-6 h-6"/></a>
                <a href="#" className="text-gray-500 hover:text-black"><PinterestIcon className="w-6 h-6"/></a>
                <a href="#" className="text-gray-500 hover:text-black"><FacebookIcon className="w-6 h-6"/></a>
                <a href="#" className="text-gray-500 hover:text-black"><WhatsAppIcon className="w-6 h-6"/></a>
            </div>
            <div className="flex justify-center gap-4 text-sm text-gray-500 mb-4">
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
