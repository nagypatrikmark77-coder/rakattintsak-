import type { Metadata, Viewport } from "next";
import SwRegister from "./sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rákattintsak?",
  description: "Gyanús SMS, e-mail vagy link ellenőrzése.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hu">
      <body>
        <div className="mx-auto w-full max-w-[480px] px-4 py-6">{children}</div>
        <SwRegister />
      </body>
    </html>
  );
}
