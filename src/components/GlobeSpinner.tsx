export function GlobeSpinner() {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 animate-spin-slow" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/20 to-transparent animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-7xl animate-float">🌍</span>
      </div>
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse-slow" />
    </div>
  );
}
