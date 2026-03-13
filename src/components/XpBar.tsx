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
        <span className="text-muted-foreground font-mono">LVL {level}</span>
        <span className="text-primary font-mono">+{gained} XP</span>
      </div>
      <div className="h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-glow-green transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-right font-mono">
        {xpInLevel}/200 XP
      </div>
    </div>
  );
}
