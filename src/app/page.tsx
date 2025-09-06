'use client';

import { useState, useEffect } from 'react';

// Type tanımları
type DailyPhotoProps = {
  date: Date;
  onNewPhotoAvailable: (isNew: boolean, photoId: number) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

type Star = {
  key: string;
  left: string;
  top: string;
  fontSize: string;
  color: string;
  animationDelay: string;
  animationDuration: string;
  symbol: string;
  moveDistance: string;
};

type PlayerScores = {
  okan: number;
  sevilay: number;
};

// Sıralı fotoğraf değişimi: 46→45→44→...→2→1→47→46→45... (1-3 saat arası)
function getSequentialPhotoName(date: Date, photoFormat: string = 'jpeg'): { photoSrc: string; intervalId: number } {
  const startTime = new Date('2025-01-01').getTime(); // Sabit başlangıç
  const currentTime = date.getTime();
  const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
  
  // 1-3 saat arası rastgele süre (60-180 dakika)
  const getIntervalDuration = (intervalIndex: number): number => {
    const seed = intervalIndex * 1234567;
    const randomValue = Math.abs(Math.sin(seed)) * 1000000;
    return 60 + Math.floor((randomValue % 1000) * 120 / 1000); // 60-180 dakika
  };
  
  // Hangi interval'dayız?
  let totalMinutes = 0;
  let intervalId = 0;
  
  while (totalMinutes <= elapsedMinutes) {
    const intervalDuration = getIntervalDuration(intervalId);
    if (totalMinutes + intervalDuration > elapsedMinutes) {
      break; // Bu interval'dayız
    }
    totalMinutes += intervalDuration;
    intervalId++;
  }
  
  // Fotoğraf sırası: 46→45→44→...→2→1→47→46→45... (47 fotoğraf var)
  const photoSequence = [46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 47];
  const photoIndex = photoSequence[intervalId % photoSequence.length];
  
  // Bir sonraki değişime kaç dakika kaldı
  const currentIntervalDuration = getIntervalDuration(intervalId);
  const nextChangeMinutes = totalMinutes + currentIntervalDuration - elapsedMinutes;
  const nextChangeHours = Math.floor(nextChangeMinutes / 60);
  const nextChangeMins = nextChangeMinutes % 60;
  
  console.log(`Interval: ${intervalId}, Foto: ${photoIndex}, Sonraki değişim: ${nextChangeHours}s ${nextChangeMins}dk`);
  
  return {
    photoSrc: `/love-photos/love_${photoIndex}.${photoFormat}`,
    intervalId: intervalId
  };
}

// Gerçek zamanlı skor sistemi
function useServerScoreSystem() {
  const [scores, setScores] = useState<PlayerScores>({ okan: 0, sevilay: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usedPhotos, setUsedPhotos] = useState<number[]>([]); // Kullanılmış fotoğraf ID'leri
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Fotoğrafın kullanılıp kullanılmadığını kontrol et
  const isPhotoUsed = (photoId: number): boolean => {
    return usedPhotos.includes(photoId);
  };

  // Skoru güncelle (sadece yeni fotoğraflar için)
  const addScore = async (player: 'okan' | 'sevilay', points: number, photoId: number) => {
    if (isPhotoUsed(photoId)) {
      console.log('Bu fotoğraftan zaten puan alındı!');
      return false;
    }

    const newScores = {
      ...scores,
      [player]: scores[player] + points
    };
    
    const newUsedPhotos = [...usedPhotos, photoId];
    
    // Optimistic update - hemen UI'yi güncelle
    setScores(newScores);
    setUsedPhotos(newUsedPhotos);
    
    // Sunucuya kaydet - SSE otomatik olarak diğer istemcileri güncelleyecek
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newScores,
          usedPhotos: newUsedPhotos
        })
      });
      return true;
    } catch (error) {
      console.log('Skor kaydedilemedi:', error);
      // Hata durumunda geri al
      setScores(scores);
      setUsedPhotos(usedPhotos);
      return false;
    }
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectSSE = () => {
      setConnectionStatus('connecting');
      eventSource = new EventSource('/api/scores-sse');

      eventSource.onopen = () => {
        console.log('SSE bağlantısı kuruldu');
        setConnectionStatus('connected');
        setIsLoaded(true);
        setIsLoading(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setScores({ okan: data.okan || 0, sevilay: data.sevilay || 0 });
          setUsedPhotos(data.usedPhotos || []);
          setGameEnded(data.gameEnded || false);
          setWinner(data.winner || null);
        } catch (error) {
          console.error('SSE veri parse hatası:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.log('SSE bağlantı hatası:', error);
        setConnectionStatus('disconnected');
        eventSource?.close();
        
        // 3 saniye sonra yeniden bağlan
        reconnectTimer = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  return { scores, addScore, isLoaded, isLoading, isPhotoUsed, connectionStatus, gameEnded, winner };
}

// Kazanan Ekranı
function WinnerScreen({ winner, scores }: { winner: string | null, scores: PlayerScores }) {
  if (!winner) return null;
  
  const isOkan = winner === 'Okan';
  const isDraw = winner === 'Berabere';
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gradient-to-br from-black/80 via-purple-900/80 to-pink-900/80 backdrop-blur-xl">
      <div className="text-center max-w-2xl mx-4">
        <div className={`text-8xl mb-8 animate-bounce ${isDraw ? 'text-yellow-400' : isOkan ? 'text-blue-400' : 'text-purple-400'}`}>
          🏆
        </div>
        
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-pink-200 via-rose-300 to-pink-400 bg-clip-text text-transparent">
          TEBRİKLER!
        </h1>
        
        <h2 className={`text-5xl font-bold mb-8 ${isDraw ? 'text-yellow-300' : isOkan ? 'text-blue-300' : 'text-purple-300'}`}>
          {isDraw ? '🤝 BERABERE! 🤝' : `${winner} Kazandı!`}
        </h2>
        
        <div className="flex justify-center gap-12 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-300 mb-2">Okan</div>
            <div className="text-5xl font-bold text-white bg-blue-900/50 rounded-full w-24 h-24 flex items-center justify-center">
              {scores.okan}
            </div>
          </div>
          
          <div className="text-6xl text-pink-300 flex items-center">
            ♥
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-2">Sevilay</div>
            <div className="text-5xl font-bold text-white bg-purple-900/50 rounded-full w-24 h-24 flex items-center justify-center">
              {scores.sevilay}
            </div>
          </div>
        </div>
        
        <p className="text-2xl text-white/90 mb-4">
          10 günlük aşk yarışması sona erdi! 
        </p>
        
        <p className="text-xl text-pink-300">
          {isDraw ? 
            'İkiniz de eşit sevgi gösterdiniz! ❤️' : 
            `${winner} daha çok sevgi topladı! 🎉`
          }
        </p>
        
        <div className="mt-8 text-lg text-white/70">
          Bu sayfa sonsuza kadar böyle kalacak... 💕
        </div>
      </div>
    </div>
  );
}

// Oyun butonları
function GameButtons({ onPlayerClick, isVisible, isPhotoUsed }: { 
  onPlayerClick: (player: 'okan' | 'sevilay') => void;
  isVisible: boolean;
  isPhotoUsed: boolean;
}) {
  // Eğer puan alınmışsa veya görünür olmaması gerekiyorsa butonları gizle
  if (!isVisible || isPhotoUsed) return null;
  
  return (
    <>
      <button
        onClick={() => onPlayerClick('okan')}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-[60]
                      bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800
                      text-white font-bold text-4xl w-16 h-16 rounded-full
                      shadow-2xl hover:shadow-blue-500/50 transition-all duration-300
                      animate-pulse hover:scale-110 border-2 border-white/30"
      >
        O
      </button>
      
      <button
        onClick={() => onPlayerClick('sevilay')}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-[60]
                      bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800
                      text-white font-bold text-4xl w-16 h-16 rounded-full
                      shadow-2xl hover:shadow-purple-500/50 transition-all duration-300
                      animate-pulse hover:scale-110 border-2 border-white/30"
      >
        S
      </button>
    </>
  );
}

// Tebrik mesajı
function CelebrationMessage({ player, points }: { 
  player: 'okan' | 'sevilay' | null; 
  points: number;
}) {
  if (!player) return null;
  
  const isOkan = player === 'okan';
  const name = isOkan ? 'Okan' : 'Sevilay';
  const color = isOkan ? 'text-blue-400' : 'text-purple-400';
  const bgColor = isOkan ? 'bg-blue-900/80' : 'bg-purple-900/80';
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className={`${color} ${bgColor} text-6xl font-bold animate-bounce drop-shadow-2xl 
                      backdrop-blur-sm rounded-2xl px-8 py-4 border-2 border-white/20 shadow-2xl`}>
        {name} +{points} puan!
      </div>
    </div>
  );
}

function DailyPhoto({ date, onNewPhotoAvailable, isOpen, setIsOpen }: DailyPhotoProps) {
  const [currentPhoto, setCurrentPhoto] = useState({ photoSrc: '', intervalId: -1 });
  
  useEffect(() => {
    // İlk yüklemede fotoğrafı belirle
    const newPhoto = getSequentialPhotoName(date);
    const isNewPhoto = newPhoto.intervalId !== currentPhoto.intervalId;
    
    if (isNewPhoto) {
      setCurrentPhoto(newPhoto);
      onNewPhotoAvailable(true, newPhoto.intervalId); 
    }
  }, [date, onNewPhotoAvailable, currentPhoto.intervalId]);

  useEffect(() => {
    // Her 30 saniyede fotoğraf kontrolü yap
    const checkPhotoInterval = setInterval(() => {
      const newDate = new Date();
      const newPhoto = getSequentialPhotoName(newDate);
      
      if (newPhoto.intervalId !== currentPhoto.intervalId) {
        console.log(`Fotoğraf değişti: ${currentPhoto.intervalId} -> ${newPhoto.intervalId}`);
        setCurrentPhoto(newPhoto);
        onNewPhotoAvailable(true, newPhoto.intervalId);
      }
    }, 60000); // Her dakika kontrol et

    return () => clearInterval(checkPhotoInterval);
  }, [currentPhoto.intervalId, onNewPhotoAvailable]);

  return (
    <>
      <button
        className="
          bg-gradient-to-r from-rose-600 via-pink-700 to-rose-800 hover:from-pink-700 hover:via-rose-800 hover:to-pink-900
          text-white font-semibold px-8 py-4 rounded-full 
          shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-110
          focus:outline-none focus:ring-4 focus:ring-rose-400/50
          border border-rose-400/30 backdrop-blur-sm
        "
        onClick={() => setIsOpen(true)}
      >
        <span className="flex items-center gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Bugünün Fotoğrafı
        </span>
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-gradient-to-br from-black/80 via-purple-900/50 to-pink-900/50 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="relative bg-gradient-to-br from-white/20 via-pink-100/20 to-rose-100/20 
                          rounded-3xl p-8 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col items-center 
                          border border-white/30 backdrop-blur-2xl
                          transform transition-all duration-500 ease-out
                          animate-modal-appear">
            
            <button
              className="absolute top-6 right-6 bg-gradient-to-br from-pink-500/30 to-rose-500/30 
                          rounded-full p-3 hover:from-pink-600/40 hover:to-rose-600/40 
                          transition-all duration-300 transform hover:rotate-90 hover:scale-110
                          focus:outline-none border border-white/20 backdrop-blur-sm
                          shadow-lg hover:shadow-xl"
              onClick={() => setIsOpen(false)}
            >
              <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>

            <div className="relative overflow-hidden rounded-2xl border-4 border-gradient-to-br from-pink-300/50 to-rose-300/50 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto.photoSrc}
                alt="Bugünün Fotoğrafı"
                width={800}
                height={600}
                className="rounded-xl object-contain max-w-[85vw] max-h-[65vh] 
                          transition-all duration-700 hover:scale-105"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "https://placehold.co/600x600/ec4899/FFFFFF?text=Fotoğraf+Yok";
                  img.alt = "Fotoğraf Bulunamadı";
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-pink-900/20 via-transparent to-transparent pointer-events-none rounded-xl"></div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-pink-500/30 to-rose-500/30 
                            backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <div className="text-white text-lg font-medium flex items-center gap-3">
                <span className="text-pink-300 animate-pulse">♥</span>
                {date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                <span className="text-pink-300 animate-pulse">♥</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PerfectStar({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function RotatingTimeStar({ size }: { size: number }) {
  return (
    <div 
      className="relative flex items-center justify-center text-yellow-300 filter drop-shadow-lg" 
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div style={{
        animation: 'spin-clockwise 8s linear infinite',
        transformOrigin: 'center center'
      }}>
        <PerfectStar size={size} className="text-yellow-400" />
      </div>
    </div>
  );
}

function ScoreBoard({ scores, isLoaded, isLoading, connectionStatus }: { 
  scores: PlayerScores; 
  isLoaded: boolean;
  isLoading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}) {
  if (!isLoaded) {
    return (
      <div className="mb-8 flex justify-center gap-8">
        <div className="animate-pulse bg-gray-300/20 rounded-2xl px-6 py-4 w-32 h-20"></div>
        <div className="animate-pulse bg-gray-300/20 rounded-2xl px-6 py-4 w-32 h-20"></div>
      </div>
    );
  }

  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Gerçek zamanlı bağlantı aktif"></div>;
      case 'connecting':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Bağlanıyor..."></div>;
      case 'disconnected':
        return <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Bağlantı kesildi"></div>;
    }
  };

  return (
    <div className="mb-8">
      {/* Bağlantı durumu */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
          {getConnectionIndicator()}
           
        </div>
      </div>

      <div className="flex justify-center gap-8">
        <div className="bg-gradient-to-r from-blue-500/30 to-blue-600/30 
                        backdrop-blur-lg rounded-2xl px-6 py-4 border border-blue-300/40 shadow-xl relative">
          <h3 className="text-xl font-bold text-white mb-2 text-center">Okancan</h3>
          <div className="text-3xl font-bold text-blue-300 text-center">{scores.okan}</div>
          {isLoading && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-purple-500/30 to-purple-600/30 
                        backdrop-blur-lg rounded-2xl px-6 py-4 border border-purple-300/40 shadow-xl relative">
          <h3 className="text-xl font-bold text-white mb-2 text-center">Sevilay</h3>
          <div className="text-3xl font-bold text-purple-300 text-center">{scores.sevilay}</div>
          {isLoading && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stars, setStars] = useState<Star[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isGameEnabled, setIsGameEnabled] = useState(false);

  const [celebrationPlayer, setCelebrationPlayer] = useState<'okan' | 'sevilay' | null>(null);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [currentPhotoId, setCurrentPhotoId] = useState<number>(0);
  const { scores, addScore, isLoaded, isLoading, isPhotoUsed, connectionStatus, gameEnded, winner } = useServerScoreSystem();

  const handleNewPhotoAvailable = (isNew: boolean, photoId: number) => {
    // Her zaman mevcut fotoğraf ID'sini güncelle
    setCurrentPhotoId(photoId);
    
    // Sayfa yenilenmesi veya yeni fotoğraf - her durumda kontrol et
    if (!isPhotoUsed(photoId)) {
      setIsGameEnabled(true);
      console.log(`Fotoğraf ${photoId} - Butonlar aktif! (Yeni: ${isNew})`);
    } else {
      console.log(`Fotoğraf ${photoId} daha önce kullanıldı, butonlar gözükmeyecek`);
      setIsGameEnabled(false);
    }
  };

  const handlePlayerClick = async (player: 'okan' | 'sevilay') => {
    // Fotoğraf daha önce kullanıldıysa puan verme
    if (isPhotoUsed(currentPhotoId)) {
      console.log('Bu fotoğraftan zaten puan alındı!');
      setIsGameEnabled(false);
      return;
    }

    // HEMEN butonları kapat - tekrar tıklanamaz
    setIsGameEnabled(false);

    const currentHour = currentDate.getHours();
    const isBonusTime = currentHour >= 15 && currentHour < 19;
    const points = isBonusTime ? 10 : 5;
    
    // HEMEN bildirim göster (fotoğrafı kapatmayı beklemeden)
    setCelebrationPlayer(player);
    setCelebrationPoints(points);
    console.log(`${player} oyuncusu ${points} puan aldı! Butonlar kapandı.`);
    
    const success = await addScore(player, points, currentPhotoId);
    
    if (success) {
      // Bildirim zaten gösterildi, sadece timer başlat
      // PUAN BİLDİRİMİ SÜRESİ: 1500ms = 1.5 saniye (önceki sürenin yarısı)
      setTimeout(() => {
        setCelebrationPlayer(null);
        setCelebrationPoints(0);
      }, 1500);
    } else {
      console.log('Puan eklenemedi veya bu fotoğraftan zaten puan alındı');
      // Başarısızsa bildirimi kaldır
      setCelebrationPlayer(null);
      setCelebrationPoints(0);
    }
  };

  useEffect(() => {
    const newStars = Array.from({ length: 200 }).map((_, i) => ({
      key: `star-${i}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 12 + 6}px`,
      color: [
        '#db2777', '#be185d', '#a21caf', '#c2185b', 
        '#ad1457', '#880e4f', '#e91e63', '#c2185b',
        '#ad1457', '#880e4f', '#db2777', '#be185d'
      ][Math.floor(Math.random() * 12)],
      animationDelay: `${Math.random() * 15}s`,
      animationDuration: `${Math.random() * 8 + 4}s`,
      symbol: ['✦', '✧', '★', '♥', '♡', '✨', '⭐', '💖'][Math.floor(Math.random() * 8)],
      moveDistance: `${Math.random() * 30 + 10}px`
    }));
    setStars(newStars);

    const targetDate = new Date('2025-09-15T00:00:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
        setCurrentDate(new Date());
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Oyun bittiyse kazanan ekranını göster
  if (gameEnded) {
    return <WinnerScreen winner={winner} scores={scores} />;
  }

  return (
    <div className="min-h-screen relative font-sans antialiased overflow-hidden">
      
      <style>{`
        @keyframes floatStar {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1); 
            opacity: 0.4; 
          }
          25% { 
            transform: translate(20px, -25px) rotate(90deg) scale(1.3); 
            opacity: 0.9; 
          }
          50% { 
            transform: translate(-15px, -35px) rotate(180deg) scale(1.5); 
            opacity: 1; 
          }
          75% { 
            transform: translate(25px, -15px) rotate(270deg) scale(1.2); 
            opacity: 0.8; 
          }
        }
        
        @keyframes twinkleHeart {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(0.8) rotate(-10deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.4) rotate(10deg); 
          }
        }

        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes pulse-pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes modal-appear {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        @keyframes spin-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .enhanced-background {
          background: 
            radial-gradient(circle at 20% 80%, #be185d 0%, #db2777 40%, transparent 70%),
            radial-gradient(circle at 80% 20%, #db2777 0%, #be185d 40%, transparent 70%),
            radial-gradient(circle at 40% 40%, #a21caf 0%, #db2777 40%, transparent 70%),
            linear-gradient(135deg, #be185d, #db2777, #a21caf, #be185d, #db2777, #a21caf);
          background-size: 300% 300%, 400% 400%, 500% 500%, 400% 400%;
          animation: 
            background-shift 25s ease-in-out infinite,
            background-pulse 10s ease-in-out infinite alternate;
        }

        @keyframes background-shift {
          0%, 100% { 
            background-position: 0% 50%, 100% 50%, 50% 50%, 0% 100%; 
          }
          25% { 
            background-position: 50% 0%, 50% 100%, 100% 0%, 100% 0%; 
          }
          50% { 
            background-position: 100% 50%, 0% 50%, 0% 100%, 50% 50%; 
          }
          75% { 
            background-position: 50% 100%, 50% 0%, 50% 50%, 0% 0%; 
          }
        }

        @keyframes background-pulse {
          0% { filter: brightness(1) saturate(1.1); }
          100% { filter: brightness(1.05) saturate(1.2); }
        }
      `}</style>
      
      <div className="absolute inset-0 enhanced-background">
        {stars.map((star) => (
          <div
            key={star.key}
            className="absolute animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              fontSize: star.fontSize,
              color: star.color,
              animation: star.symbol === '♥' || star.symbol === '♡' || star.symbol === '💖' 
                ? `twinkleHeart ${star.animationDuration} infinite ease-in-out`
                : `floatStar ${star.animationDuration} infinite ease-in-out`,
              animationDelay: star.animationDelay,
            }}
          >
            {star.symbol}
          </div>
        ))}
      </div>
      
      <GameButtons 
        onPlayerClick={handlePlayerClick} 
        isVisible={isPhotoModalOpen && isGameEnabled}
        isPhotoUsed={isPhotoUsed(currentPhotoId)}
      />
      
      <CelebrationMessage player={celebrationPlayer} points={celebrationPoints} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        
        <div className="text-center mb-12 relative">
          <div className="flex items-center justify-center mb-6 relative">
            <span className="text-3xl text-pink-300 mr-4 animate-gentle-pulse">♥</span>
            
            <div className="relative">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-200 via-rose-300 to-pink-400 bg-clip-text text-transparent">
                BÜYÜK CONSTANTİNOPLE BULUŞMASI
              </h1>
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <PerfectStar size={16} className="text-yellow-300" style={{
                  animation: 'spin-clockwise 3s linear infinite'
                }} />
                <span className="text-pink-300 text-lg animate-gentle-pulse delay-500">✨</span>
                <PerfectStar size={16} className="text-yellow-300" style={{
                  animation: 'spin-clockwise 3s linear infinite',
                  animationDelay: '1s'
                }} />
              </div>
            </div>
            
            <span className="text-3xl text-pink-300 ml-4 animate-gentle-pulse delay-1500">♥</span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-medium text-white/95 mb-4">
            Seninle geçireceğimiz güzel anlar için geri sayım
          </h2>
        </div>

        <ScoreBoard 
          scores={scores} 
          isLoaded={isLoaded}
          isLoading={isLoading}
          connectionStatus={connectionStatus}
        />

        <div className="relative mb-10 w-full max-w-4xl">
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <RotatingTimeStar size={90} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
          {[
            { value: timeLeft.days, label: 'GÜN', symbol: '♥' },
            { value: timeLeft.hours, label: 'SAAT', symbol: '♡' },
            { value: timeLeft.minutes, label: 'DAKİKA', symbol: '♥' },
            { value: timeLeft.seconds, label: 'SANİYE', symbol: '♡' }
          ].map((item, index) => (
            <div
              key={item.label}
              className="relative group p-2"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/40 via-rose-500/40 to-pink-600/40 rounded-3xl blur-xl scale-110 opacity-70 group-hover:opacity-90 transition-all duration-700" />
              
              <div className="relative bg-gradient-to-br from-white/20 via-pink-100/15 to-rose-100/20 
                               backdrop-blur-xl rounded-3xl p-6 md:p-8 
                               border border-pink-300/40 shadow-2xl 
                               transform hover:scale-105 transition-all duration-700
                               hover:border-pink-200/60">
                <div 
                  className="absolute -top-3 -right-3 text-2xl text-pink-400 animate-gentle-pulse"
                  style={{ animationDelay: `${index * 0.5}s` }}
                >
                  {item.symbol}
                </div>
                
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-pink-200 via-rose-300 to-pink-400 bg-clip-text text-transparent mb-2 relative animate-pulse-pop">
                  {String(item.value).padStart(2, '0')}
                </div>
                
                <div className="text-white/95 font-semibold text-sm md:text-base tracking-wide uppercase">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        <DailyPhoto 
          date={currentDate} 
          onNewPhotoAvailable={handleNewPhotoAvailable}
          isOpen={isPhotoModalOpen}
          setIsOpen={setIsPhotoModalOpen}
        />

        <div className="mt-auto text-center text-white/70 text-sm md:text-base">
          <p>© 2025 Okan & Sevilay. Tüm hakları saklıdır.</p>
          <p>Bu sayfa, sevgi ve özenle hazırlandı. ❤️</p>
        </div>
      </div>
    </div>
  );
}
