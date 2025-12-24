
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Gauge, Zap, Wind, Navigation, Crosshair, CloudRain, Sun, CloudFog, CloudLightning } from 'lucide-react';

const UI: React.FC = () => {
  const { status, setStatus, speed, torque, biome, setBiome, weather, setWeather, distance, resetGame } = useStore();
  const [countdown, setCountdown] = useState(3);
  
  // Calculate Race Progress
  const RACE_DISTANCE = 30000;
  const progress = Math.min((distance / RACE_DISTANCE) * 100, 100);

  useEffect(() => {
    if (status === 'intro') {
      const timer = setInterval(() => {
         setCountdown(prev => {
             if (prev <= 1) {
                 clearInterval(timer);
                 setStatus('playing');
                 return 0;
             }
             return prev - 1;
         });
      }, 1500);
      return () => clearInterval(timer);
    }
  }, [status, setStatus]);

  if (status === 'finished') {
      return (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60 backdrop-blur-md text-white">
              <h1 className="text-8xl font-black italic mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  MISSION COMPLETE
              </h1>
              <div className="text-2xl font-mono mb-8">DISTANCE TRAVELED: {(distance/100).toFixed(2)} KM</div>
              <button 
                  onClick={() => resetGame()}
                  className="px-8 py-3 bg-white text-black font-bold font-mono hover:scale-110 transition-transform"
              >
                  PLAY AGAIN
              </button>
          </div>
      )
  }

  if (status === 'intro') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 text-white text-center bg-black/20">
        <h1 className="text-9xl font-black italic tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] scale-150 transform">
          PLANES
        </h1>
        <div className="bg-black/70 p-8 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl min-w-[400px]">
          <div className="text-6xl font-mono font-bold text-yellow-400 mb-4 animate-pulse">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
          <div className="flex justify-between items-center text-sm font-mono text-gray-400 border-t border-white/10 pt-4">
             <span>SYSTEM CHECK</span>
             <span className="text-green-400">OPTIMAL</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-50 font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-4">
            {/* Biome Selector */}
            <div className="flex gap-2 bg-black/30 p-2 rounded-full border border-white/5 backdrop-blur-sm pointer-events-auto">
            {['forest', 'desert', 'city', 'tundra'].map((b) => (
                <button
                key={b}
                onClick={() => setBiome(b as any)}
                className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all duration-300 ${
                    biome === b ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                >
                {b}
                </button>
            ))}
            </div>
            
            {/* Weather Selector */}
            <div className="flex gap-2 bg-black/30 p-2 rounded-full border border-white/5 backdrop-blur-sm pointer-events-auto w-fit">
                <button onClick={() => setWeather('clear')} className={`p-2 rounded-full ${weather === 'clear' ? 'bg-yellow-400 text-black' : 'text-gray-400'}`}><Sun size={16}/></button>
                <button onClick={() => setWeather('rain')} className={`p-2 rounded-full ${weather === 'rain' ? 'bg-blue-400 text-black' : 'text-gray-400'}`}><CloudRain size={16}/></button>
                <button onClick={() => setWeather('fog')} className={`p-2 rounded-full ${weather === 'fog' ? 'bg-gray-400 text-black' : 'text-gray-400'}`}><CloudFog size={16}/></button>
                <button onClick={() => setWeather('storm')} className={`p-2 rounded-full ${weather === 'storm' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}><CloudLightning size={16}/></button>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-end gap-1 w-64">
           <span className="text-[10px] uppercase text-gray-400">Race Progress</span>
           <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all duration-300" style={{ width: `${progress}%` }} />
           </div>
           <span className="text-xs font-bold text-white">{Math.floor(progress)}%</span>
        </div>
      </div>

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <Crosshair className="w-16 h-16 text-white" />
      </div>

      {/* Bottom HUD - Dashboard */}
      <div className="flex justify-center items-end gap-12 text-white pb-8">
        {/* Speed */}
        <div className="bg-black/20 backdrop-blur-sm border-l-2 border-cyan-500 p-4 w-40 flex flex-col items-start skew-x-[-12deg]">
          <span className="text-[10px] uppercase text-cyan-200/50">Air Speed</span>
          <div className="text-4xl font-black italic tracking-tighter tabular-nums">
            {Math.floor(speed)} <span className="text-xs font-normal not-italic text-gray-400">KTS</span>
          </div>
        </div>

        {/* Torque Compass Gauge */}
        <div className="relative w-40 h-40 bg-black/40 rounded-full border-4 border-gray-800 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.2)]">
             <div className="absolute inset-0 rounded-full border-2 border-white/10" />
             {/* Ticks */}
             {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                 <div key={deg} className="absolute w-1 h-3 bg-gray-500 top-2 left-1/2 -translate-x-1/2 origin-[50%_72px]" style={{ transform: `rotate(${deg}deg)` }} />
             ))}
             
             {/* Needle */}
             <div 
                className="absolute w-1 h-16 bg-red-500 bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-100 ease-out"
                style={{ transform: `rotate(${(torque - 100) * 1.5 - 90}deg)` }} 
             >
                 <div className="w-3 h-3 bg-red-500 rounded-full absolute -bottom-1.5 -left-1" />
             </div>
             
             <div className="absolute bottom-8 text-center">
                 <div className="text-[10px] uppercase text-gray-500 font-bold">TORQUE</div>
                 <div className="text-lg font-black text-red-500">{Math.floor(torque)}</div>
             </div>
        </div>

        {/* Boost/Fuel */}
        <div className="bg-black/20 backdrop-blur-sm border-r-2 border-emerald-500 p-4 w-40 flex flex-col items-end skew-x-[12deg]">
          <span className="text-[10px] uppercase text-emerald-200/50">Thrust</span>
          <div className="text-4xl font-black italic tracking-tighter tabular-nums text-emerald-400">
             {(speed/3.2).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="absolute bottom-8 right-8 text-right space-y-1">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1">Flight Systems</div>
        {['W / Pitch Down', 'S / Pitch Up', 'A / Roll Left', 'D / Roll Right'].map(text => (
            <div key={text} className="text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-1 rounded inline-block ml-2 mb-1 border border-white/5">
                {text}
            </div>
        ))}
      </div>
    </div>
  );
};

export default UI;
