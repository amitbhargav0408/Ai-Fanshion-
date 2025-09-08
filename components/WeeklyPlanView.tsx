import React from 'react';
import type { WeeklyPlan } from '../types';
import { ArrowLeftIcon, CalendarWeekIcon, StarIcon, ExclamationTriangleIcon } from './Icons';
import ProductItem from './ProductItem';

interface WeeklyPlanViewProps {
  plan: WeeklyPlan | null;
  onReset: () => void;
}

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({ plan, onReset }) => {
  if (!plan) return null;

  // Sort the plan according to the dayOrder array
  const sortedPlan = [...plan].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

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
          <CalendarWeekIcon className="w-8 h-8 mr-3 text-teal-500" />
          Your Weekly Style Plan
        </h2>
        <div className="space-y-6">
          {sortedPlan.map((dayPlan) => (
            <div key={dayPlan.day} className="bg-stone-50 rounded-lg shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-5 bg-stone-100 border-b border-stone-200">
                <h3 className="font-bold text-xl text-gray-900">{dayPlan.day}</h3>
                <p className="text-sm font-semibold text-gray-600 mt-1">{dayPlan.occasion}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-5">
                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-200">
                   {dayPlan.outfit.imageError ? (
                    <div className="w-full h-full bg-red-50 border border-red-200 flex items-center justify-center p-4">
                      <div className="text-center text-red-700">
                        <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold">Image Failed</p>
                      </div>
                    </div>
                  ) : dayPlan.outfit.imageUrl ? (
                    <img src={dayPlan.outfit.imageUrl} alt={`Virtual try-on for ${dayPlan.day}`} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center animate-pulse">
                      <div className="text-center text-gray-500">
                        <StarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">Generating image...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                    <p className="text-sm italic text-gray-700 mb-4">{dayPlan.outfit.summary}</p>
                    <ul className="space-y-3 text-gray-600 text-sm">
                      <ProductItem label="Top" product={dayPlan.outfit.top} />
                      <ProductItem label="Bottom" product={dayPlan.outfit.bottom} />
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