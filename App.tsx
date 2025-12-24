
import React from 'react';
import GameScene from './components/GameScene';
import UI from './components/UI';

const App: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-900">
      {/* Three.js Layer */}
      <div className="absolute inset-0">
        <GameScene />
      </div>

      {/* Overlay UI Layer */}
      <UI />

      {/* Vignette effect for speed feel */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)] z-10" />
    </div>
  );
};

export default App;
