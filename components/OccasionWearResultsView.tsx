import React from 'react';
import type { Occasion, OccasionWearResults } from '../types';
import { ArrowLeftIcon, GiftIcon, StarIcon, ExclamationTriangleIcon, DownloadIcon } from './Icons';
import ProductItem from './ProductItem';

interface OccasionWearResultsViewProps {
  results: OccasionWearResults | null;
  occasion: Occasion;
  onReset: () => void;
  onImageZoom: (url: string) => void;
  onDownloadImage: (imageUrl: string, filename: string) => void;
}

const OccasionWearResultsView: React.FC<OccasionWearResultsViewProps> = ({ results, occasion, onReset, onImageZoom, onDownloadImage }) => {
  if (!results) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onReset} className="inline-flex items-center text-gray-600 hover:text-black font-semibold transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Start Over
        </button>
      </div>

      <section>
        <h2 className="flex items-center text-3xl font-bold mb-6 text-black">
          <GiftIcon className="w-8 h-8 mr-3 text-yellow-400" />
          Your Outfits for a {occasion}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((outfit) => (
            <div key={outfit.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-200">
              <div className="relative w-full h-80">
                {outfit.imageError ? (
                  <div className="w-full h-full bg-red-50 border-b border-red-200 flex items-center justify-center p-4">
                    <div className="text-center text-red-600">
                      <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-80" />
                      <p className="font-semibold">Image Generation Failed</p>
                    </div>
                  </div>
                ) : outfit.imageUrl ? (
                  <>
                    <div onClick={() => onImageZoom(outfit.imageUrl!)} className="w-full h-full cursor-zoom-in">
                      <img src={outfit.imageUrl} alt={`Virtual try-on for ${outfit.occasion}`} className="w-full h-full object-cover object-top" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadImage(outfit.imageUrl!, `occasion-wear-${occasion.toLowerCase().replace(/\s+/g, '-')}`) }}
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
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-black">{`Look for a ${outfit.occasion}`}</h3>
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
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OccasionWearResultsView;