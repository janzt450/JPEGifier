export interface BatchItem {
  id: string;
  original: string;
  processed: string | null;
  name: string;
  width: number;
  height: number;
  
  // Current state of the processed image
  currentIterations: number;
  currentQuality: number;
  
  // Desired state (what the sliders are set to)
  targetIterations: number;
  targetQuality: number;
  
  status: 'pending' | 'processing' | 'done';
  isSelected: boolean;
}

export interface ProcessingStats {
  totalItems: number;
  completedItems: number;
  targetIterations: number;
  isProcessing: boolean;
  currentItemName?: string;
  timeElapsed: number;
  eta?: number;
}

export interface ProcessorSettings {
  iterations: number;
  quality: number; // 0.0 to 1.0
}