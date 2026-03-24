import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { XpBar } from '@/components/XpBar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { playVictory, playDefeat, playClick, playMusicVictory, playMusicDefeat } from '@/lib/sounds';

export default function ResultScreen() {
  const navigate = useNavigate();
  const { result, xpEarned, myScore, opponentScore, countryCode, opponentCountry, xp, username, reset } = useGameState();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (xpEarned > 0) {
      localStorage.setItem('player_xp', String(xp));
    }
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
    win: { emoji: '🏆', text: 'Victory!', color: 'text-glow-green text-glow-green' },
    loss: { emoji: '😞', text: 'Defeat', color: 'text-destructive' },
    draw: { emoji: '🤝', text: 'Draw!', color: 'text-glow-gold text-glow-gold' },
  };

  const config = result ? resultConfig[result] : resultConfig.draw;

  function handleRematch() {
    playClick();
    reset();
    navigate('/matchmaking');
  }

  function handleNewOpponent() {
    playClick();
    reset();
    navigate('/');
  }

  function handleShare() {
    playClick();
    const flag = (code: string) => {
      if (!code || code === 'UN') return '🌍';
      const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    };

    const resultEmoji = result === 'win' ? '🏆' : result === 'loss' ? '😞' : '🤝';
    const text = [
      `${resultEmoji} Global Duel Quest ${resultEmoji}`,
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-[420px] mx-auto">
      <div className="text-center mb-8">
        <span className="text-7xl mb-4 block">{config.emoji}</span>
        <h1 className={`text-4xl font-bold ${config.color}`}>{config.text}</h1>
      </div>

      <div className="w-full bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <CountryFlag code={countryCode} size="lg" />
            <p className="text-xs text-muted-foreground mt-1">{countryName(countryCode)}</p>
            <p className="text-2xl font-bold font-mono mt-1">{myScore}</p>
          </div>
          <div className="text-3xl text-muted-foreground font-bold">vs</div>
          <div className="text-center">
            <CountryFlag code={opponentCountry} size="lg" />
            <p className="text-xs text-muted-foreground mt-1">{countryName(opponentCountry)}</p>
            <p className="text-2xl font-bold font-mono mt-1">{opponentScore}</p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleShare}
        className="w-full mb-6 border-border text-muted-foreground hover:text-foreground"
      >
        {copied ? '✅ Copied!' : '📋 Share Result'}
      </Button>

      <div className="w-full mb-8">
        <XpBar current={xp} gained={xpEarned} />
      </div>

      <div className="w-full space-y-3">
        <Button onClick={handleRematch} className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground box-glow-blue">
          ⚔️ Rematch
        </Button>
        <Button onClick={handleNewOpponent} variant="secondary" className="w-full h-14 text-lg font-bold">
          🌍 Find New Opponent
        </Button>
        <Button variant="ghost" onClick={() => { playClick(); navigate('/leaderboard'); }} className="w-full text-muted-foreground">
          🏆 Leaderboard
        </Button>
      </div>
    </div>
  );
}
