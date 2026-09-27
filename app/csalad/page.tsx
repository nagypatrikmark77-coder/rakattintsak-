import type { Metadata } from "next";
import Link from "next/link";
import FamilyView from "./family-view";

export const metadata: Metadata = {
  title: "Családi védőháló – Rákattintsak?",
};

export default function Page() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Családi védőháló</h1>
        <p>
          Ha a nagyi egy ellenőrzésnél PIROS ítéletet kap, az unoka értesítést kap róla. Csak a szervezet nevét és az
          időpontot látja, az üzenetet nem.
        </p>
      </div>
      <FamilyView />
      <Link href="/" className="flex min-h-[56px] items-center text-base underline">
        Vissza az ellenőrzéshez
      </Link>
    </main>
  );
}
