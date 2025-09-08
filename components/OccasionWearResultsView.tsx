import React from 'react';
import type { Occasion, OccasionWearResults } from '../types';
import { ArrowLeftIcon, GiftIcon, StarIcon, ExclamationTriangleIcon } from './Icons';
import ProductItem from './ProductItem';

interface OccasionWearResultsViewProps {
  results: OccasionWearResults | null;
  occasion: Occasion;
  onReset: () => void;
}

const OccasionWearResultsView: React.FC<OccasionWearResultsViewProps> = ({ results, occasion, onReset }) => {
  if (!results) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onReset} className="inline-flex items-center text-gray-600 hover:text-gray-900 font-semibold transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Start Over
        </button>
      </div>

      <section>
        <h2 className="flex items-center text-3xl font-bold mb-6 text-gray-800">
          <GiftIcon className="w-8 h-8 mr-3 text-purple-500" />
          Your Outfits for a {occasion}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((outfit) => (
            <div key={outfit.id} className="bg-stone-50 rounded-lg shadow-sm overflow-hidden flex flex-col border border-stone-200">
              <div className="relative w-full h-80">
                {outfit.imageError ? (
                  <div className="w-full h-full bg-red-50 border-b border-red-200 flex items-center justify-center p-4">
                    <div className="text-center text-red-700">
                      <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-80" />
                      <p className="font-semibold">Image Generation Failed</p>
                    </div>
                  </div>
                ) : outfit.imageUrl ? (
                  <img src={outfit.imageUrl} alt={`Virtual try-on for ${outfit.occasion}`} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center animate-pulse">
                    <div className="text-center text-gray-500">
                      <StarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">Generating image...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-gray-900">{`Look for a ${outfit.occasion}`}</h3>
                <div className="flex-grow mt-1">
                  <p className="text-sm text-gray-700">{outfit.summary}</p>
                  <div className="mt-4 pt-4 border-t border-stone-200 text-sm">
                    <ul className="space-y-3 text-gray-600">
                      <ProductItem label="Top" product={outfit.top} />
                      <ProductItem label="Bottom" product={outfit.bottom} />
                      <ProductItem label="Shoes" product={outfit.shoes} />
                      <ProductItem label="Accessories" product={outfit.accessories} />
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

export default OccasionWearResultsView;
