
export type BiomeType = 'forest' | 'desert' | 'city' | 'tundra';
export type WeatherType = 'clear' | 'rain' | 'storm' | 'fog';

export interface GameState {
  status: 'intro' | 'playing' | 'paused' | 'finished';
  speed: number;
  torque: number;
  distance: number;
  biome: BiomeType;
  weather: WeatherType;
  setStatus: (status: 'intro' | 'playing' | 'paused' | 'finished') => void;
  updateDistance: (delta: number) => void;
  setBiome: (biome: BiomeType) => void;
  setWeather: (weather: WeatherType) => void;
  setSpeed: (speed: number) => void;
  setTorque: (torque: number) => void;
  resetGame: () => void;
}
