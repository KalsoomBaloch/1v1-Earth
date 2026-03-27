export function GlobeSpinner() {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <div className="absolute inset-0 rounded-full animate-spin-slow" style={{
        background: 'conic-gradient(from 0deg, transparent, rgba(0, 245, 255, 0.2), transparent)',
      }} />
      <div className="absolute inset-2 rounded-full animate-spin-slow" style={{
        animationDirection: 'reverse',
        animationDuration: '15s',
        background: 'conic-gradient(from 180deg, transparent, rgba(0, 128, 255, 0.15), transparent)',
      }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-7xl animate-float">🌍</span>
      </div>
      <div className="absolute inset-0 rounded-full animate-pulse-glow" />
    </div>
  );
}
