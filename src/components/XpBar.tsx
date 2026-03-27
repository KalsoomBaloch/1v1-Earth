interface XpBarProps {
  current: number;
  gained: number;
}

export function XpBar({ current, gained }: XpBarProps) {
  const level = Math.floor(current / 200) + 1;
  const xpInLevel = current % 200;
  const progress = (xpInLevel / 200) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-primary/60 font-display tracking-wider">LVL {level}</span>
        <span className="text-primary font-mono text-glow-cyan">+{gained} XP</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(var(--glow-cyan)), hsl(var(--glow-blue)))',
            boxShadow: '0 0 10px rgba(0, 245, 255, 0.5)',
          }}
        />
      </div>
      <div className="text-xs text-primary/50 text-right font-mono">
        {xpInLevel}/200 XP
      </div>
    </div>
  );
}
