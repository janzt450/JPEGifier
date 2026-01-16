import React, { useState } from 'react';
import { Settings, Zap, Repeat, Dices, PanelLeft, PanelRight, Upload, BookOpen, Calculator, X, History as HistoryIcon, Scale } from 'lucide-react';
import { ProcessorSettings } from '../types';

interface ControlsProps {
  settings: ProcessorSettings;
  onUpdate: (newSettings: ProcessorSettings) => void;
  disabled: boolean;
  position: 'left' | 'right';
  onToggleLayout: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Controls: React.FC<ControlsProps> = ({ settings, onUpdate, disabled, position, onToggleLayout, onFileSelect }) => {
  const [showEducation, setShowEducation] = useState(false);

  const handleQualitySlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...settings, quality: parseFloat(e.target.value) });
  };

  const handleIterationsSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...settings, iterations: parseInt(e.target.value, 10) });
  };

  const handleQualityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val > 100) val = 100;
    if (val < 1) val = 1;
    onUpdate({ ...settings, quality: val / 100 });
  };

  const handleIterationsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val < 1) val = 1;
    if (val > 1000) val = 1000;
    onUpdate({ ...settings, iterations: val });
  };

  const randomizeQuality = () => {
    const randomQ = Math.floor(Math.random() * 95) + 1;
    onUpdate({ ...settings, quality: randomQ / 100 });
  };

  const randomizeIterations = () => {
    const randomI = Math.floor(Math.random() * 195) + 5;
    onUpdate({ ...settings, iterations: randomI });
  };

  const borderClass = position === 'left' ? 'border-r' : 'border-l';
  const Divider = () => <div className="h-px bg-gray-800 my-6 w-full" />;

  return (
    <div className={`bg-gray-900 ${borderClass} border-gray-800 w-full md:w-80 h-full p-6 flex flex-col shadow-xl overflow-y-auto z-10`}>
      
      {/* Header Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          Configuration
        </h2>
        <p className="text-gray-400 text-sm">
          Adjust parameters to see changes in real-time.
        </p>
      </div>

      <Divider />

      {/* Dock Controls */}
      <div>
        <button 
            onClick={onToggleLayout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 px-3 py-2 rounded-lg transition-all"
        >
             {position === 'left' ? <PanelRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
             <span>{position === 'left' ? 'Dock Controls Right' : 'Dock Controls Left'}</span>
        </button>
      </div>

      <Divider />

      {/* Upload Button */}
      <div>
         <label className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 font-medium text-sm group">
             <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
             <span>Upload Image</span>
             <input 
                 type="file" 
                 className="hidden" 
                 accept="image/*"
                 onChange={onFileSelect}
             />
        </label>
      </div>

      <Divider />

      {/* Quality Control */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            JPEG Quality (%)
          </label>
          <div className="flex items-center gap-2">
            <button
                onClick={randomizeQuality}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title="Randomize Quality"
                disabled={disabled}
            >
                <Dices className="w-4 h-4" />
            </button>
            <input 
                type="number"
                min="1"
                max="100"
                value={Math.round(settings.quality * 100)}
                onChange={handleQualityInput}
                disabled={disabled}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right text-sm font-mono focus:outline-none focus:border-indigo-500 text-yellow-500"
            />
          </div>
        </div>
        
        <input
          type="range"
          min="0.01"
          max="1.0"
          step="0.01"
          value={settings.quality}
          onChange={handleQualitySlider}
          disabled={disabled}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
        />
        <p className="text-xs text-gray-500">
          Lower quality introduces more artifacts per pass.
        </p>
      </div>

      <Divider />

      {/* Iterations Control */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-1">
            <Repeat className="w-4 h-4 text-blue-500" />
            Target Iterations
          </label>
           <div className="flex items-center gap-2">
            <button
                onClick={randomizeIterations}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title="Randomize Iterations"
                disabled={disabled}
            >
                <Dices className="w-4 h-4" />
            </button>
            <input 
                type="number"
                min="1"
                max="1000"
                value={settings.iterations}
                onChange={handleIterationsInput}
                disabled={disabled}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right text-sm font-mono focus:outline-none focus:border-indigo-500 text-blue-500"
            />
          </div>
        </div>
        
        <input
          type="range"
          min="1"
          max="500"
          step="1"
          value={settings.iterations}
          onChange={handleIterationsSlider}
          disabled={disabled}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
        />
        
        <div className="flex gap-2 justify-between">
           <button 
             onClick={() => onUpdate({...settings, iterations: 10})}
             className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
           >10x</button>
           <button 
             onClick={() => onUpdate({...settings, iterations: 50})}
             className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
           >50x</button>
           <button 
             onClick={() => onUpdate({...settings, iterations: 100})}
             className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
           >100x</button>
           <button 
             onClick={() => onUpdate({...settings, iterations: 200})}
             className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
           >200x</button>
        </div>
        <p className="text-xs text-gray-500">
          Drag slider to add/remove passes dynamically.
        </p>
      </div>
      
      <div className="mt-auto">
        <Divider />
        <button
           onClick={() => setShowEducation(true)}
           className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-wider border border-gray-700 group"
        >
           <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
           About JPEG Compression
        </button>
      </div>

      {/* Education Modal */}
      {showEducation && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowEducation(false)}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
               {/* Modal Content */}
               <div className="p-5 overflow-y-auto custom-scrollbar">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-500" />
                            Science of Compression
                        </h2>
                        <p className="text-indigo-400 text-xs mt-1">Understanding the algorithm behind the decay.</p>
                    </div>
                    <button onClick={() => setShowEducation(false)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-6">
                      {/* How it works */}
                      <section>
                          <h3 className="text-sm font-bold text-gray-200 mb-2 flex items-center gap-2">
                             <Zap className="w-4 h-4 text-yellow-500" />
                             How it Works
                          </h3>
                          <div className="text-gray-400 text-xs space-y-2 leading-relaxed">
                              <p>
                                  JPEG does not store pixels directly. Instead, it sees images as waves. It works by dividing an image into <strong>8x8 pixel blocks</strong> and converting them from spatial data (color/brightness) into frequency data using the <strong>Discrete Cosine Transform (DCT)</strong>.
                              </p>
                              <p>
                                  Once in the frequency domain, the algorithm performs <strong>Quantization</strong>. This is the "destructive" step. It aggressively rounds off high-frequency information (fine details and sharp changes) because the human eye is less sensitive to them than low-frequency information (general shapes and tone).
                              </p>
                              <p>
                                  When you save a JPEG repeatedly (as this app simulates), you are applying this rounding error over and over again. The "blocks" you see are the boundaries of the 8x8 grids, and the "mosquito noise" is the result of trying to reconstruct sharp edges from simplified waves.
                              </p>
                          </div>
                      </section>

                      {/* History */}
                      <section className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <h3 className="text-sm font-bold text-gray-200 mb-2 flex items-center gap-2">
                             <HistoryIcon className="w-4 h-4 text-emerald-500" />
                             History & Origins
                          </h3>
                          <ul className="space-y-2 text-xs text-gray-400">
                              <li className="flex gap-2">
                                  <span className="font-mono text-gray-500 min-w-[70px]">Standard</span>
                                  <span><strong>ISO/IEC 10918-1</strong> (Published 1992)</span>
                              </li>
                              <li className="flex gap-2">
                                  <span className="font-mono text-gray-500 min-w-[70px]">Creators</span>
                                  <span><strong>Joint Photographic Experts Group</strong> (Committee)</span>
                              </li>
                              <li className="flex gap-2">
                                  <span className="font-mono text-gray-500 min-w-[70px]">Key Tech</span>
                                  <span>Discrete Cosine Transform (DCT), proposed by <strong>Nasir Ahmed</strong> in 1972.</span>
                              </li>
                          </ul>
                      </section>

                      {/* Backers */}
                      <section>
                          <h3 className="text-sm font-bold text-gray-200 mb-2 flex items-center gap-2">
                             <Scale className="w-4 h-4 text-blue-500" />
                             Licensing & Legacy
                          </h3>
                           <div className="text-gray-400 text-xs space-y-2 leading-relaxed">
                              <p>
                                  The ubiquity of JPEG is no accident. While the algorithm was complex, the committee ensured the "baseline" standard could be used royalty-free.
                              </p>
                              <p>
                                  Major tech giants of the era—including <strong>IBM, Mitsubishi Electric, AT&T, and Canon</strong>—held patents relevant to the technology but agreed to license them for free to establish JPEG as the universal standard for digital photography.
                              </p>
                          </div>
                      </section>
                  </div>
               </div>
               
               <div className="bg-gray-950 p-3 border-t border-gray-800 text-center">
                   <button onClick={() => setShowEducation(false)} className="text-gray-500 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">Close Reference</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};