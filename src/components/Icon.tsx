'use client';

interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}

export default function Icon({
  name,
  size = 24,
  filled = false,
  className = '',
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
}
