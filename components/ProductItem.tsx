import React from 'react';
import type { ProductSuggestion } from '../types';
import { ExternalLinkIcon } from './Icons';

interface ProductItemProps {
  label: string;
  product: ProductSuggestion;
}

const ProductItem: React.FC<ProductItemProps> = ({ label, product }) => {
  const isNA = !product.productName || product.productName.toLowerCase() === 'n/a' || !product.purchaseLink || product.purchaseLink.toLowerCase() === 'n/a';
  const isNone = product.description.toLowerCase() === 'none';

  if (isNone) {
    return (
      <li>
        <p><span className="font-semibold text-gray-800">{label}:</span> None</p>
      </li>
    );
  }

  return (
    <li>
      <div className="flex flex-col">
        <p><span className="font-semibold text-gray-800">{label}:</span> {product.description}</p>
        {!isNA && (
          <a
            href={product.purchaseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors group"
            aria-label={`Shop for ${product.productName}`}
          >
            Shop: {product.productName}
            <ExternalLinkIcon className="w-4 h-4 ml-1.5 opacity-70 group-hover:opacity-100" />
          </a>
        )}
      </div>
    </li>
  );
};

export default ProductItem;
