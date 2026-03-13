import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectCountry } from '@/lib/country';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { playerId, countryCode, xp, username, setPlayer } = useGameState();
  const [loading, setLoading] = useState(true);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 500) + 100);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    initPlayer();
  }, []);

  async function initPlayer() {
    try {
      const existing = useGameState.getState();
      if (existing.playerId) {
        setLoading(false);
        return;
      }

      const country = await detectCountry();
      const id = crypto.randomUUID();
      const savedName = localStorage.getItem('gdq_username');
      const name = savedName || `Player_${id.slice(0, 4)}`;
      setPlayer({
        playerId: id,
        userId: id,
        countryCode: country,
        username: name,
        xp: Number(localStorage.getItem('gdq_xp') || '0'),
      });
    } catch (e) {
      console.error('Init failed:', e);
      const id = crypto.randomUUID();
      setPlayer({ playerId: id, userId: id, countryCode: 'UN', username: `Player_${id.slice(0, 4)}`, xp: 0 });
    } finally {
      setLoading(false);
    }
  }

  function handleFindOpponent() {
    if (!playerId) return;
    navigate('/matchmaking');
  }

  function openNameDialog() {
    setNewName(username);
    setNameDialogOpen(true);
  }

  function saveName() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    useGameState.setState({ username: trimmed });
    localStorage.setItem('gdq_username', trimmed);
    setNameDialogOpen(false);
  }

  const level = Math.floor(xp / 200) + 1;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <span className="text-6xl animate-float inline-block">🌍</span>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-[420px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-glow-blue mb-2 tracking-tight">1v1 Earth</h1>
        <p className="text-muted-foreground text-sm">Global Trivia Duels</p>
      </div>

      <div className="w-full rounded-xl bg-card border border-border p-6 mb-6 box-glow-blue">
        <div className="flex items-center gap-4">
          <CountryFlag code={countryCode} size="lg" />
          <div className="flex-1">
            <p className="text-lg font-semibold">{username}</p>
            <p className="text-sm text-muted-foreground font-mono">Level {level} • {xp} XP</p>
          </div>
          <Button variant="ghost" size="sm" onClick={openNameDialog} className="text-xs text-muted-foreground hover:text-foreground">
            ✏️ Name
          </Button>
        </div>
      </div>

      <Button
        onClick={handleFindOpponent}
        disabled={!playerId}
        className="w-full h-16 text-xl font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] box-glow-blue"
      >
        ⚔️ Find Opponent
      </Button>

      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-glow-green animate-pulse" />
        <span className="font-mono">{onlineCount} players online</span>
      </div>

      <div className="mt-8 flex gap-4">
        <Button variant="ghost" onClick={() => navigate('/leaderboard')} className="text-muted-foreground hover:text-foreground">
          🏆 Leaderboard
        </Button>
      </div>

      {/* Change Name Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Change Name</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={20}
            placeholder="Enter your name"
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={saveName} className="w-full">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
