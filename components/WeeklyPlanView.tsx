import React, { useState } from 'react';
import type { WeeklyPlan } from '../types';
import { ArrowLeftIcon, CalendarWeekIcon, StarIcon, ExclamationTriangleIcon, DownloadIcon, ShareIcon } from './Icons';
import ProductItem from './ProductItem';

interface WeeklyPlanViewProps {
  plan: WeeklyPlan | null;
  onReset: () => void;
  onImageZoom: (url: string) => void;
  onDownloadImage: (imageUrl: string, filename: string) => void;
}

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({ plan, onReset, onImageZoom, onDownloadImage }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  if (!plan) return null;

  const handleSharePlan = async () => {
    if (!plan) return;

    const summary = plan.slice(0, 3).map(dayPlan => `- ${dayPlan.day}: ${dayPlan.occasion}`).join('\n');
    
    const shareText = `My AI Fashion Stylist just planned my whole week of outfits! 👗✨ Here's a glimpse:\n\n${summary}\n\nDiscover your own weekly style plan! #AIStylist #WeeklyWardrobe #FashionPlanner`;

    const shareData = {
        title: 'My AI-Generated Weekly Style Plan',
        text: shareText,
        url: window.location.href,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Error sharing weekly plan:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            setShareStatus('copied');
            setTimeout(() => setShareStatus('idle'), 2500);
        } catch (err) {
            console.error('Failed to copy weekly plan to clipboard:', err);
            alert('Failed to copy plan to clipboard.');
        }
    }
  };

  // Sort the plan according to the dayOrder array
  const sortedPlan = [...plan].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onReset} className="inline-flex items-center text-gray-600 hover:text-black font-semibold transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Start Over
        </button>
        <button 
          onClick={handleSharePlan} 
          className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
          disabled={shareStatus === 'copied'}
        >
          <ShareIcon className="w-5 h-5 mr-2" />
          {shareStatus === 'copied' ? 'Copied!' : 'Share Plan'}
        </button>
      </div>

      <section>
        <h2 className="flex items-center text-3xl font-bold mb-6 text-black">
          <CalendarWeekIcon className="w-8 h-8 mr-3 text-yellow-400" />
          Your Weekly Style Plan
        </h2>
        <div className="space-y-6">
          {sortedPlan.map((dayPlan) => (
            <div key={dayPlan.day} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 bg-gray-100 border-b border-gray-200">
                <h3 className="font-bold text-xl text-black">{dayPlan.day}</h3>
                <p className="text-sm font-semibold text-gray-600 mt-1">{dayPlan.occasion}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-5">
                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-200">
                   {dayPlan.outfit.imageError ? (
                    <div className="w-full h-full bg-red-50 border border-red-200 flex items-center justify-center p-4">
                      <div className="text-center text-red-600">
                        <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold">Image Failed</p>
                      </div>
                    </div>
                  ) : dayPlan.outfit.imageUrl ? (
                    <>
                      <div onClick={() => onImageZoom(dayPlan.outfit.imageUrl!)} className="w-full h-full cursor-zoom-in">
                        <img src={dayPlan.outfit.imageUrl} alt={`Virtual try-on for ${dayPlan.day}`} className="w-full h-full object-cover object-top" />
                      </div>
                      <button
                          onClick={(e) => { e.stopPropagation(); onDownloadImage(dayPlan.outfit.imageUrl!, `weekly-plan-${dayPlan.day.toLowerCase()}`) }}
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
                <div>
                    <p className="text-sm italic text-gray-600 mb-4">{dayPlan.outfit.summary}</p>
                    <ul className="space-y-3 text-gray-700 text-sm">
                      {dayPlan.outfit.dress && <ProductItem label="Dress" product={dayPlan.outfit.dress} />}
                      {dayPlan.outfit.top && <ProductItem label="Top" product={dayPlan.outfit.top} />}
                      {dayPlan.outfit.bottom && <ProductItem label="Bottom" product={dayPlan.outfit.bottom} />}
                      <ProductItem label="Shoes" product={dayPlan.outfit.shoes} />
                      <ProductItem label="Accessories" product={dayPlan.outfit.accessories} />
                    </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WeeklyPlanView;