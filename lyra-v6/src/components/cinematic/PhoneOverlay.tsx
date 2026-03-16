'use client';

import { useVapi } from '@/hooks/useVapi';
import { useLyraStore } from '@/store/useLyraStore';
import { clsx } from 'clsx';

export function PhoneOverlay() {
  const phoneProgress = useLyraStore((state) => state.phoneProgress);
  const phoneState = useLyraStore((state) => state.phoneState);
  const { toggleCall, isVapiConnected } = useVapi();
  const isVisible = phoneState !== 'hidden';
  const isFullscreen = phoneProgress > 0.9;

  const renderScreen = () => {
    switch (phoneState) {
      case 'ig':
        return (
          <div className="ig-screen">
            <div className="ig-header"><span className="ig-header-logo">Instagram</span></div>
            <div className="ig-post">
              <div className="ig-post-header">
                <div className="ig-avatar" />
                <div className="ig-username">selin_vibe</div>
              </div>
              <div className="ig-post-image">🌫️</div>
              <div className="ig-actions">
                <span className="ig-action-btn">❤️</span>
                <span className="ig-action-btn">💬</span>
              </div>
              <div className="ig-likes">2.104 beğeni</div>
              <div className="ig-caption"><b>selin_vibe</b> Her şey çok güzel... ✨</div>
            </div>
          </div>
        );
      case 'ig_comments':
        return (
          <div className="ig-screen">
            <div className="ig-header"><span className="ig-header-logo">Instagram</span></div>
            <div className="ig-post">
              {/* Post content */}
            </div>
            <div className="ig-comments-section">
                <div className="ig-comment"><span className="comment-user">user_88:</span><span className="comment-text">Harika!</span></div>
                <div className="ig-comment negative"><span className="comment-user">hater_01:</span><span className="comment-text">Yine mi sahte pozlar? 🙄</span></div>
                <div className="ig-comment negative"><span className="comment-user">troll_king:</span><span className="comment-text">Aslında ne kadar yalnızsın.</span></div>
            </div>
          </div>
        );
      case 'ig_negative':
        return (
            <div className="ig-screen">
                <div className="ig-header"><span className="ig-header-logo">Yorumlar</span></div>
                <div className="ig-comments-section !pt-10">
                    <div className="ig-comment negative !text-lg !opacity-100"><span className="comment-text">BOŞLUKTA KAYBOLUYORSUN...</span></div>
                    <div className="ig-comment negative !text-2xl mt-8 !opacity-100"><span className="comment-text !text-red-600 !font-black">KİMSE SENİ ANLAMIYOR.</span></div>
                </div>
            </div>
        );
      case 'lyra_ad':
        return (
            <div className="ig-screen">
                <div className="ig-header"><span className="ig-header-logo">Instagram</span></div>
                <div className="ig-ad">
                    <div className="ig-ad-label">Sponsorlu</div>
                    <div className="ig-ad-title">Lyra AI</div>
                    <div className="ig-ad-desc">Karanlığın ortasında seni gerçekten dinleyen biri var.</div>
                    <div className="ig-ad-cta">Keşfet →</div>
                </div>
            </div>
        );
      case 'appstore':
        return (
            <div className="appstore-screen">
                <div className="appstore-search"><span className="appstore-search-text">Lyra AI</span></div>
                <div className="appstore-app">
                    <div className="appstore-app-icon">L</div>
                    <div className="appstore-app-info">
                        <div className="appstore-app-name">Lyra: AI Companion</div>
                        <div className="appstore-app-category">Health & Fitness</div>
                    </div>
                    <button className="appstore-get-btn downloading">YÜKLENİYOR</button>
                </div>
            </div>
        );
      case 'app_open':
        return (
            <div className="appstore-screen">
                <div className="appstore-app !mt-10">
                    <div className="appstore-app-icon">L</div>
                    <div className="appstore-app-info"><div className="appstore-app-name">Lyra</div></div>
                    <button 
                      className={clsx("appstore-get-btn", isVapiConnected ? "open bg-red-500!" : "open")} 
                      onClick={toggleCall}
                    >
                      {isVapiConnected ? 'DURDUR' : 'KONUŞ'}
                    </button>
                </div>
                <div className="text-[#7C6FFF] text-center mt-10 text-[10px] tracking-[2px]">NEURAL_LINK_ACTIVE</div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="phone-overlay">
      <div 
        className={clsx(
          "phone-frame",
          isVisible && "visible",
          isFullscreen && "fullscreen"
        )}
        style={{
          transform: isFullscreen ? 'scale(1)' : `scale(${0.8 + phoneProgress * 0.4})`
        }}
      >
        <div className="phone-notch" />
        <div className="phone-screen">
          {renderScreen()}
        </div>
        <div className="phone-home-bar" />
      </div>
    </div>
  );
}
