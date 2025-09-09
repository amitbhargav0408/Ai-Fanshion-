import React, { useEffect } from 'react';
import { XCircleIcon, DownloadIcon } from './Icons';

interface ImageZoomModalProps {
  imageUrl: string;
  onClose: () => void;
  onDownload: (imageUrl: string, filename: string) => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, onClose, onDownload }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image zoom view"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50"
        aria-label="Close zoomed image"
      >
        <XCircleIcon className="w-10 h-10" />
      </button>
      <div
        className="relative max-w-[90vw] max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking on the image itself
      >
        <img
          src={imageUrl}
          alt="Zoomed virtual try-on"
          className="w-full h-full object-contain rounded-lg"
        />
        <button
            onClick={() => onDownload(imageUrl, 'ai-stylist-outfit')}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
            aria-label="Download image"
        >
            <DownloadIcon className="w-6 h-6" />
            Download Image
        </button>
      </div>
    </div>
  );
};

export default ImageZoomModal;