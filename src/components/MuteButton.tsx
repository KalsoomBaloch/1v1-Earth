import { useState } from 'react';
import { isMuted, toggleMute, stopBgMusic } from '@/lib/sounds';

export function MuteButton() {
  const [mute, setMute] = useState(isMuted());

  function handleToggle() {
    const newMuted = toggleMute();
    setMute(newMuted);
    if (newMuted) stopBgMusic();
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-lg hover:bg-accent transition-colors"
      title={mute ? 'Unmute' : 'Mute'}
    >
      {mute ? '🔇' : '🔊'}
    </button>
  );
}
