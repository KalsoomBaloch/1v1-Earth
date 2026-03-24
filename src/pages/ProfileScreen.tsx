import { useState, useMemo } from 'react';
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

  const [selectedAvatar, setSelectedAvatar] = useState(
    () => localStorage.getItem('player_avatar') || '🌍'
  );
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(username);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const level = Math.floor(xp / 200) + 1;
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard_data') || '{}');
  const myStats = leaderboard[countryCode] || { wins: 0, losses: 0 };
  const totalWins = myStats.wins || 0;
  const totalLosses = myStats.losses || 0;

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
        <div className="flex flex-col items-center gap-1 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="text-lg">{countryToFlag(countryCode)}</span>
            <span>{currentCountryName}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { playClick(); setShowCountryPicker(!showCountryPicker); }}
            className="text-xs h-7 px-3 mt-1"
          >
            🌍 Change Country
          </Button>
        </div>

        {/* Country Picker */}
        {showCountryPicker && (
          <div className="w-full rounded-xl bg-card border border-border p-4 mb-6 animate-in fade-in slide-in-from-top-2">
            <Input
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="Search country..."
              className="mb-3 h-9 text-sm"
              autoFocus
            />
            <div className="max-h-[240px] overflow-y-auto space-y-1">
              {filteredCountries.map(({ code, name }) => (
                <button
                  key={code}
                  onClick={() => selectCountry(code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    code === countryCode
                      ? 'bg-primary/20 border border-primary'
                      : 'hover:bg-secondary/80'
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
