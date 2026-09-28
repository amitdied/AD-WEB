export interface Beat {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  tags: string[];
  genre: string;
  audioUrl: string;
  coverUrl: string;
  price: number;
  featured?: boolean;
  plays?: number;
  duration?: string;
  waveform?: number[];
  description?: string;
}

export interface LicenseOption {
  id: string;
  name: string;
  price: number;
  format: string;
  distributionLimit: string;
  streamsLimit: string;
  musicVideo: string;
  radioBroadcasting: string;
  forProfitLive: boolean;
}

export interface CartItem {
  beat: Beat;
  license: LicenseOption;
}
