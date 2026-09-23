export function LogoMark({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ln-mark-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0b1120" />
        </linearGradient>
        <linearGradient id="ln-mark-accent" x1="12" y1="18" x2="52" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#ln-mark-bg)" />
      <rect x="12" y="18" width="40" height="28" rx="9" fill="none" stroke="url(#ln-mark-accent)" strokeWidth="3.5" />
      <rect x="19" y="26" width="10" height="12" rx="3" fill="url(#ln-mark-accent)" />
      <rect x="32.5" y="28.5" width="12" height="3.5" rx="1.75" fill="#e2e8f0" />
      <rect x="32.5" y="33.5" width="8" height="3" rx="1.5" fill="#64748b" />
      <g fill="#22d3ee">
        <rect x="8" y="14" width="8" height="8" rx="2.5" />
        <rect x="48" y="14" width="8" height="8" rx="2.5" />
        <rect x="8" y="42" width="8" height="8" rx="2.5" />
        <rect x="48" y="42" width="8" height="8" rx="2.5" />
      </g>
    </svg>
  )
}
