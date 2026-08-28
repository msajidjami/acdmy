'use client';

import { useState, useEffect, useRef, TouchEvent, MouseEvent } from 'react';

// Type for floating "سبحان اللہ" texts
interface FloatingText {
  id: number;
  x: number;
  y: number;
}

export default function TelegramMiniApp() {
  const [coins, setCoins] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAdReady, setIsAdReady] = useState<boolean>(false);
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Refs for style injection (to avoid duplicates)
  const styleInjected = useRef<boolean>(false);

  // Inject keyframe animation once on client
  useEffect(() => {
    if (!styleInjected.current && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0px) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
      `;
      document.head.appendChild(style);
      styleInjected.current = true;
    }
  }, []);

  // 60-second timer logic
  useEffect(() => {
    if (timeLeft > 0 && !isAdReady) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAdReady) {
      setIsAdReady(true);
    }
  }, [timeLeft, isAdReady]);

  // Handle tap (click or touch)
  const handleTap = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // prevent zoom or scroll on mobile

    // Increase coins
    setCoins((prev) => prev + 1);

    // Get tap position relative to the tapped element
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newText: FloatingText = { id: Date.now(), x, y };
    setFloatingTexts((prev) => [...prev, newText]);

    // Remove floating text after 1 second
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((text) => text.id !== newText.id));
    }, 1000);
  };

  // Watch ad handler
  const handleWatchAd = () => {
    if (!isAdReady || isWatchingAd) return;

    setIsWatchingAd(true);
    setIsAdReady(false);

    // Simulate ad watching (5 seconds)
    setTimeout(() => {
      setIsWatchingAd(false);
      setCoins((prev) => prev + 50);
      setTimeLeft(60);
      alert('🎉 ایڈ مکمل! آپ کو 50 سکے مل گئے ہیں۔');
    }, 5000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tap & Earn (Islamic) 🕌</h1>

      <div style={styles.balanceCard}>
        <h2>آپ کے سکے 🪙</h2>
        <p style={styles.coinText}>{coins}</p>
      </div>

      {/* Tap Area */}
      <div
        style={styles.tapArea}
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        <div style={styles.tapCircle}>👇 یہاں ٹیپ کریں</div>

        {/* Floating "سبحان اللہ" texts */}
        {floatingTexts.map((text) => (
          <div
            key={text.id}
            style={{
              ...styles.floatingText,
              left: text.x,
              top: text.y - 40,
            }}
          >
            سبحان اللہ
          </div>
        ))}
      </div>

      {/* Ad section */}
      <div style={styles.adSection}>
        {isWatchingAd ? (
          <p style={styles.loading}>ویڈیو ایڈ چل رہا ہے... 📺</p>
        ) : isAdReady ? (
          <button onClick={handleWatchAd} style={styles.adButton}>
            ▶️ ویڈیو ایڈ دیکھیں (+50 سکے)
          </button>
        ) : (
          <p style={styles.timerText}>اگلا ایڈ {timeLeft} سیکنڈ میں تیار ہوگا ⏳</p>
        )}
      </div>
    </div>
  );
}

// Styles object with proper TypeScript typing (optional but clean)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Jameel Noori Nastaleeq, sans-serif',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#12232E',
    color: '#fff',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  title: {
    color: '#4CAF50',
  },
  balanceCard: {
    backgroundColor: '#203647',
    padding: '15px',
    borderRadius: '15px',
    margin: '20px auto',
    width: '80%',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  },
  coinText: {
    fontSize: '45px',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#FFD700',
  },
  tapArea: {
    position: 'relative',
    width: '250px',
    height: '250px',
    margin: '30px auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  tapCircle: {
    width: '200px',
    height: '200px',
    backgroundColor: '#007CC7',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 8px 15px rgba(0, 124, 199, 0.4)',
    transition: 'transform 0.1s',
  },
  floatingText: {
    position: 'absolute',
    fontSize: '28px',
    color: '#4CAF50',
    fontWeight: 'bold',
    pointerEvents: 'none',
    animation: 'floatUp 1s ease-out forwards',
    textShadow: '1px 1px 2px black',
  },
  adSection: {
    marginTop: '30px',
  },
  adButton: {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  timerText: {
    fontSize: '18px',
    color: '#EE4C7C',
  },
  loading: {
    fontSize: '20px',
    color: '#fff',
  },
};