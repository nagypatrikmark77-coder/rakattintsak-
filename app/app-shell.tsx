"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./ui";

const navigation: {
  href: string;
  label: string;
  mobileLabel: string;
  icon: IconName;
}[] = [
  { href: "/", label: "Ellenőrzés", mobileLabel: "Ellenőrzés", icon: "search" },
  {
    href: "/csalad",
    label: "Családi védőháló",
    mobileLabel: "Család",
    icon: "family",
  },
  {
    href: "/rakattintottam",
    label: "Már rákattintottam",
    mobileLabel: "Rákattintottam",
    icon: "alert",
  },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/csalad") {
    return (
      <div className="home-shell">
        <a href="#main-content" className="skip-link">
          Ugrás a tartalomhoz
        </a>
        <div className="home-content" id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    );
  }
  const current =
    navigation.find((item) => item.href === pathname)?.label ??
    "Használati útmutató";
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Ugrás a tartalomhoz
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Rákattintsak? – Főoldal">
          <span className="brand-mark">
            <Icon name="shield" />
          </span>
          <span>
            Rákattintsak<span className="brand-question">?</span>
          </span>
        </Link>
        <div className="sidebar-navigation">
          <p className="nav-caption">EGY KATTINTÁS ELŐTT</p>
          <nav aria-label="Főmenü">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? "is-active" : ""}`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span className="desktop-nav-label">{item.label}</span>
                <span className="mobile-nav-label">{item.mobileLabel}</span>
                {pathname === item.href && <span className="nav-active-dot" />}
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <Link
            href="/utmutato"
            className={`nav-item ${pathname === "/utmutato" ? "is-active" : ""}`}
            aria-current={pathname === "/utmutato" ? "page" : undefined}
          >
            <Icon name="book" />
            <span>Használati útmutató</span>
          </Link>
          <p>
            Digitális segítség.
            <br />
            Neked és a családodnak.
          </p>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="topbar">
          <p>
            <span className="breadcrumb-brand">
              Rákattintsak? <span className="breadcrumb-divider">/</span>
            </span>{" "}
            {current}
          </p>
          <Link
            href="/utmutato"
            className="topbar-help"
            aria-label="Segítség a használathoz"
          >
            <Icon name="help" />
            <span>Segítség</span>
          </Link>
        </header>
        <div className="page-content" id="main-content" tabIndex={-1}>
          {children}
        </div>
        <footer className="app-footer">
          <span>
            Rákattintsak? <span aria-hidden="true">·</span> Egy kis figyelem
            sokat számít.
          </span>
          <Link href="/utmutato#eredmenyek">
            Az eredmények értelmezése <Icon name="arrow" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
