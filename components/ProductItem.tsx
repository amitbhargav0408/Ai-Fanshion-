import React from 'react';
import type { ProductSuggestion } from '../types';

interface ProductItemProps {
  label: string;
  product: ProductSuggestion;
}

const getEmojiForLabel = (label: string): string => {
  switch (label.toLowerCase()) {
    case 'top': return '👕';
    case 'bottom': return '👖';
    case 'shoes': return '👞';
    case 'accessories': return '👜';
    case 'dress': return '👗';
    case 'jumpsuit': return '👚';
    default: return '🛍️';
  }
};

const getRetailerName = (urlString: string): string | null => {
  try {
    if (!urlString || urlString.toLowerCase() === 'n/a') return null;
    const url = new URL(urlString);
    let hostname = url.hostname;
    hostname = hostname.replace(/^www\./, '');
    const domain = hostname.split('.')[0];
    if (!domain) return null;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    // Silently fail for invalid URLs
    return null;
  }
};

const ProductItem: React.FC<ProductItemProps> = ({ label, product }) => {
  const isNone = product.description.toLowerCase() === 'none';

  let displayLabel = label;
  if (label.toLowerCase() === 'dress' && product.description.toLowerCase().includes('jumpsuit')) {
    displayLabel = 'Jumpsuit';
  }

  const emoji = getEmojiForLabel(displayLabel);

  if (isNone) {
    return (
      <li>
        <p><span className="mr-2" aria-hidden="true">{getEmojiForLabel(label)}</span><span className="font-semibold text-gray-800">{label}:</span> None</p>
      </li>
    );
  }
  
  const retailerName = getRetailerName(product.purchaseLink);

  return (
    <li>
        <p className="text-gray-700">
            <span className="mr-2" aria-hidden="true">{emoji}</span>
            {product.description}
            {retailerName && (
                <>
                    <span className="font-sans mx-1.5">–</span>
                    <a
                        href={product.purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors group whitespace-nowrap"
                        aria-label={`Shop for ${product.description} on ${retailerName}`}
                    >
                        Buy on {retailerName} &rarr;
                    </a>
                </>
            )}
        </p>
    </li>
  );
};

export default ProductItem;