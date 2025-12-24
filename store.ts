
import { create } from 'zustand';
import { GameState, BiomeType } from './types';

export const useStore = create<GameState>((set) => ({
  status: 'intro',
  speed: 0,
  torque: 100,
  distance: 0,
  biome: 'forest',
  weather: 'clear',
  setStatus: (status) => set({ status }),
  updateDistance: (delta) => set((state) => ({ distance: state.distance + delta })),
  setBiome: (biome) => set({ biome }),
  setWeather: (weather) => set({ weather }),
  setSpeed: (speed) => set({ speed }),
  setTorque: (torque) => set({ torque }),
  resetGame: () => set({ 
    status: 'intro', 
    distance: 0, 
    speed: 0, 
    torque: 100,
    weather: 'clear' 
  }),
}));
