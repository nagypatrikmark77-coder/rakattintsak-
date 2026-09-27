import type { ReactNode } from "react";

export type IconName =
  | "shield"
  | "search"
  | "family"
  | "help"
  | "arrow"
  | "back"
  | "image"
  | "lock"
  | "message"
  | "check"
  | "alert"
  | "close"
  | "book"
  | "bell"
  | "volume"
  | "plus"
  | "send";

const paths: Record<IconName, ReactNode> = {
  shield: (
    <>
      <path d="M12 3 4.5 6v5c0 4.5 3 7.5 7.5 10 4.5-2.5 7.5-5.5 7.5-10V6L12 3Z" />
      <path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3M12 16h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5M8 10.5l1.7 1.7 3.3-3.4" />
    </>
  ),
  family: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3M12 16h.01" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  send: <path d="M12 19V5m-6 6 6-6 6 6" />,
  back: <path d="M19 12H5m5-5-5 5 5 5" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m21 15-6-6L3 21" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  message: (
    <path d="M7 4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-6l-6 3v-4a4 4 0 0 1-2-3V8a4 4 0 0 1 4-4Zm1 5h8M8 13h5" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  alert: (
    <>
      <path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  book: (
    <>
      <path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z" />
      <path d="M6 8h2M16 8h2M6 12h2M16 12h2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  volume: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
    </>
  ),
};

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-description">{children}</p>
    </header>
  );
}
