import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { countryToFlag } from '@/lib/country';
import { playClick } from '@/lib/sounds';
import { Input } from '@/components/ui/input';
import { SpaceBackground } from '@/components/SpaceBackground';

const AVATAR_OPTIONS = [
  { emoji: '⚔️', label: 'Warrior' }, { emoji: '🥷', label: 'Ninja' },
  { emoji: '🤖', label: 'Robot' }, { emoji: '👽', label: 'Alien' },
  { emoji: '👑', label: 'Crown' }, { emoji: '🔥', label: 'Fire' },
  { emoji: '🐉', label: 'Dragon' }, { emoji: '⭐', label: 'Star' },
  { emoji: '🌍', label: 'Globe' }, { emoji: '⚡', label: 'Lightning' },
  { emoji: '🛡️', label: 'Shield' }, { emoji: '🚀', label: 'Rocket' },
];

const ALL_COUNTRIES: { code: string; name: string }[] = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' }, { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' }, { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia' },
  { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' }, { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' }, { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' }, { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LY', name: 'Libya' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MG', name: 'Madagascar' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' }, { code: 'MX', name: 'Mexico' }, { code: 'MD', name: 'Moldova' },
  { code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' },
  { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'KP', name: 'North Korea' }, { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' }, { code: 'PA', name: 'Panama' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' },
  { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
  { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' }, { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'UAE' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' },
];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username, countryCode, xp } = useGameState();

  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('player_avatar') || '🌍');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(username);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const level = Math.floor(xp / 200) + 1;
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard_data') || '{}');
  const myStats = leaderboard[countryCode] || { wins: 0, losses: 0 };

  const currentCountryName = ALL_COUNTRIES.find(c => c.code === countryCode)?.name || countryCode;

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const q = countrySearch.toLowerCase();
    return ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [countrySearch]);

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

  function selectCountry(code: string) {
    playClick();
    useGameState.setState({ countryCode: code });
    localStorage.setItem('player_country', code);
    setShowCountryPicker(false);
    setCountrySearch('');
  }

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex flex-col items-center px-4 py-6 max-w-[420px] mx-auto">
        {/* Back button */}
        <div className="w-full flex items-center mb-6">
          <button onClick={() => { playClick(); navigate('/'); }} className="text-primary/70 hover:text-primary transition-colors font-display text-sm tracking-widest">
            ← BACK
          </button>
        </div>

        {/* Large Avatar with energy ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-energy-ring" style={{ border: '2px solid rgba(0, 245, 255, 0.3)' }} />
          <div className="w-28 h-28 rounded-full glass-card-strong flex items-center justify-center text-6xl box-glow-cyan">
            {selectedAvatar}
          </div>
        </div>

        {/* Username */}
        <div className="flex items-center gap-2 mb-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={20}
                className="w-40 h-8 text-center text-sm bg-muted border-primary/30"
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
              />
              <button onClick={saveName} className="btn-epic px-3 py-1 rounded-lg text-xs font-display text-primary-foreground">SAVE</button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-glow-cyan">{username}</h2>
              <button onClick={() => { setNewName(username); setEditingName(true); }} className="text-muted-foreground hover:text-primary transition-colors">
                ✏️
              </button>
            </>
          )}
        </div>

        {/* Country */}
        <div className="flex flex-col items-center gap-1 mb-6">
          <div className="flex items-center gap-2 text-primary/70 text-sm">
            <span className="text-lg">{countryToFlag(countryCode)}</span>
            <span className="font-display tracking-wider">{currentCountryName}</span>
          </div>
          <button
            onClick={() => { playClick(); setShowCountryPicker(!showCountryPicker); }}
            className="text-xs px-3 py-1 rounded-lg glass-card text-primary/70 hover:text-primary transition-colors font-display tracking-wider mt-1"
          >
            🌍 CHANGE COUNTRY
          </button>
        </div>

        {/* Country Picker */}
        {showCountryPicker && (
          <div className="w-full rounded-xl glass-card-strong p-4 mb-6">
            <Input
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="Search country..."
              className="mb-3 h-9 text-sm bg-muted border-primary/20"
              autoFocus
            />
            <div className="max-h-[240px] overflow-y-auto space-y-1">
              {filteredCountries.map(({ code, name }) => (
                <button
                  key={code}
                  onClick={() => selectCountry(code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    code === countryCode
                      ? 'glass-card-strong text-primary box-glow-cyan'
                      : 'hover:bg-primary/5'
                  }`}
                >
                  <span className="text-lg">{countryToFlag(code)}</span>
                  <span className="flex-1">{name}</span>
                  {code === countryCode && <span className="text-primary text-xs">✓</span>}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No countries found</p>
              )}
            </div>
          </div>
        )}

        {/* Avatar Selection */}
        <div className="w-full rounded-xl glass-card-strong p-4 mb-6 shine-sweep">
          <h3 className="text-xs font-display text-primary/60 mb-3 tracking-[0.2em]">CHOOSE AVATAR</h3>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_OPTIONS.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => selectAvatar(emoji)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  selectedAvatar === emoji
                    ? 'glass-card-strong box-glow-cyan scale-105 text-primary'
                    : 'bg-muted/30 hover:bg-muted/50 hover:scale-105'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-muted-foreground font-display tracking-wider">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="w-full rounded-xl glass-card-strong p-4 shine-sweep">
          <h3 className="text-xs font-display text-primary/60 mb-3 tracking-[0.2em]">STATS</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="LEVEL" value={level} />
            <StatBox label="XP" value={xp} />
            <StatBox label="WINS" value={myStats.wins || 0} glow="cyan" />
            <StatBox label="LOSSES" value={myStats.losses || 0} glow="red" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, glow }: { label: string; value: number; glow?: string }) {
  const glowClass = glow === 'cyan' ? 'text-primary text-glow-cyan' : glow === 'red' ? 'text-destructive text-glow-red' : 'text-foreground';
  return (
    <div className="glass-card rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold font-mono ${glowClass}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground font-display tracking-[0.15em]">{label}</p>
    </div>
  );
}
