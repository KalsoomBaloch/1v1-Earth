import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { countryToFlag } from '@/lib/country';
import { playClick } from '@/lib/sounds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpaceBackground } from '@/components/SpaceBackground';

const AVATAR_OPTIONS = [
  { emoji: '⚔️', label: 'Warrior' },
  { emoji: '🥷', label: 'Ninja' },
  { emoji: '🤖', label: 'Robot' },
  { emoji: '👽', label: 'Alien' },
  { emoji: '👑', label: 'Crown' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🐉', label: 'Dragon' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🌍', label: 'Globe' },
  { emoji: '⚡', label: 'Lightning' },
  { emoji: '🛡️', label: 'Shield' },
  { emoji: '🚀', label: 'Rocket' },
];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username, countryCode, xp } = useGameState();

  const [selectedAvatar, setSelectedAvatar] = useState(
    () => localStorage.getItem('player_avatar') || '🌍'
  );
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(username);

  const level = Math.floor(xp / 200) + 1;
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard_data') || '{}');
  const myStats = leaderboard[countryCode] || { wins: 0, losses: 0 };
  const totalWins = myStats.wins || 0;
  const totalLosses = myStats.losses || 0;

  const countryName = getCountryName(countryCode);

  function selectAvatar(emoji: string) {
    playClick();
    setSelectedAvatar(emoji);
    localStorage.setItem('player_avatar', emoji);
  }

  function saveName() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    useGameState.setState({ username: trimmed });
    localStorage.setItem('player_name', trimmed);
    setEditingName(false);
  }

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex flex-col items-center px-4 py-6 max-w-[420px] mx-auto">
        {/* Back button */}
        <div className="w-full flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => { playClick(); navigate('/'); }}>
            ← Back
          </Button>
        </div>

        {/* Large Avatar */}
        <div className="w-24 h-24 rounded-full bg-card border-2 border-primary flex items-center justify-center text-5xl mb-4 box-glow-blue">
          {selectedAvatar}
        </div>

        {/* Username */}
        <div className="flex items-center gap-2 mb-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={20}
                className="w-40 h-8 text-center text-sm"
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
              />
              <Button size="sm" onClick={saveName} className="h-8 text-xs">Save</Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold">{username}</h2>
              <button onClick={() => { setNewName(username); setEditingName(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                ✏️
              </button>
            </>
          )}
        </div>

        {/* Country */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
          <span className="text-lg">{countryToFlag(countryCode)}</span>
          <span>{countryName}</span>
        </div>

        {/* Avatar Selection */}
        <div className="w-full rounded-xl bg-card border border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Choose Avatar</h3>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_OPTIONS.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => selectAvatar(emoji)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  selectedAvatar === emoji
                    ? 'bg-primary/20 border border-primary box-glow-blue scale-105'
                    : 'bg-secondary/50 border border-transparent hover:bg-secondary hover:scale-105'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="w-full rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Level" value={level} />
            <StatBox label="XP" value={xp} />
            <StatBox label="Total Wins" value={totalWins} color="text-green-400" />
            <StatBox label="Total Losses" value={totalLosses} color="text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold font-mono ${color || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function getCountryName(code: string): string {
  const map: Record<string, string> = {
    AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AR: 'Argentina', AU: 'Australia',
    AT: 'Austria', BD: 'Bangladesh', BE: 'Belgium', BR: 'Brazil', CA: 'Canada',
    CL: 'Chile', CN: 'China', CO: 'Colombia', HR: 'Croatia', CZ: 'Czech Republic',
    DK: 'Denmark', EG: 'Egypt', FI: 'Finland', FR: 'France', DE: 'Germany',
    GH: 'Ghana', GR: 'Greece', HU: 'Hungary', IN: 'India', ID: 'Indonesia',
    IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IL: 'Israel', IT: 'Italy',
    JP: 'Japan', KE: 'Kenya', KR: 'South Korea', MY: 'Malaysia', MX: 'Mexico',
    MA: 'Morocco', NL: 'Netherlands', NZ: 'New Zealand', NG: 'Nigeria', NO: 'Norway',
    PK: 'Pakistan', PE: 'Peru', PH: 'Philippines', PL: 'Poland', PT: 'Portugal',
    RO: 'Romania', RU: 'Russia', SA: 'Saudi Arabia', SG: 'Singapore', ZA: 'South Africa',
    ES: 'Spain', SE: 'Sweden', CH: 'Switzerland', TH: 'Thailand', TR: 'Turkey',
    UA: 'Ukraine', AE: 'UAE', GB: 'United Kingdom', US: 'United States', VN: 'Vietnam',
    UN: 'Unknown',
  };
  return map[code] || code;
}
