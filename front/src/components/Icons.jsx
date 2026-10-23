// Icônes SVG inline (style trait, 24×24) — aucune dépendance externe.
const base = (props) => ({
  width: props.size || 18,
  height: props.size || 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: props.strokeWidth || 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: props.className,
});

export const Spark = (p) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.5l2.4 6.9 6.9 2.6-6.9 2.6L12 21.5l-2.4-6.9L2.7 12l6.9-2.6z" />
  </svg>
);
export const Mail = (p) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6 8.5-6" /></svg>);
export const Lock = (p) => (<svg {...base(p)}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 018 0v3" /></svg>);
export const Eye = (p) => (<svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>);
export const EyeOff = (p) => (<svg {...base(p)}><path d="M3 3l18 18" /><path d="M10.6 5.7A9.7 9.7 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3.2 3.9M6.2 6.9A16 16 0 002.5 12s3.5 6.5 9.5 6.5a9.4 9.4 0 004.3-1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></svg>);
export const Logout = (p) => (<svg {...base(p)}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></svg>);
export const Menu = (p) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const Close = (p) => (<svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const ArrowUp = (p) => (<svg {...base(p)}><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg>);
export const ArrowRight = (p) => (<svg {...base(p)}><path d="M5 12h14M13 5.5l6.5 6.5-6.5 6.5" /></svg>);
export const Plus = (p) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const Book = (p) => (<svg {...base(p)}><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" /><path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5" /></svg>);
export const Alert = (p) => (<svg {...base(p)}><path d="M12 3.5L2.5 20h19z" /><path d="M12 10v4.5M12 17.2v.1" /></svg>);
export const Ticket = (p) => (<svg {...base(p)}><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z" /><path d="M9 6v12" strokeDasharray="2 2.5" /></svg>);
export const Clock = (p) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const Hourglass = (p) => (<svg {...base(p)}><path d="M6.5 3h11M6.5 21h11M7.5 3c0 4.5 4.5 6 4.5 9s-4.5 4.5-4.5 9M16.5 3c0 4.5-4.5 6-4.5 9s4.5 4.5 4.5 9" /></svg>);
export const Check = (p) => (<svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const Wrench = (p) => (<svg {...base(p)}><path d="M14.5 6.5a4 4 0 005 5l-8.5 8.5a2.1 2.1 0 01-3-3l8.5-8.5a4 4 0 01-2-2z" /></svg>);
export const Chat = (p) => (<svg {...base(p)}><path d="M20.5 12a8 8 0 01-11.7 7.1L3.5 20.5l1.4-4.6A8 8 0 1120.5 12z" /></svg>);
export const Wifi = (p) => (<svg {...base(p)}><path d="M2.5 9a14 14 0 0119 0M5.5 12.5a9.5 9.5 0 0113 0M8.7 16a5 5 0 016.6 0" /><circle cx="12" cy="19.2" r=".6" fill="currentColor" /></svg>);
export const Printer = (p) => (<svg {...base(p)}><path d="M7 8V3.5h10V8" /><rect x="3.5" y="8" width="17" height="8.5" rx="2" /><path d="M7 14h10v6.5H7z" /></svg>);
export const Library = (p) => (<svg {...base(p)}><path d="M4 20.5h16M5.5 17.5v-8M10 17.5v-8M14 17.5v-8M18.5 17.5v-8M3.5 9.5L12 4l8.5 5.5z" /></svg>);
export const Pin = (p) => (<svg {...base(p)}><path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0113 0c0 5.3-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const Grid = (p) => (<svg {...base(p)}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>);
export const Refresh = (p) => (<svg {...base(p)}><path d="M20 11.5A8 8 0 006.3 6.3L4 8.5M4 4v4.5h4.5M4 12.5a8 8 0 0013.7 5.2L20 15.5M20 20v-4.5h-4.5" /></svg>);
