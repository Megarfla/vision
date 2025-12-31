
import React, { useEffect, useRef } from 'react';
import { Channel, Category } from '../types';

interface ChannelListProps {
  categories: Category[];
  activeChannel: Channel | null;
  onSelect: (channel: Channel) => void;
  isOpen: boolean;
}

const ChannelList: React.FC<ChannelListProps> = ({ categories, activeChannel, onSelect, isOpen }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll e Foco Automático para controle remoto
  useEffect(() => {
    if (isOpen && activeChannel) {
      // Pequeno delay para garantir que o DOM renderizou
      setTimeout(() => {
        const activeEl = document.getElementById(`list-item-${activeChannel.id}`);
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focar no elemento atual para navegação via teclado/controle
          (activeEl as HTMLElement).focus();
        }
      }, 100);
    }
  }, [isOpen, activeChannel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 md:w-96 bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Vision IPTV</h1>
        <p className="text-zinc-400 text-sm mt-1">Lista de Canais</p>
        <p className="text-zinc-600 text-[10px] mt-2">Use as setas para navegar e OK para selecionar</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {categories.map((cat) => (
          <div key={cat.name}>
            <h2 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 sticky top-0 bg-zinc-900/95 py-2 z-10">{cat.name}</h2>
            <div className="space-y-1">
              {cat.channels.map((ch) => (
                <button
                  key={ch.id}
                  id={`list-item-${ch.id}`}
                  onClick={() => onSelect(ch)}
                  // tabIndex 0 permite que o controle remoto "pouse" neste elemento
                  tabIndex={0}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all outline-none focus:scale-105 focus:bg-white/10 group ${
                    activeChannel?.id === ch.id 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                      : 'hover:bg-white/5 text-zinc-300 border border-transparent'
                  }`}
                >
                  <span className={`text-xs font-mono w-6 opacity-60 ${activeChannel?.id === ch.id ? 'text-blue-400' : ''}`}>
                    {String(ch.number).padStart(2, '0')}
                  </span>
                  {ch.logo ? (
                    <img src={ch.logo} alt="" className="w-8 h-8 rounded-md object-contain bg-white/5 p-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold">
                      TV
                    </div>
                  )}
                  <span className="flex-1 text-left font-medium truncate">{ch.name}</span>
                  {activeChannel?.id === ch.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelList;
