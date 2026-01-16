import React, { useState } from 'react';
import { Eye, Download, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ImageState } from '../types';

interface PreviewProps {
  imageState: ImageState;
  onClear: () => void;
  isProcessing: boolean;
}

export const Preview: React.FC<PreviewProps> = ({ imageState, onClear, isProcessing }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!imageState.original) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl m-8 bg-gray-900/50">
        <div className="w-20 h-20 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-gray-600" />
        </div>
        <p className="text-lg font-medium">No Image Selected</p>
        <p className="text-sm opacity-60">Upload an image to start jpegifying artifacts</p>
      </div>
    );
  }

  const handleDownload = () => {
    if (!imageState.processed) return;
    const link = document.createElement('a');
    link.href = imageState.processed;
    link.download = `jpegified_${imageState.name.replace(/\.[^/.]+$/, "")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeImage = showOriginal ? imageState.original : (imageState.processed || imageState.original);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-950">
      
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-gray-900/90 backdrop-blur-md px-6 py-2 rounded-full shadow-2xl border border-gray-800">
        <button
          onMouseDown={() => setShowOriginal(true)}
          onMouseUp={() => setShowOriginal(false)}
          onMouseLeave={() => setShowOriginal(false)}
          onTouchStart={() => setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors select-none active:scale-95"
          title="Hold to see original"
        >
          <Eye className={`w-4 h-4 ${showOriginal ? 'text-indigo-400' : ''}`} />
          {showOriginal ? 'Showing Original' : 'Hold to Compare'}
        </button>
        
        <div className="w-px h-4 bg-gray-700"></div>

        <button
          onClick={handleDownload}
          disabled={!imageState.processed || isProcessing}
          className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Download
        </button>

         <div className="w-px h-4 bg-gray-700"></div>

        <button
          onClick={onClear}
          disabled={isProcessing}
          className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="relative shadow-2xl group max-w-full max-h-full">
           <img
            src={activeImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg border border-gray-800 bg-gray-900"
            style={{ imageRendering: 'pixelated' }} 
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="animate-pulse text-indigo-400 font-mono font-bold tracking-widest">
                    RENDERING...
                </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur px-3 py-1 rounded border border-gray-800 text-xs text-gray-500 font-mono">
        {imageState.width} x {imageState.height}px
      </div>
    </div>
  );
};