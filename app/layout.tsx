import type { Metadata, Viewport } from "next";
import SwRegister from "./sw-register";
import AppShell from "./app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rákattintsak?",
  description: "Gyanús SMS, e-mail vagy link ellenőrzése.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hu">
      <body>
        <AppShell>{children}</AppShell>
        <SwRegister />
      </body>
    </html>
  );
}
