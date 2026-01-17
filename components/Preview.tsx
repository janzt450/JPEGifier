import React, { useState, useEffect } from 'react';
import { Eye, Download, Image as ImageIcon, Trash2, CheckCircle, Loader, CheckSquare, Square } from 'lucide-react';
import { BatchItem } from '../types';

interface PreviewProps {
  items: BatchItem[];
  activeId: string | null;
  onSelect: (id: string, isShift: boolean, isCtrl: boolean) => void;
  onToggleSelection: (id: string) => void;
  onSetSelection: (id: string, isSelected: boolean) => void;
  onRangeSelect: (endId: string, isSelected: boolean) => void;
  onClear: () => void;
  onRemoveItem: (id: string) => void;
  onReorderItems: (dragIndex: number, hoverIndex: number) => void;
  isProcessing: boolean;
}

export const Preview: React.FC<PreviewProps> = ({ 
    items, 
    activeId, 
    onSelect, 
    onToggleSelection,
    onSetSelection,
    onRangeSelect,
    onClear, 
    onRemoveItem,
    onReorderItems,
    isProcessing 
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [paintTargetValue, setPaintTargetValue] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);

  const activeItem = items.find(i => i.id === activeId);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPainting(false);
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
        window.removeEventListener('click', handleClick);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!activeId || items.length === 0) return;
        if (['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement).tagName)) return;
        const currentIndex = items.findIndex(i => i.id === activeId);
        if (e.key === 'ArrowRight') {
            const next = items[currentIndex + 1];
            if (next) onSelect(next.id, false, false);
        } else if (e.key === 'ArrowLeft') {
            const prev = items[currentIndex - 1];
            if (prev) onSelect(prev.id, false, false);
        } else if (e.key === ' ') {
            e.preventDefault();
            onToggleSelection(activeId);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!isProcessing) onRemoveItem(activeId);
        } else if (e.key === 'Escape') {
            setDeleteMode(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeId, items, onSelect, onToggleSelection, onRemoveItem, isProcessing]);

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, itemId });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedItemId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id); 
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move';
      if (draggedItemId) setDragOverIndex(index);
  };

  const handleDropOnItem = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId) return;
      const currentIndex = items.findIndex(i => i.id === draggedId);
      if (currentIndex !== -1 && currentIndex !== targetIndex) {
          onReorderItems(currentIndex, targetIndex);
      }
      setDraggedItemId(null);
  };

  const handleDragEnd = () => {
      setDraggedItemId(null);
      setDragOverIndex(null);
      setIsDragOverTrash(false);
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOverTrash(true);
  };

  const handleTrashDragLeave = () => setIsDragOverTrash(false);
  const handleTrashDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverTrash(false);
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId) onRemoveItem(draggedId);
  };

  const handlePaintStart = (e: React.MouseEvent, id: string, currentSelected: boolean) => {
      e.stopPropagation(); 
      setIsPainting(true);
      const targetVal = !currentSelected;
      setPaintTargetValue(targetVal);
      onSetSelection(id, targetVal);
  };

  const handlePaintEnter = (id: string) => {
      if (isPainting) onSetSelection(id, paintTargetValue);
  };

  const handleItemClick = (e: React.MouseEvent, id: string) => {
      if (deleteMode) {
          onRemoveItem(id);
          if (items.length <= 1) setDeleteMode(false); 
      } else {
          onSelect(id, e.shiftKey, e.metaKey || e.ctrlKey);
      }
  };

  if (!activeItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl m-8 bg-gray-900/50">
        <div className="w-20 h-20 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-gray-600" />
        </div>
        <p className="text-lg font-medium">No Images Selected</p>
        <p className="text-sm opacity-60">Upload images to start jpegifying artifacts (Max 10)</p>
      </div>
    );
  }

  const handleDownload = (item: BatchItem = activeItem) => {
    if (!item.processed) return;
    const link = document.createElement('a');
    link.href = item.processed;
    link.download = `jpegified_${item.name.replace(/\.[^/.]+$/, "")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentImageSrc = showOriginal ? activeItem.original : (activeItem.processed || activeItem.original);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-950">
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-gray-900/90 backdrop-blur-md px-6 py-2 rounded-full shadow-2xl border border-gray-800">
        <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} onMouseLeave={() => setShowOriginal(false)} onTouchStart={() => setShowOriginal(true)} onTouchEnd={() => setShowOriginal(false)} className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors select-none active:scale-95" title="Hold to see original">
          <Eye className={`w-4 h-4 ${showOriginal ? 'text-indigo-400' : ''}`} />
          {showOriginal ? 'Showing Original' : 'Hold to Compare'}
        </button>
        <div className="w-px h-4 bg-gray-700"></div>
        <button onClick={() => handleDownload()} disabled={!activeItem.processed || isProcessing && activeItem.status === 'processing'} className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Download className="w-4 h-4" />
          Download
        </button>
         <div className="w-px h-4 bg-gray-700"></div>
        <button onClick={onClear} disabled={isProcessing} className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-auto pb-48">
        <div className="relative shadow-2xl group max-w-full max-h-full">
           <img src={currentImageSrc} alt="Preview" className="max-w-full max-h-[calc(100vh-250px)] object-contain rounded-lg border border-gray-800 bg-gray-900" style={{ imageRendering: 'pixelated' }} />
          {activeItem.status === 'processing' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="animate-pulse text-indigo-400 font-mono font-bold tracking-widest flex items-center gap-2"><Loader className="w-5 h-5 animate-spin" />RENDERING...</div>
            </div>
          )}
          {!activeItem.isSelected && (
              <button onClick={() => onToggleSelection(activeItem.id)} className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs border border-gray-600 hover:border-indigo-400 flex items-center gap-2">
                  <Square className="w-4 h-4" /> Select for Processing
              </button>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-20 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 p-4 z-30 flex flex-col gap-2 transition-all">
         <div className="flex justify-between items-center px-2">
            <span className="text-xs text-gray-500 font-mono">{activeItem.name} • {activeItem.width} x {activeItem.height}px</span>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                     <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3 text-indigo-500" /> Selected</span>
                     <span className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-white rounded-sm"></div> Viewing</span>
                     <div className="h-4 w-px bg-gray-700 mx-1"></div>
                     <button onClick={() => setDeleteMode(!deleteMode)} onDragOver={handleTrashDragOver} onDragLeave={handleTrashDragLeave} onDrop={handleTrashDrop} className={`flex items-center justify-center w-6 h-6 rounded border transition-all duration-200 ${deleteMode ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' : isDragOverTrash ? 'bg-red-500/40 border-red-400 text-white scale-125' : 'border-gray-700 text-gray-500 hover:border-red-500 hover:text-red-500'}`} title={deleteMode ? "Exit Delete Mode" : "Drag item here to delete, or click to toggle Delete Mode"}><Trash2 className="w-3 h-3" /></button>
                 </div>
                 <span className="text-xs text-gray-500">{items.length} file{items.length !== 1 && 's'}</span>
            </div>
         </div>
         
         <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-2 items-center min-h-[90px]">
             {items.map((item, index) => {
                 const isActive = activeId === item.id;
                 const isSelected = item.isSelected;
                 const isDraggingThis = draggedItemId === item.id;
                 const isDragOverThis = dragOverIndex === index && !isDraggingThis;

                 return (
                    <div key={item.id} className={`relative group flex-shrink-0 transition-transform duration-200 ${isDraggingThis ? 'opacity-30 scale-90' : ''} ${isDragOverThis ? 'translate-x-4' : ''}`} onContextMenu={(e) => handleContextMenu(e, item.id)} draggable={!isProcessing} onDragStart={(e) => handleDragStart(e, item.id)} onDragOver={(e) => handleDragOverItem(e, index)} onDragEnd={handleDragEnd} onDrop={(e) => handleDropOnItem(e, index)}>
                        {isDragOverThis && <div className="absolute -left-3 top-0 bottom-0 w-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] z-40 pointer-events-none"></div>}
                        <button onMouseDown={(e) => {
                                if (e.shiftKey && activeId) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onRangeSelect(item.id, !isSelected);
                                } else {
                                    handlePaintStart(e, item.id, isSelected);
                                }
                            }} onMouseEnter={() => handlePaintEnter(item.id)} className={`absolute top-1 left-1 z-30 transition-all cursor-crosshair ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
                            {isSelected ? <div className="bg-indigo-600 rounded text-white shadow-md p-0.5"><CheckSquare className="w-4 h-4" /></div> : <div className="bg-black/40 backdrop-blur-sm rounded text-gray-300 hover:text-white hover:bg-black/60 shadow-md p-0.5"><Square className="w-4 h-4" /></div>}
                        </button>
                        <button onClick={(e) => handleItemClick(e, item.id)} className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 ease-out ${deleteMode ? 'border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 cursor-alias' : isActive ? 'border-2 border-white ring-2 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)] z-20 scale-110' : isSelected ? 'border-2 border-indigo-500/50 hover:border-indigo-400 z-10' : 'border border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100 grayscale-[0.5] hover:grayscale-0'}`}>
                            <img src={item.processed || item.original} className="w-full h-full object-cover pointer-events-none" alt="" />
                            {isSelected && !isActive && !deleteMode && <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none"></div>}
                            {deleteMode && <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center opacity-0 hover:opacity-100"><Trash2 className="w-6 h-6 text-red-500 drop-shadow-md" /></div>}
                            <div className="absolute top-1 right-1 z-10">
                                {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500 bg-gray-900 rounded-full" />}
                                {item.status === 'processing' && <Loader className="w-4 h-4 text-indigo-500 animate-spin bg-gray-900 rounded-full" />}
                                {item.status !== 'processing' && (item.currentIterations < item.targetIterations || item.currentQuality !== item.targetQuality) && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-lg ring-1 ring-black"></div>}
                            </div>
                            {item.status === 'processing' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800"><div className="h-full bg-indigo-500" style={{ width: '100%' }}></div></div>}
                        </button>
                    </div>
                 );
             })}
         </div>
      </div>

      {contextMenu && (
          (() => {
            const menuHeight = 180; 
            const topPos = (contextMenu.y + menuHeight > window.innerHeight) ? contextMenu.y - menuHeight : contextMenu.y;
            const targetItem = items.find(i => i.id === contextMenu.itemId);
            if (!targetItem) return null;
            return (
              <div className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 w-48 animate-in fade-in zoom-in-95 duration-100 origin-top-left" style={{ top: topPos, left: contextMenu.x }}>
                <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 font-mono truncate">{targetItem.name}</div>
                <button onClick={() => onSelect(targetItem.id, false, false)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"><Eye className="w-4 h-4" /> View</button>
                <button onClick={() => onToggleSelection(targetItem.id)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2">{targetItem.isSelected ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}{targetItem.isSelected ? 'Deselect' : 'Select'}</button>
                <button onClick={() => handleDownload(targetItem)} disabled={!targetItem.processed} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 disabled:opacity-50"><Download className="w-4 h-4" /> Download</button>
                <div className="h-px bg-gray-800 my-1"></div>
                <button onClick={() => onRemoveItem(targetItem.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Remove</button>
              </div>
            );
          })()
      )}
    </div>
  );
};