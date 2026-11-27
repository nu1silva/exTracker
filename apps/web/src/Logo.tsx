/** The exTracker mark and name, from parts/app-nav.js. */
export function Logo() {
  return (
    <>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect width="30" height="30" rx="8" fill="var(--mark)" />
        <path d="M6 12h4v10H6zM13 12h4V6h-4zM13 12h4v4h-4zM20 12h4v7h-4z" fill="var(--on-mark)" />
        <path d="M5 12h20" stroke="var(--on-mark)" strokeWidth="1.5" />
      </svg>
      <span className="brand-name">exTracker</span>
    </>
  );
}
