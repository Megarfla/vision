
import React from 'react';
import { Channel } from '../types';

interface ZappingOverlayProps {
  channel: Channel;
  isVisible: boolean;
}

const ZappingOverlay: React.FC<ZappingOverlayProps> = ({ channel, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40 animate-in fade-in slide-in-from-bottom-8 duration-300">
      <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex items-center gap-6 shadow-2xl overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt="" 
            className="w-20 h-20 object-contain bg-white rounded-2xl p-2 shadow-inner" 
          />
        ) : (
          <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/5">
            {channel.number}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded tracking-tighter">LIVE</span>
             <span className="text-zinc-400 text-sm font-medium">{channel.group}</span>
          </div>
          <h2 className="text-3xl font-bold mt-1 tracking-tight truncate">{channel.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Transmitindo agora</span>
          </div>
        </div>

        <div className="text-5xl font-black text-white/5 absolute -right-4 -bottom-4 select-none italic">
          {String(channel.number).padStart(3, '0')}
        </div>
      </div>
    </div>
  );
};

export default ZappingOverlay;
