import type { Metadata } from "next";
import Link from "next/link";
import DamageFlow from "./damage-flow";

export const metadata: Metadata = {
  title: "Már rákattintottam – Rákattintsak?",
};

export default function Page() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Már rákattintottam</h1>
        <p>Válaszolj néhány kérdésre, és megmutatjuk, mit tegyél most.</p>
      </div>
      <DamageFlow />
      <Link href="/" className="flex min-h-[56px] items-center text-base underline">
        Vissza az ellenőrzéshez
      </Link>
    </main>
  );
}
