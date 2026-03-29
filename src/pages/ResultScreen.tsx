import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { XpBar } from '@/components/XpBar';
import { toast } from 'sonner';
import { playVictory, playDefeat, playClick, playMusicVictory, playMusicDefeat } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';

export default function ResultScreen() {
  const navigate = useNavigate();
  const { result, xpEarned, myScore, opponentScore, countryCode, opponentCountry, xp, username, gameMode, reset } = useGameState();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (xpEarned > 0) localStorage.setItem('player_xp', String(xp));
    if (result === 'win') { playVictory(); playMusicVictory(); }
    else if (result === 'loss') { playDefeat(); playMusicDefeat(); }
    else { playMusicVictory(); }

    if (result && countryCode && countryCode !== 'UN') {
      const raw = localStorage.getItem('leaderboard_data');
      const lb: Record<string, { wins: number; losses: number }> = raw ? JSON.parse(raw) : {};
      if (!lb[countryCode]) lb[countryCode] = { wins: 0, losses: 0 };
      if (result === 'win') lb[countryCode].wins++;
      else if (result === 'loss') lb[countryCode].losses++;
      if (opponentCountry && opponentCountry !== 'UN') {
        if (!lb[opponentCountry]) lb[opponentCountry] = { wins: 0, losses: 0 };
        if (result === 'win') lb[opponentCountry].losses++;
        else if (result === 'loss') lb[opponentCountry].wins++;
      }
      localStorage.setItem('leaderboard_data', JSON.stringify(lb));
    }
  }, []);

  const resultConfig = {
    win: { emoji: '🏆', text: 'VICTORY', animClass: 'text-primary text-glow-cyan animate-victory-pulse font-display' },
    loss: { emoji: '💀', text: 'DEFEAT', animClass: 'text-destructive text-glow-red animate-defeat-fade font-display' },
    draw: { emoji: '🤝', text: 'DRAW', animClass: 'text-glow-gold text-glow-gold font-display' },
  };

  const config = result ? resultConfig[result] : resultConfig.draw;

  function handleRematch() { playClick(); reset(); navigate('/matchmaking'); }
  function handleNewOpponent() { playClick(); reset(); navigate('/'); }

  function handleShare() {
    playClick();
    const flag = (code: string) => {
      if (!code || code === 'UN') return '🌍';
      const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    };
    const resultEmoji = result === 'win' ? '🏆' : result === 'loss' ? '💀' : '🤝';
    const text = [
      `${resultEmoji} 1v1 Earth ${resultEmoji}`,
      '',
      `${flag(countryCode)} ${countryName(countryCode)} ${myScore} - ${opponentScore} ${countryName(opponentCountry)} ${flag(opponentCountry)}`,
      '',
      `Result: ${config.text}`,
      `XP earned: +${xpEarned}`,
      '',
      '🌍 Play at global-duel-quest.lovable.app',
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Result copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-[420px] mx-auto">
        {/* Dramatic result */}
        <div className="text-center mb-8 animate-dramatic-reveal">
          <span className="text-8xl mb-4 block">{config.emoji}</span>
          <h1 className={`text-5xl font-black tracking-[0.2em] ${config.animClass}`}>{config.text}</h1>
        </div>

        {/* Score card */}
        <div className="w-full glass-card-strong rounded-xl p-6 mb-4 shine-sweep">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <CountryFlag code={countryCode} size="lg" />
              <p className="text-[10px] text-primary/60 mt-1 font-display tracking-wider">{countryName(countryCode)}</p>
              <p className="text-3xl font-black font-mono mt-1 text-primary text-glow-cyan">{myScore}</p>
            </div>
            <div className="text-3xl font-display font-black text-primary/30">VS</div>
            <div className="text-center">
              <CountryFlag code={opponentCountry} size="lg" />
              <p className="text-[10px] text-primary/60 mt-1 font-display tracking-wider">{countryName(opponentCountry)}</p>
              <p className="text-3xl font-black font-mono mt-1 text-destructive text-glow-red">{opponentScore}</p>
            </div>
          </div>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full mb-6 glass-card rounded-xl py-3 text-primary/70 hover:text-primary transition-colors font-display text-sm tracking-widest"
        >
          {copied ? '✅ COPIED!' : '📋 SHARE RESULT'}
        </button>

        {/* XP bar */}
        <div className="w-full mb-8">
          <XpBar current={xp} gained={xpEarned} />
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button onClick={handleRematch} className="w-full h-14 text-lg font-display font-bold tracking-widest rounded-xl btn-epic text-primary-foreground">
            ⚔️ REMATCH
          </button>
          <button onClick={handleNewOpponent} className="w-full h-14 text-lg font-display font-bold tracking-widest rounded-xl glass-card-strong text-primary hover:box-glow-cyan transition-all">
            🌍 BACK TO HOME
          </button>
          <button onClick={() => { playClick(); navigate('/leaderboard'); }} className="w-full text-muted-foreground hover:text-primary transition-colors font-display text-sm tracking-widest py-2">
            🏆 LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
