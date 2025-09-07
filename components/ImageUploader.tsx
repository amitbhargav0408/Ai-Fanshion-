import React, { useRef, useState } from 'react';
import { UploadIcon, XCircleIcon, CameraIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreviewUrl: string | null;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreviewUrl, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
  
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("Could not access the camera. Please check your browser permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onImageUpload(file);
        }
        stopCamera();
      }, 'image/jpeg', 0.95);
    } else {
      stopCamera();
    }
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

  if (cameraActive) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="relative bg-black rounded-xl overflow-hidden shadow-lg border-4 border-gray-200">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
        </div>
        <div className="mt-6 flex justify-center items-center gap-4">
           <button
            onClick={stopCamera}
            className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            className="inline-flex items-center justify-center p-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all duration-300 transform hover:scale-110 shadow-lg ring-4 ring-red-300 ring-opacity-50"
            aria-label="Capture photo"
          >
            <CameraIcon className="w-8 h-8" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="w-full border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 transition-all duration-300 bg-gray-50"
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
          <h3 className="text-xl font-semibold text-gray-700">Drag & Drop or Click to Upload</h3>
          <p className="mt-1 text-sm">PNG, JPG, or WEBP. (Your photo is private and not stored)</p>
        </div>
      </div>

      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <div className="text-center">
        <button
          onClick={startCamera}
          className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <CameraIcon className="w-6 h-6 mr-3" />
          Take a Photo
        </button>
        {cameraError && <p className="text-red-500 text-sm mt-4">{cameraError}</p>}
      </div>
    </div>
  );
};

export default ImageUploader;