import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, StopCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { InfoOverlay } from './components/InfoOverlay';
import { ImageState, ProcessingStats, ProcessorSettings } from './types';
import { loadImage, compressPass, yieldToMain } from './utils/compression';

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 1) return "< 1s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    name: '',
    width: 0,
    height: 0,
    currentIterations: 0,
    currentQuality: 0.5,
  });

  const [settings, setSettings] = useState<ProcessorSettings>({
    iterations: 20,
    quality: 0.5,
  });

  const [stats, setStats] = useState<ProcessingStats>({
    targetIterations: 0,
    isProcessing: false,
    timeElapsed: 0,
    eta: 0,
  });

  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');

  // Used to cancel stale jobs
  const processingIdRef = useRef<number>(0);
  // Used to prevent auto-start on initial load or empty state
  const isInitializedRef = useRef<boolean>(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const src = event.target.result as string;
          const img = new Image();
          img.onload = () => {
             setImageState({
                original: src,
                processed: src, // Start with original
                name: file.name,
                width: img.width,
                height: img.height,
                currentIterations: 0,
                currentQuality: settings.quality,
              });
             isInitializedRef.current = true;
          }
          img.src = src;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Processing Effect
  useEffect(() => {
    if (!imageState.original) return;
    if (!isInitializedRef.current) return;

    // Debounce slightly to prevent thrashing on rapid slider movements
    const timeoutId = setTimeout(() => {
        processImage();
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, imageState.original]);


  const processImage = async () => {
      // 1. Setup Job ID
      const jobId = Date.now();
      processingIdRef.current = jobId;

      setStats(prev => ({
          ...prev,
          targetIterations: settings.iterations,
          isProcessing: true,
          eta: 0,
      }));

      const startTime = performance.now();
      
      // 2. Determine Start State
      // We can resume IF:
      // - The quality hasn't changed
      // - The processed image exists
      // - We need MORE iterations than we currently have
      let currentSrc: string;
      let startIteration: number;

      // Check if we need to reset due to quality change or going backwards
      if (
          imageState.currentQuality !== settings.quality || 
          imageState.currentIterations > settings.iterations
      ) {
          currentSrc = imageState.original!;
          startIteration = 0;
      } else {
          // Resume from current
          currentSrc = imageState.processed || imageState.original!;
          startIteration = imageState.currentIterations;
      }

      // If we are already at target, just stop
      if (startIteration === settings.iterations) {
          setStats(prev => ({ ...prev, isProcessing: false, eta: 0 }));
          return;
      }

      try {
          let imgElement = await loadImage(currentSrc);
          
          // 3. Processing Loop
          for (let i = startIteration; i < settings.iterations; i++) {
              // Check cancellation
              if (processingIdRef.current !== jobId) {
                  return; // Stop silently, new job started
              }

              // Compress
              const compressedDataUrl = compressPass(imgElement, settings.quality);
              currentSrc = compressedDataUrl;
              imgElement = await loadImage(currentSrc);

              // Update State periodically to show progress (Live Preview)
              // Update every frame for first 10, then every 2, etc to save UI overhead
              const shouldUpdateUI = 
                 (i < 10) || 
                 (i < 50 && i % 2 === 0) || 
                 (i % 5 === 0) || 
                 (i === settings.iterations - 1);

              if (shouldUpdateUI) {
                  // Calculate ETA
                  const currentTime = performance.now();
                  const elapsed = currentTime - startTime;
                  const iterationsDoneInThisJob = i - startIteration + 1;
                  const avgTimePerIter = elapsed / iterationsDoneInThisJob;
                  const remainingIters = settings.iterations - (i + 1);
                  const eta = remainingIters * avgTimePerIter;

                  setImageState(prev => ({
                      ...prev,
                      processed: currentSrc,
                      currentIterations: i + 1,
                      currentQuality: settings.quality
                  }));
                  
                  setStats(prev => ({
                      ...prev,
                      timeElapsed: elapsed,
                      eta: eta
                  }));
                  
                  // Yield to allow React to render the new frame
                  await yieldToMain();
              }
          }
      } catch (error) {
          console.error("Processing error:", error);
      } finally {
          if (processingIdRef.current === jobId) {
              setStats(prev => ({ ...prev, isProcessing: false, eta: 0 }));
          }
      }
  };

  const handleStop = () => {
    // Just cancel the current job ID
    processingIdRef.current = 0;
    setStats(prev => ({ ...prev, isProcessing: false, eta: 0 }));
  };

  const handleReset = () => {
      if (!imageState.original) return;
      handleStop();
      setSettings(prev => ({ ...prev, iterations: 0 })); // This will trigger effect -> 0 iters -> show original
      setImageState(prev => ({
          ...prev,
          processed: prev.original,
          currentIterations: 0
      }));
  }

  const handleClear = () => {
      handleStop();
      setImageState({
        original: null,
        processed: null,
        name: '',
        width: 0,
        height: 0,
        currentIterations: 0,
        currentQuality: 0.5
      });
      setStats({
        targetIterations: 0,
        isProcessing: false,
        timeElapsed: 0,
        eta: 0
      });
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  }
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
           const file = e.dataTransfer.files[0];
           if (!file.type.startsWith('image/')) return;
           
           const reader = new FileReader();
           reader.onload = (event) => {
             if (event.target?.result) {
                 const src = event.target.result as string;
                 const img = new Image();
                 img.onload = () => {
                     setImageState({
                         original: src,
                         processed: src,
                         name: file.name,
                         width: img.width,
                         height: img.height,
                         currentIterations: 0,
                         currentQuality: settings.quality,
                     });
                     isInitializedRef.current = true;
                     setSettings(prev => ({...prev})); // Trigger processing
                 }
                 img.src = src;
             }
           }
           reader.readAsDataURL(file);
      }
  }

  return (
    <div 
        className="flex h-screen bg-gray-950 text-white overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      {/* Left Sidebar */}
      {sidebarPosition === 'left' && (
          <Controls 
            settings={settings} 
            onUpdate={setSettings} 
            disabled={false} 
            position="left"
            onToggleLayout={() => setSidebarPosition('right')}
            onFileSelect={handleFileSelect}
          />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold font-mono text-xl shadow-lg shadow-indigo-500/20">
                JP
                </div>
                <h1 className="font-bold text-lg tracking-tight">JPEG<span className="text-indigo-400">ifier</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {imageState.original && (
                <div className="flex items-center gap-3">
                    {stats.isProcessing && (
                         <div className="flex items-center gap-2 text-indigo-400 animate-pulse mr-2">
                             <RefreshCw className="w-4 h-4 animate-spin" />
                             <span className="text-xs font-mono">PROCESSING</span>
                         </div>
                    )}
                    
                    {stats.isProcessing ? (
                         <button 
                            onClick={handleStop}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                        >
                            <StopCircle className="w-4 h-4" />
                            Stop
                        </button>
                    ) : (
                        <div className="text-xs text-gray-500 font-mono">
                            Ready
                        </div>
                    )}
                </div>
             )}
          </div>
        </header>

        {/* Progress Bar (Sticky) */}
        <div className="h-1 w-full bg-gray-800 absolute top-16 left-0 z-30">
            {stats.targetIterations > 0 && (
                <div 
                    className={`h-full transition-all duration-300 ${stats.isProcessing ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-green-500'}`}
                    style={{ width: `${(imageState.currentIterations / Math.max(stats.targetIterations, 1)) * 100}%` }}
                ></div>
            )}
        </div>

        <div className="flex-1 overflow-hidden relative">
            <Preview 
                imageState={imageState} 
                onClear={handleClear}
                isProcessing={stats.isProcessing}
            />
            <InfoOverlay />
            
            {/* Stats Overlay */}
            {imageState.currentIterations > 0 && (
                <div className="absolute top-6 right-6 pointer-events-none z-10">
                    <div className="bg-black/70 backdrop-blur-md text-white p-4 rounded-xl border border-gray-800 shadow-2xl space-y-2 min-w-[200px]">
                         <div className="flex justify-between items-end">
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Passes</span>
                            <span className="text-2xl font-mono text-indigo-400 font-bold leading-none">
                                {imageState.currentIterations}
                                <span className="text-sm text-gray-600">/{settings.iterations}</span>
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
                             <span>Quality</span>
                             <span className="font-mono text-gray-200">{(settings.quality * 100).toFixed(0)}%</span>
                         </div>
                         
                         {stats.isProcessing && stats.eta !== undefined && stats.eta > 0 && (
                             <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
                                 <span>Est. Time</span>
                                 <span className="font-mono text-indigo-300 animate-pulse">{formatDuration(stats.eta)}</span>
                             </div>
                         )}
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* Right Sidebar */}
      {sidebarPosition === 'right' && (
          <Controls 
            settings={settings} 
            onUpdate={setSettings} 
            disabled={false} 
            position="right"
            onToggleLayout={() => setSidebarPosition('left')}
            onFileSelect={handleFileSelect}
          />
      )}
    </div>
  );
};

export default App;