import { useState, useRef, useEffect } from "react";
import { Play, Pause, CheckCircle2, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { motion } from "framer-motion";

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
}

export function VideoPlayer({ videoUrl, onComplete }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null); // Tam ekran için tüm kutuyu referans alıyoruz
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // YENİ: Ses ve Tam Ekran durumları
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ses seviyesini videoya uygula
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // "ESC" tuşuyla tam ekrandan çıkılırsa state'i güncelle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // YENİ: Tam Ekran Fonksiyonu
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setIsCompleted(true);
    setProgress(100);
    // Tam ekrandaysa otomatik çık
    if (document.fullscreenElement) document.exitFullscreen();
    onComplete(); 
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black group flex flex-col justify-center">
      
      {/* VİDEO EKRANI */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        onClick={togglePlay}
      />

      {/* VİDEO BİTTİĞİNDE ÇIKAN TAMAMLANDI EKRANI */}
      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
          className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20"
        >
          <CheckCircle2 className="size-20 text-success mb-4" />
          <h3 className="text-2xl font-bold">Eğitim Tamamlandı!</h3>
          <p className="text-gray-300 mt-2">İlerlemen başarıyla kaydedildi.</p>
        </motion.div>
      )}

      {/* ÖZEL KONTROL ÇUBUĞU */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center gap-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-10">
        
        {/* Play/Pause */}
        <button onClick={togglePlay} disabled={isCompleted} className="text-white hover:text-primary transition-colors focus:outline-none">
          {isPlaying ? <Pause className="size-7" /> : <Play className="size-7" />}
        </button>

        {/* İlerleme Çubuğu (Görseldir, Tıklanıp İleri Alınamaz) */}
        <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* YENİ: Ses Kontrolü */}
        <div className="flex items-center gap-2 group/volume">
          <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-primary transition-colors focus:outline-none">
            {isMuted || volume === 0 ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
          </button>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 md:w-24 accent-primary cursor-pointer transition-all"
          />
        </div>

        {/* YENİ: Tam Ekran Butonu */}
        <button onClick={toggleFullScreen} className="text-white hover:text-primary transition-colors focus:outline-none ml-2">
          {isFullscreen ? <Minimize className="size-6" /> : <Maximize className="size-6" />}
        </button>

      </div>
    </div>
  );
}