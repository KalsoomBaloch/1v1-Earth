import { countryToFlag } from '@/lib/country';

interface CountryFlagProps {
  code: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
};

export function CountryFlag({ code, size = 'md', className = '' }: CountryFlagProps) {
  return (
    <span className={`${sizes[size]} leading-none ${className}`} role="img" aria-label={code}>
      {countryToFlag(code)}
    </span>
  );
}
