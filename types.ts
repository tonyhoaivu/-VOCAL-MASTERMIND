
export interface EQPoint {
  freq: number;
  gain: number;
  type: string;
}

export interface CompressorKnobs {
  threshold: number;
  ratio_position: string;
  attack_ms: number;
  release_ms: number;
  visual_desc: {
    threshold: string;
    ratio: string;
    attack: string;
    release: string;
  };
}

export interface TechnicalStep {
  step: number;
  plugin: string;
  ui_description: string;   // [Mô tả thực tế]
  mixing_mindset: string;   // [Cách chỉnh để Vocal hay hơn]
  knob_instruction: string; // [Thông số Knobs]
  visual_demo_svg: string;  // [Ảnh Demo]
}

export interface AnalysisReport {
  status: string;
  vocal_diagnosis: {
    texture: string;
    pitch_saturation: string;
  };
  visual_mapping: {
    eq_curve_svg: string;
    knob_visuals_svg: string;
  };
  plugin_chain: TechnicalStep[];
  visual_data: {
    eq_points: EQPoint[];
    knobs: CompressorKnobs;
  };
  mastering_advice: string;
}

export enum LoadingPhase {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING_HARMONICS = 'ANALYZING_HARMONICS',
  DETECTING_DYNAMICS = 'DETECTING_DYNAMICS',
  MEASURING_REVERB = 'MEASURING_REVERB',
  GENERATING_REPORT = 'GENERATING_REPORT'
}
