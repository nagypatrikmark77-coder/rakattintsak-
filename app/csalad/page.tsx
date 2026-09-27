import type { Metadata } from "next";
import Link from "next/link";
import FamilyView from "./family-view";

export const metadata: Metadata = {
  title: "Családi védőháló – Rákattintsak?",
};

export default function Page() {
  return (
    <main className="home-main">
      <Link href="/" className="family-back">← Ellenőrzés</Link>
      <h1>Családi védőháló</h1>
      <FamilyView />
    </main>
  );
}
