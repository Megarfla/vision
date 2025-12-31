
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Player from './components/Player';
import ChannelList from './components/ChannelList';
import ZappingOverlay from './components/ZappingOverlay';
import { fetchChannels } from './services/m3uParser';
import { Channel, Category, UIState } from './types';

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [uiState, setUiState] = useState<UIState>(UIState.LOADING);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showZapping, setShowZapping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [numBuffer, setNumBuffer] = useState<string>("");
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  
  const zappingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setUiState(UIState.LOADING);
        const data = await fetchChannels();
        if (data.length === 0) throw new Error("A lista de canais está vazia ou inacessível.");
        
        console.log(`Sucesso: ${data.length} canais carregados.`);
        setChannels(data);

        const groups: Record<string, Channel[]> = {};
        data.forEach(ch => {
          const cat = ch.group || 'Geral';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(ch);
        });

        const catList: Category[] = Object.entries(groups).map(([name, channels]) => ({
          name,
          channels
        }));
        setCategories(catList);

        const lastId = localStorage.getItem('last_channel_id');
        let initialIndex = 0;
        if (lastId) {
          const idx = data.findIndex(c => c.id === lastId);
          if (idx !== -1) initialIndex = idx;
        }
        
        setCurrentIndex(initialIndex);
        setUiState(UIState.IDLE);
      } catch (err) {
        console.error("Erro ao inicializar app:", err);
        setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar lista IPTV.");
        setUiState(UIState.ERROR);
      }
    };
    init();
  }, []);

  const changeChannel = useCallback((index: number) => {
    if (channels.length === 0) return;
    
    let nextIdx = index;
    if (nextIdx < 0) nextIdx = channels.length - 1;
    if (nextIdx >= channels.length) nextIdx = 0;

    console.log(`Trocando para Canal ${channels[nextIdx].number}: ${channels[nextIdx].name} URL: ${channels[nextIdx].url}`);
    
    setCurrentIndex(nextIdx);
    localStorage.setItem('last_channel_id', channels[nextIdx].id);
    
    setShowZapping(true);
    if (zappingTimerRef.current) clearTimeout(zappingTimerRef.current);
    zappingTimerRef.current = setTimeout(() => setShowZapping(false), 3000);
    
    setIsSidebarOpen(false);
  }, [channels]);

  useEffect(() => {
    if (numBuffer.length > 0) {
      if (numBufferTimerRef.current) clearTimeout(numBufferTimerRef.current);
      numBufferTimerRef.current = setTimeout(() => {
        const targetNum = parseInt(numBuffer);
        const foundIdx = channels.findIndex(c => c.number === targetNum);
        if (foundIdx !== -1) {
          changeChannel(foundIdx);
        }
        setNumBuffer("");
      }, 1200);
    }
  }, [numBuffer, channels, changeChannel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se a sidebar estiver aberta, as setas devem controlar o foco do HTML nativo (tratado pelo ChannelList e browser)
      // Não queremos mudar o canal de fundo enquanto navegamos no menu
      if (isSidebarOpen) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            setIsSidebarOpen(false);
        }
        return; 
      }

      if (e.key >= '0' && e.key <= '9') {
        setNumBuffer(prev => prev + e.key);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'ChannelUp':
          changeChannel(currentIndex - 1);
          break;
        case 'ArrowDown':
        case 'ChannelDown':
          changeChannel(currentIndex + 1);
          break;
        case 'Enter':
        case 'OK':
        case 'Select':
          // Abrir menu de canais
          setIsSidebarOpen(prev => !prev);
          break;
        case 'Escape':
        case 'Backspace':
          // Se não tem menu, talvez sair do app ou mostrar info (aqui fecha sidebar por segurança)
          setIsSidebarOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isSidebarOpen, changeChannel]);

  const activeChannel = channels[currentIndex] || null;

  if (uiState === UIState.LOADING) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Vision IPTV Pro</h2>
          <p className="text-zinc-500 text-sm mt-2 animate-pulse">Sintonizando canais da lista...</p>
        </div>
      </div>
    );
  }

  if (uiState === UIState.ERROR) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-500/10 p-8 rounded-full mb-8 border border-red-500/20">
           <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-white">Falha na Sintonização</h1>
        <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">{errorMsg}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95 focus:ring-4 ring-blue-500"
        >
          Tentar Reconectar
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative selection:bg-blue-500 selection:text-white">
      {activeChannel && (
        <Player 
          key={activeChannel.id + activeChannel.url}
          url={activeChannel.url} 
          onLoading={setIsPlayerLoading}
          onError={(msg) => console.warn(msg)}
        />
      )}

      {/* Buffering Indicator */}
      {isPlayerLoading && !showZapping && (
        <div className="fixed top-10 left-10 z-[60] flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
          <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider leading-none">Carregando Sinal...</span>
          </div>
        </div>
      )}

      {numBuffer.length > 0 && (
        <div className="fixed top-12 right-12 z-[100] bg-blue-600 text-white text-7xl font-black px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.4)] animate-in zoom-in-50 duration-200">
          {numBuffer}
        </div>
      )}

      <ZappingOverlay channel={activeChannel!} isVisible={showZapping && !isSidebarOpen} />
      
      <ChannelList 
        categories={categories} 
        activeChannel={activeChannel} 
        isOpen={isSidebarOpen}
        onSelect={(ch) => {
          const idx = channels.findIndex(c => c.id === ch.id);
          changeChannel(idx);
        }}
      />

      {!isSidebarOpen && (
        <>
           {/* Abrir menu rápido ao clicar no centro */}
           <div className="fixed inset-x-32 inset-y-32 z-10 cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
           
           {/* Botão Menu Flutuante para Mobile/Mouse */}
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="fixed top-6 left-6 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white md:hidden"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
           </button>

           {/* Áreas de zapping nas bordas */}
           <div 
             className="fixed inset-y-0 left-0 w-24 z-20 group cursor-pointer flex items-center justify-start pl-4 md:pl-8 hover:bg-gradient-to-r hover:from-black/50 hover:to-transparent transition-all" 
             onClick={() => changeChannel(currentIndex - 1)}
           >
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
             </div>
           </div>
           
           <div 
             className="fixed inset-y-0 right-0 w-24 z-20 group cursor-pointer flex items-center justify-end pr-4 md:pr-8 hover:bg-gradient-to-l hover:from-black/50 hover:to-transparent transition-all" 
             onClick={() => changeChannel(currentIndex + 1)}
           >
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
             </div>
           </div>
        </>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-500" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default App;
