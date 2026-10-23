const PATHS = {
  add: <><path d="M12 5v14M5 12h14" /></>,
  tickets: <><path d="M6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  assistant: <><path d="m12 3 .9 3.1A7 7 0 0 0 17.8 11L21 12l-3.2 1a7 7 0 0 0-4.9 4.9L12 21l-.9-3.1A7 7 0 0 0 6.2 13L3 12l3.2-1a7 7 0 0 0 4.9-4.9L12 3Z" /></>,
  dashboard: <><rect x="4" y="4" width="6" height="7" rx="1.5" /><rect x="14" y="4" width="6" height="4" rx="1.5" /><rect x="4" y="15" width="6" height="5" rx="1.5" /><rect x="14" y="12" width="6" height="8" rx="1.5" /></>,
  logout: <><path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10" /><path d="m15 8 4 4-4 4M9 12h10" /></>,
  arrow: <><path d="M5 12h14M15 8l4 4-4 4" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name] || PATHS.tickets}
    </svg>
  );
}
