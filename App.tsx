
import React, { useState, useCallback } from 'react';
import { getFashionAdvice } from './services/geminiService';
import type { FashionAdvice } from './types';
import ImageUploader from './components/ImageUploader';
import StyleResults from './components/StyleResults';
import LoadingSpinner from './components/LoadingSpinner';
import { SparklesIcon, ExclamationTriangleIcon } from './components/Icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fashionAdvice, setFashionAdvice] = useState<FashionAdvice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const advice = await getFashionAdvice(base64, mimeType);
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-stone-200 text-gray-800">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">AI Fashion Stylist</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Upload your photo and get personalized fashion recommendations from our AI stylist.</p>
        </header>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl shadow-stone-300/50 overflow-hidden">
          <div className="p-6 md:p-10">
            {!fashionAdvice ? (
              <>
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
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        Get Style Advice
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <StyleResults advice={fashionAdvice} onReset={handleReset} />
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
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
