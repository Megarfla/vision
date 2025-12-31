import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
  onLoading?: (isLoading: boolean) => void;
  onError?: (msg: string) => void;
}

const Player: React.FC<PlayerProps> = ({ url, onLoading, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [errorType, setErrorType] = useState<'none' | 'mixed' | 'cors' | 'generic'>('none');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorType('none');
    onLoading?.(true);

    // Detectar Mixed Content
    const isHttps = window.location.protocol === 'https:';
    const isStreamHttp = url.startsWith('http:');
    
    if (isHttps && isStreamHttp) {
      console.warn("Mixed Content: Carregando stream HTTP em site HTTPS.");
    }

    const initPlayer = () => {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          manifestLoadingMaxRetry: 10,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 10,
          xhrSetup: (xhr) => {
             xhr.withCredentials = false;
          }
        });

        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            console.warn("Autoplay bloqueado.", err);
          });
          onLoading?.(false);
          setErrorType('none');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS Fatal Error:", data);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (data.response?.code === 0) {
                  setErrorType('cors');
                  onError?.("Erro de Conexão/CORS.");
                } else {
                  hls.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setErrorType('generic');
                onError?.("Não foi possível carregar este stream.");
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          video.play();
          onLoading?.(false);
        });
        video.addEventListener('error', (e) => {
          console.error("Native Player Error", e);
          setErrorType('generic');
        });
      } else {
        setErrorType('generic');
        onError?.("Navegador incompatível com HLS.");
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="fixed inset-0 bg-black w-full h-full flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted={isMuted}
      />
      
      {isMuted && errorType === 'none' && (
        <button 
          onClick={toggleMute}
          className="absolute top-10 right-10 z-[70] bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md transition-all shadow-2xl animate-bounce"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          <span className="font-bold uppercase tracking-tighter">Ativar Som da TV</span>
        </button>
      )}

      {errorType !== 'none' && (
        <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center z-50">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
             <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Sinal Indisponível</h3>
          
          <div className="max-w-sm">
            {errorType === 'cors' ? (
              <p className="text-zinc-500 text-sm">Restrições de segurança (CORS) neste canal.</p>
            ) : errorType === 'mixed' ? (
              <p className="text-zinc-500 text-sm">Erro de Mixed Content (HTTP/HTTPS).</p>
            ) : (
              <p className="text-zinc-500 text-sm">O canal pode estar offline.</p>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;