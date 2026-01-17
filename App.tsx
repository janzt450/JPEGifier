import React, { useState, useRef, useEffect } from 'react';
import { StopCircle, RefreshCw, AlertCircle, Clock, Play } from 'lucide-react';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { InfoOverlay } from './components/InfoOverlay';
import { BatchItem, ProcessingStats, ProcessorSettings } from './types';
import { loadImage, compressPass, yieldToMain } from './utils/compression';

const MAX_BATCH_SIZE = 10;

const App: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [uiSettings, setUiSettings] = useState<ProcessorSettings>({
    iterations: 20,
    quality: 0.5,
  });

  const [stats, setStats] = useState<ProcessingStats>({
    totalItems: 0,
    completedItems: 0,
    targetIterations: 0,
    isProcessing: false,
    timeElapsed: 0,
    eta: 0,
  });

  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processingIdRef = useRef<number>(0);
  const batchStartTimeRef = useRef<number>(0);
  
  const generateId = () => Math.random().toString(36).substr(2, 9);

  /**
   * Main logic for handling incoming files (from input or drop)
   */
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = items.length;
    
    // 1. Filter for images
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
    const nonImageCount = fileArray.length - imageFiles.length;

    if (imageFiles.length === 0 && nonImageCount > 0) {
      showError("Please upload image files only (JPG, PNG, WebP, etc.)");
      return;
    }

    // 2. Check batch limits
    let filesToProcess = imageFiles;
    let limitExceeded = false;
    
    if (currentCount + imageFiles.length > MAX_BATCH_SIZE) {
      const allowedCount = MAX_BATCH_SIZE - currentCount;
      if (allowedCount <= 0) {
        showError(`Maximum batch size of ${MAX_BATCH_SIZE} reached. Clear items to add more.`);
        return;
      }
      filesToProcess = imageFiles.slice(0, allowedCount);
      limitExceeded = true;
    }

    // 3. Show composite non-obtrusive warning if needed
    if (nonImageCount > 0 || limitExceeded) {
      let msg = "";
      if (nonImageCount > 0) msg += `Skipped ${nonImageCount} non-image file(s). `;
      if (limitExceeded) msg += `Only ${filesToProcess.length} images added due to ${MAX_BATCH_SIZE} file limit.`;
      showError(msg);
    }

    // 4. Load and convert to BatchItems
    const newItems: BatchItem[] = [];
    let loadedCount = 0;

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const src = event.target.result as string;
          const img = new Image();
          img.onload = () => {
            newItems.push({
              id: generateId(),
              original: src,
              processed: src,
              name: file.name,
              width: img.width,
              height: img.height,
              currentIterations: 0,
              currentQuality: 0,
              targetIterations: uiSettings.iterations,
              targetQuality: uiSettings.quality,
              status: 'pending',
              isSelected: true
            });
            loadedCount++;
            
            if (loadedCount === filesToProcess.length) {
              setItems(prev => {
                 const combined = [...prev, ...newItems];
                 if (!activeId && combined.length > 0) {
                     setActiveId(combined[0].id);
                     setSelectionAnchorId(combined[0].id);
                 }
                 return combined;
              });
            }
          }
          img.src = src;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only activate drag state if dragging actual files from OS
    if (e.dataTransfer.types.includes('Files')) {
        setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSelect = (id: string, isShift: boolean = false, isCtrl: boolean = false) => {
    setActiveId(id);

    if (isShift && selectionAnchorId) {
      const startIndex = items.findIndex(i => i.id === selectionAnchorId);
      const endIndex = items.findIndex(i => i.id === id);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const low = Math.min(startIndex, endIndex);
        const high = Math.max(startIndex, endIndex);
        
        setItems(prev => prev.map((item, idx) => ({
          ...item,
          isSelected: (idx >= low && idx <= high)
        })));
      }
    } else if (isCtrl) {
      setSelectionAnchorId(id);
      toggleSelection(id);
    } else {
      setSelectionAnchorId(id);
      setItems(prev => prev.map(item => ({
        ...item,
        isSelected: item.id === id
      })));
    }
  };

  const toggleSelection = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    ));
    setSelectionAnchorId(id);
  };

  const setSelection = (id: string, isSelected: boolean) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isSelected } : item
    ));
    setSelectionAnchorId(id);
  };
  
  const handleRangeSelection = (endId: string, isSelected: boolean) => {
    const anchorId = selectionAnchorId || activeId;
    if (!anchorId) return;

    const startIndex = items.findIndex(i => i.id === anchorId);
    const endIndex = items.findIndex(i => i.id === endId);
    
    if (startIndex === -1 || endIndex === -1) return;

    const low = Math.min(startIndex, endIndex);
    const high = Math.max(startIndex, endIndex);

    setItems(prev => prev.map((item, idx) => {
        if (idx >= low && idx <= high) {
            return { ...item, isSelected };
        }
        return item;
    }));
  };

  const selectAll = () => {
    setItems(prev => prev.map(item => ({ ...item, isSelected: true })));
  };

  const deselectAll = () => {
    setItems(prev => prev.map(item => ({ ...item, isSelected: false })));
  };

  const handleRemoveItem = (id: string) => {
    if (activeId === id) {
        const idx = items.findIndex(i => i.id === id);
        const nextItem = items[idx + 1] || items[idx - 1];
        setActiveId(nextItem ? nextItem.id : null);
        setSelectionAnchorId(nextItem ? nextItem.id : null);
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleReorderItems = (dragIndex: number, hoverIndex: number) => {
      setItems(prevItems => {
          const newItems = [...prevItems];
          const [removed] = newItems.splice(dragIndex, 1);
          newItems.splice(hoverIndex, 0, removed);
          return newItems;
      });
  };

  const handleSettingsChange = (newSettings: ProcessorSettings) => {
    setUiSettings(newSettings);
    setItems(prev => prev.map(item => {
      if (item.isSelected) {
        const needsUpdate = item.currentIterations !== newSettings.iterations || item.currentQuality !== newSettings.quality;
        return {
          ...item,
          targetIterations: newSettings.iterations,
          targetQuality: newSettings.quality,
          status: needsUpdate ? 'pending' : 'done' 
        };
      }
      return item;
    }));
  };

  const startProcessing = () => {
    const pendingItems = items.filter(i => 
      i.status === 'pending' || 
      (i.currentIterations < i.targetIterations) || 
      (i.currentQuality !== i.targetQuality)
    );

    if (pendingItems.length === 0) return;

    setItems(prev => prev.map(item => {
      const needsProc = item.status === 'pending' || 
                       item.currentIterations < item.targetIterations || 
                       item.currentQuality !== item.targetQuality;
      return needsProc ? { ...item, status: 'pending' } : item;
    }));

    processingIdRef.current = Date.now();
    batchStartTimeRef.current = performance.now();
    
    setStats({
        totalItems: pendingItems.length,
        completedItems: 0,
        targetIterations: 0, 
        isProcessing: true,
        timeElapsed: 0,
        eta: 0
    });
  };

  useEffect(() => {
      const processNextItem = async () => {
          if (!stats.isProcessing) return;
          const isAnyProcessing = items.some(i => i.status === 'processing');
          if (isAnyProcessing) return;

          const pendingIndex = items.findIndex(i => i.status === 'pending');
          if (pendingIndex === -1) {
              setStats(prev => ({ ...prev, isProcessing: false, eta: 0 }));
              return;
          }

          const item = items[pendingIndex];
          const jobId = processingIdRef.current;

          setItems(prev => {
              const next = [...prev];
              next[pendingIndex] = { ...next[pendingIndex], status: 'processing' };
              return next;
          });
          
          let currentSrc: string;
          let startIteration: number;
          const qualityChanged = item.currentQuality !== item.targetQuality;
          const reducingIterations = item.currentIterations > item.targetIterations;

          if (qualityChanged || reducingIterations) {
               currentSrc = item.original;
               startIteration = 0;
          } else {
               currentSrc = item.processed || item.original;
               startIteration = item.currentIterations;
          }

          try {
               let imgElement = await loadImage(currentSrc);
               for (let i = startIteration; i < item.targetIterations; i++) {
                   if (processingIdRef.current !== jobId) return; 
                   const compressedDataUrl = compressPass(imgElement, item.targetQuality);
                   currentSrc = compressedDataUrl;
                   imgElement = await loadImage(currentSrc);

                   const shouldUpdateUI = (i < 5) || (i < 20 && i % 2 === 0) || (i % 10 === 0) || (i === item.targetIterations - 1);
                   if (shouldUpdateUI) {
                       setItems(prev => {
                           const next = [...prev];
                           if (next[pendingIndex] && next[pendingIndex].id === item.id) {
                               next[pendingIndex] = { ...next[pendingIndex], processed: currentSrc, currentIterations: i + 1, currentQuality: item.targetQuality };
                           }
                           return next;
                       });
                       await yieldToMain();
                   }
               }
               setItems(prev => {
                  const next = [...prev];
                  if (next[pendingIndex] && next[pendingIndex].id === item.id) {
                      next[pendingIndex] = { ...next[pendingIndex], status: 'done', processed: currentSrc, currentIterations: item.targetIterations };
                  }
                  return next;
               });
               setStats(prev => ({ ...prev, completedItems: prev.completedItems + 1 }));
          } catch (err) {
               console.error(err);
               setItems(prev => {
                   const next = [...prev];
                   if (next[pendingIndex]) next[pendingIndex].status = 'pending';
                   return next;
               });
               setStats(prev => ({ ...prev, isProcessing: false }));
          }
      };
      if (stats.isProcessing) processNextItem();
  }, [stats.isProcessing, items]);

  const handleStop = () => {
    processingIdRef.current = 0;
    setStats(prev => ({ ...prev, isProcessing: false, eta: 0 }));
    setItems(prev => prev.map(i => i.status === 'processing' ? { ...i, status: 'pending' } : i));
  };

  const handleClear = () => {
      handleStop();
      setItems([]);
      setActiveId(null);
      setSelectionAnchorId(null);
      setStats({ totalItems: 0, completedItems: 0, targetIterations: 0, isProcessing: false, timeElapsed: 0, eta: 0 });
  };

  const formatTime = (ms: number) => {
      if (ms < 1000) return "< 1s";
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
  };
  
  const activeItem = items.find(i => i.id === activeId);
  const selectedCount = items.filter(i => i.isSelected).length;

  return (
    <div 
        className={`flex h-screen bg-gray-950 text-white overflow-hidden transition-colors duration-300 ${isDragActive ? 'bg-indigo-950/20' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {/* Error Toast */}
      {errorMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 backdrop-blur-md border border-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 text-red-200" />
              <div className="flex flex-col">
                  <span className="font-bold text-sm">Action Notice</span>
                  <span className="text-xs text-red-100">{errorMsg}</span>
              </div>
          </div>
      )}

      {/* Drag Overlay State */}
      {isDragActive && (
          <div className="fixed inset-0 z-40 bg-indigo-600/10 backdrop-blur-sm pointer-events-none flex items-center justify-center border-4 border-dashed border-indigo-500/50 m-4 rounded-3xl animate-in fade-in zoom-in-95">
              <div className="bg-gray-900/90 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-indigo-500/30">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center animate-bounce">
                      <Play className="w-8 h-8 rotate-90 text-white" />
                  </div>
                  <p className="text-xl font-bold text-white tracking-tight">Drop images to JPEGify</p>
              </div>
          </div>
      )}

      {sidebarPosition === 'left' && (
          <Controls 
            settings={uiSettings} 
            onUpdate={handleSettingsChange} 
            disabled={stats.isProcessing} 
            position="left" 
            onToggleLayout={() => setSidebarPosition('right')} 
            onFileSelect={handleFileSelect} 
            fileCount={items.length} 
            selectedCount={selectedCount} 
            onSelectAll={selectAll} 
            onDeselectAll={deselectAll} 
            onProcess={startProcessing} 
          />
      )}

      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold font-mono text-xl shadow-lg shadow-indigo-500/20">JP</div>
                <h1 className="font-bold text-lg tracking-tight">JPEG<span className="text-indigo-400">ifier</span></h1>
            </div>
            <div className="hidden lg:flex items-center gap-6">
                <div className="h-6 w-px bg-gray-800"></div>
                <p className="text-xs text-gray-500 font-medium max-w-sm leading-relaxed">Drop anywhere to upload. Re-encode images to simulate digital decay.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {items.length > 0 && (
                <div className="flex items-center gap-4">
                    {stats.isProcessing && (
                         <div className="flex flex-col items-end mr-2">
                             <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                                 <RefreshCw className="w-3 h-3 animate-spin" />
                                 <span className="text-xs font-mono font-bold">PROCESSING ({stats.completedItems}/{stats.totalItems})</span>
                             </div>
                             {(stats.eta || 0) > 0 && <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Clock className="w-3 h-3" />ETA: {formatTime(stats.eta || 0)}</div>}
                         </div>
                    )}
                    {stats.isProcessing ? (
                         <button onClick={handleStop} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"><StopCircle className="w-4 h-4" />Stop</button>
                    ) : (
                        <div className="text-xs text-gray-500 font-mono">{items.some(i => i.status === 'pending') ? 'Changes Pending' : 'Ready'}</div>
                    )}
                </div>
             )}
          </div>
        </header>

        <div className="h-1 w-full bg-gray-800 absolute top-16 left-0 z-30">
            {stats.totalItems > 0 && <div className={`h-full transition-all duration-300 ${stats.isProcessing ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-green-500'}`} style={{ width: `${(stats.completedItems / Math.max(stats.totalItems, 1)) * 100}%` }}></div>}
        </div>

        <div className="flex-1 overflow-hidden relative">
            <Preview items={items} activeId={activeId} onSelect={handleSelect} onToggleSelection={toggleSelection} onSetSelection={setSelection} onRangeSelect={handleRangeSelection} onClear={handleClear} onRemoveItem={handleRemoveItem} onReorderItems={handleReorderItems} isProcessing={stats.isProcessing} />
            <InfoOverlay />
            {activeItem && activeItem.currentIterations > 0 && (
                <div className="absolute top-6 right-6 pointer-events-none z-10">
                    <div className="bg-black/70 backdrop-blur-md text-white p-4 rounded-xl border border-gray-800 shadow-2xl space-y-2 min-w-[200px]">
                         <div className="flex justify-between items-end"><span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Passes</span><span className="text-2xl font-mono text-indigo-400 font-bold leading-none">{activeItem.currentIterations}<span className="text-sm text-gray-600">/{activeItem.targetIterations}</span></span></div>
                         <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2"><span>Quality</span><span className="font-mono text-gray-200">{(activeItem.targetQuality * 100).toFixed(0)}%</span></div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {sidebarPosition === 'right' && (
          <Controls 
            settings={uiSettings} 
            onUpdate={handleSettingsChange} 
            disabled={stats.isProcessing} 
            position="right" 
            onToggleLayout={() => setSidebarPosition('left')} 
            onFileSelect={handleFileSelect} 
            fileCount={items.length} 
            selectedCount={selectedCount} 
            onSelectAll={selectAll} 
            onDeselectAll={deselectAll} 
            onProcess={startProcessing} 
          />
      )}
    </div>
  );
};

export default App;