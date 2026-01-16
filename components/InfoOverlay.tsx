import React, { useState, useEffect } from 'react';
import { Share2, Github, Info, Shield, Bot, Map, Globe, X, ExternalLink, AlertTriangle } from 'lucide-react';

type ModalType = 'about' | 'privacy' | 'ai' | 'roadmap' | 'external_warning' | null;

export const InfoOverlay: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [hasAcceptedExternal, setHasAcceptedExternal] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('jpegifier_external_warning_accepted');
    if (accepted === 'true') {
      setHasAcceptedExternal(true);
    }
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setPendingUrl(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'JPEGifier',
          text: 'Authentic digital decay simulator.',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      alert('Share URL copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleExternalLink = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (hasAcceptedExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setPendingUrl(url);
      setActiveModal('external_warning');
    }
  };

  const confirmExternalLink = () => {
    localStorage.setItem('jpegifier_external_warning_accepted', 'true');
    setHasAcceptedExternal(true);
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    }
    closeModal();
  };

  const handleSourceCode = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Source code repository is currently being organized for public release.");
  };

  return (
    <>
      {/* Footer Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-40 flex justify-center pointer-events-none">
        <div className="bg-gray-950/80 backdrop-blur-md border border-gray-800 rounded-full px-6 py-3 shadow-2xl pointer-events-auto flex items-center gap-6 overflow-x-auto max-w-full">
          <button onClick={handleShare} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-indigo-400 transition-colors whitespace-nowrap">
            <Share2 className="w-3 h-3" /> Share App
          </button>
          
          <button onClick={handleSourceCode} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap">
            <Github className="w-3 h-3" /> View Source
          </button>

          <button onClick={() => setActiveModal('about')} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap">
            <Info className="w-3 h-3" /> About JPEGifier
          </button>

          <button onClick={() => setActiveModal('privacy')} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap">
            <Shield className="w-3 h-3" /> Privacy Promise
          </button>

          <button onClick={() => setActiveModal('ai')} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap">
            <Bot className="w-3 h-3" /> AI Transparency
          </button>

          <button onClick={() => setActiveModal('roadmap')} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap">
            <Map className="w-3 h-3" /> Roadmap
          </button>

          <a 
            href="https://outlandproductions.neocities.org/" 
            onClick={(e) => handleExternalLink(e, "https://outlandproductions.neocities.org/")}
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            <Globe className="w-3 h-3" /> Website
          </a>
        </div>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Content */}
            <div className="p-8">

              {/* EXTERNAL WARNING */}
              {activeModal === 'external_warning' && (
                  <div className="space-y-6 text-center">
                      <div className="mx-auto w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="w-8 h-8 text-yellow-500" />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white mb-2">Leaving JPEGifier</h2>
                          <p className="text-gray-400 text-sm">
                              You are about to visit an external website. 
                          </p>
                          <p className="text-gray-500 text-xs mt-2 break-all font-mono bg-gray-950 p-2 rounded border border-gray-800">
                              {pendingUrl}
                          </p>
                      </div>
                      
                      <div className="flex gap-3 justify-center pt-2">
                          <button 
                            onClick={closeModal}
                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                            onClick={confirmExternalLink}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                          >
                              Continue
                          </button>
                      </div>
                  </div>
              )}
              
              {/* ABOUT */}
              {activeModal === 'about' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                     <span className="font-mono font-bold text-white text-xl">JP</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">About JPEGifier</h2>
                    <p className="text-indigo-400 text-sm font-medium">Authentic Bit Rot Simulator</p>
                  </div>
                  <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                    <p>
                      JPEGifier was built to empower artists and archivists to visualize the invisible decay of digital media. It authentically re-encodes your images repeatedly to simulate "generation loss" directly in your browser.
                    </p>
                    <p>
                      Unlike AI filters that guess what "old" looks like, this app actually destroys your image data bit by bit using real JPEG compression algorithms. It is a tool for understanding digital entropy.
                    </p>
                  </div>
                  <div className="bg-gray-800/50 border border-indigo-500/30 p-4 rounded-lg">
                    <p className="text-indigo-300 text-xs font-medium flex items-center gap-2">
                       <Info className="w-4 h-4" />
                       This app is free forever. No subscriptions, no watermarks.
                    </p>
                  </div>
                </div>
              )}

              {/* PRIVACY */}
              {activeModal === 'privacy' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                     <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Privacy Promise</h2>
                    <p className="text-emerald-400 text-sm font-medium">Local Processing Only</p>
                  </div>
                  <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                    <p>
                      JPEGifier was designed with the specific belief that your images are yours. All data is processed locally on your device using the HTML5 Canvas API.
                    </p>
                    <p>
                      This app does not, has never, and will never upload your images to external servers, track your usage, or harvest data for training models.
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <ul className="space-y-3 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        No Server Uploads
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Local Browser Storage Only
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        No Ad Tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Open Source Code
                      </li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-3">
                     <div className="text-red-400"><Shield className="w-5 h-5" /></div>
                     <p className="text-red-200 text-xs font-medium">This app is never intended to be sold, bartered, or traded.</p>
                  </div>
                </div>
              )}

              {/* AI TRANSPARENCY */}
              {activeModal === 'ai' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                     <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">AI Transparency Statement</h2>
                    <p className="text-violet-400 text-sm font-medium">Created with Human Vision & Machine Intelligence</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                        <h3 className="text-yellow-400 text-sm font-bold flex items-center gap-2 mb-1">
                            <span className="text-lg">✨</span> A Historical Artifact
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            This app serves as a historical artifact of the 'vibecoding' era—a time when natural language became a programming language. It was generated as an intentional exercise in UX design, bridging the gap between concept and reality through Large Language Models.
                        </p>
                    </div>

                    <div className="border border-emerald-500/30 bg-emerald-900/10 p-3 rounded text-center">
                        <p className="text-emerald-400 text-xs font-bold font-mono">
                            "Originally created with Gemini 3 Pro Preview using Google AI Studio - January 2026"
                        </p>
                    </div>

                    <div>
                        <h3 className="text-indigo-400 text-sm font-bold flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4" /> The Human Element
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Created as a meaningful tool for digital artists, this project proves that building software can be a creative act available to everyone. It empowers those with a vision for product design to build freely, regardless of their coding fluency.
                        </p>
                    </div>
                  </div>

                  <button className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-3 rounded-lg border border-gray-700 transition-colors">
                      This app was created 100% with AI <span className="text-violet-400">*AND*</span> HUMANS
                  </button>
                </div>
              )}

              {/* ROADMAP */}
              {activeModal === 'roadmap' && (
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <Map className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Project Roadmap</h2>
                    <p className="text-orange-400 text-sm font-medium">Future Visions & Historical Echoes</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                        <h3 className="text-indigo-400 text-sm font-bold flex items-center gap-2 mb-1">
                            <ExternalLink className="w-4 h-4" /> Artifact Evolution
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            The current JPEG compression is just the foundation. Future iterations could explore video decay (MP4/WebM), chroma subsampling controls, and glitch seeding tools to create more specific aesthetic outcomes—all while keeping the processing strictly local.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-emerald-400 text-sm font-bold flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4" /> A Digital Artifact
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                             Beyond its utility, this project serves as a point of historical interest. It represents a specific moment in time where open-source philosophy met the capabilities of early 2026 AI.
                        </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg mt-4">
                    <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">The Path Forward</p>
                    <p className="text-gray-300 text-xs">
                        This roadmap is not fixed. As an open-source tool, its destiny lies with the community. Fork it, mod it, and make it your own.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
             {activeModal !== 'external_warning' && (
                <div className="bg-gray-950 px-8 py-4 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Version 1.5.0 • Built with React & Tailwind</span>
                    <span className="text-gray-600 text-xs font-mono">Made in the USA us</span>
                </div>
             )}
          </div>
        </div>
      )}
    </>
  );
};