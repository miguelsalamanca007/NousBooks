interface Props {
  className?: string;
}

/** Open-book SVG icon used across the app (Navbar, dashboard columns, auth pages). */
export default function BookIcon({ className = "h-6 w-6" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H12v20H4.5A2.5 2.5 0 0 1 2 19.5z" />
      <path d="M12 2h7.5A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5H12z" />
      <line x1="5.5" y1="8" x2="9.5" y2="8" />
      <line x1="5.5" y1="11" x2="9.5" y2="11" />
      <line x1="5.5" y1="14" x2="9.5" y2="14" />
      <line x1="14.5" y1="8" x2="18.5" y2="8" />
      <line x1="14.5" y1="11" x2="18.5" y2="11" />
      <line x1="14.5" y1="14" x2="18.5" y2="14" />
    </svg>
  );
}
