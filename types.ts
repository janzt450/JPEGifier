export interface ImageState {
  original: string | null;
  processed: string | null;
  name: string;
  width: number;
  height: number;
  currentIterations: number;
  currentQuality: number;
}

export interface ProcessingStats {
  targetIterations: number;
  isProcessing: boolean;
  timeElapsed: number;
  eta?: number;
}

export interface ProcessorSettings {
  iterations: number;
  quality: number; // 0.0 to 1.0
}