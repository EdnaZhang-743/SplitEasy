export default function Logo() {
  return (
    <div className="logo">
      <svg
        className="logo__icon"
        viewBox="0 0 64 64"
        width="40"
        height="40"
        aria-hidden="true"
      >
        <circle cx="20" cy="32" r="11" fill="var(--color-accent)" />
        <line
          x1="31"
          y1="32"
          x2="42"
          y2="32"
          stroke="var(--color-accent)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M37 24 L46 32 L37 40"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="48"
          cy="32"
          r="11"
          fill="var(--color-accent-soft)"
          stroke="var(--color-accent)"
          strokeWidth="3"
        />
      </svg>
      <span className="logo__text">SplitEasy</span>
    </div>
  );
}
