import React, { useRef } from 'react';
import { UploadIcon, XCircleIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreviewUrl: string | null;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreviewUrl, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };


  if (imagePreviewUrl) {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <img src={imagePreviewUrl} alt="Preview" className="w-full h-auto rounded-xl shadow-lg" />
        <button
          onClick={onClear}
          className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-red-100 transition-colors"
          aria-label="Remove image"
        >
          <XCircleIcon className="w-8 h-8 text-red-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="w-full border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-yellow-400 transition-all duration-300 bg-gray-100"
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        aria-label="Upload an image"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        <div className="flex flex-col items-center justify-center text-gray-500 pointer-events-none">
          <UploadIcon className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-800">Drag & Drop or Click to Upload</h3>
          <p className="mt-1 text-sm">PNG, JPG, or WEBP. (Your photo is private and not stored)</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;