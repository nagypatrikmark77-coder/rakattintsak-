"use client";

// Családi védőháló. Bejelentkezés = Google-fiók hozzákötése az anonim felhasználóhoz (az ellenőrzéshez nem kell).
// Az unoka (owner) élőben kapja a riasztást, de csak amíg ez az oldal nyitva van; Web Push nincs.
// A riasztásban csak a szervezet neve és az időpont van, az üzenet tartalma soha.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "../ui";
import {
  authHeader,
  browserClient,
  ensureSession,
  isSignedIn,
  linkGoogle,
  oauthErrorCode,
  signInWithGoogle,
  signOut,
} from "@/lib/supabase/browser";
import {
  ALERT_LIMIT,
  alertLine,
  formatAlertTime,
  mergeAlert,
  parseMemberships,
  toAlertRow,
  type AlertRow,
  type Membership,
} from "./family-data";

const BUTTON = "button button-primary button-wide";
const BUTTON_OUTLINE = "button button-secondary button-wide";
const TEXT_BUTTON = "text-button self-start";

type View =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "signed_out" }
  | { kind: "load_failed" }
  | { kind: "ready"; memberships: Membership[] };

type OAuthProblem = "identity_already_exists" | "other";

async function resolveView(): Promise<View> {
  const sb = browserClient();
  if (!sb) return { kind: "unavailable" };
  const session = await ensureSession();
  if (!session || !isSignedIn(session)) return { kind: "signed_out" };
  const { data, error } = await sb
    .from("family_members")
    .select("family_id, role, families(id, code)")
    .eq("user_id", session.user.id);
  if (error) return { kind: "load_failed" };
  return { kind: "ready", memberships: parseMemberships(data) };
}

async function postFamily(
  path: string,
  body: object,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const data: unknown = await res.json().catch(() => null);
    const message =
      data && typeof data === "object"
        ? (data as { error?: unknown }).error
        : undefined;
    return {
      ok: false,
      message:
        typeof message === "string"
          ? message
          : "Most nem sikerült. Próbáld újra később.",
    };
  } catch {
    return {
      ok: false,
      message:
        "Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot, és próbáld újra.",
    };
  }
}

export default function FamilyView() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [oauthProblem, setOauthProblem] = useState<OAuthProblem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const code = oauthErrorCode();
    void resolveView().then((next) => {
      if (cancelled) return;
      if (code) {
        setOauthProblem(
          code === "identity_already_exists"
            ? "identity_already_exists"
            : "other",
        );
        // A hibakód ne maradjon az URL-ben (újratöltéskor ne jelenjen meg újra).
        window.history.replaceState(null, "", window.location.pathname);
      }
      setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    setView(await resolveView());
  }, []);

  return (
    <div className="stack">
      {oauthProblem && <OAuthBanner problem={oauthProblem} />}
      {view.kind === "loading" && (
        <p className="panel loading-status" role="status">
          <span className="spinner" aria-hidden="true" />
          Családi védőháló betöltése…
        </p>
      )}
      {view.kind === "unavailable" && (
        <p className="notice" role="status">
          <Icon name="help" />A családi funkció most nem elérhető.
        </p>
      )}
      {view.kind === "signed_out" && <SignedOut />}
      {view.kind === "load_failed" && (
        <section className="panel stack">
          <p className="notice notice-error">
            A családi adatokat most nem sikerült betölteni.
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className={BUTTON_OUTLINE}
          >
            Újrapróbálás
          </button>
        </section>
      )}
      {view.kind === "ready" && (
        <Ready memberships={view.memberships} onChange={reload} />
      )}
      {(view.kind === "ready" || view.kind === "load_failed") && (
        <button
          type="button"
          onClick={async () => {
            await signOut().catch(() => {});
            window.location.reload();
          }}
          className={TEXT_BUTTON}
        >
          Kijelentkezés
        </button>
      )}
    </div>
  );
}

function OAuthBanner({ problem }: { problem: OAuthProblem }) {
  const [failed, setFailed] = useState(false);
  if (problem === "other") {
    return (
      <p role="alert" className="font-bold">
        A Google-fiók mentése nem sikerült. Próbáld újra.
      </p>
    );
  }
  return (
    <section role="alert" className="notice notice-error flex-col">
      <p className="font-bold">
        Ez a Google-fiók már egy másik mentett fiókhoz tartozik.
      </p>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          signInWithGoogle("/csalad").catch(() => setFailed(true));
        }}
        className={BUTTON}
      >
        Belépés ezzel a Google-fiókkal
      </button>
      {failed && (
        <p className="font-bold">
          A belépés most nem sikerült. Próbáld újra később.
        </p>
      )}
    </section>
  );
}

function SignedOut() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function save() {
    setBusy(true);
    setFailed(false);
    try {
      // Siker esetén a böngésző átmegy a Google-höz. Ha nincs anonim session (pl. ki van kapcsolva az anonim
      // belépés), nincs mihez kötni: ilyenkor sima Google-belépés.
      if (await ensureSession()) await linkGoogle("/csalad");
      else await signInWithGoogle("/csalad");
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <section className="panel family-signin">
      <span className="section-icon">
        <Icon name="family" />
      </span>
      <h2>Együtt könnyebb figyelni.</h2>
      <p>
        Mentsd a fiókodat, hogy létrehozhass egy családot, vagy csatlakozhass a
        szeretteidhez.
      </p>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className={BUTTON_OUTLINE}
      >
        {busy ? (
          <span className="spinner" aria-hidden="true" />
        ) : (
          <span className="google-icon" aria-hidden="true">
            G
          </span>
        )}
        {busy ? "Kapcsolódás…" : "Fiók mentése Google-lal"}
      </button>
      <p className="privacy-note">
        <Icon name="lock" />A családod csak a szervezet nevét és az időpontot
        látja. Az üzeneted tartalmát nem.
      </p>
      {failed && (
        <p role="alert" className="font-bold">
          A Google-fiók mentése most nem sikerült. Próbáld újra később.
        </p>
      )}
    </section>
  );
}

function Ready({
  memberships,
  onChange,
}: {
  memberships: Membership[];
  onChange: () => Promise<void>;
}) {
  const owner = memberships.find((m) => m.role === "owner");
  const member = memberships.find((m) => m.role === "member");
  if (!owner && !member) return <Setup onDone={onChange} />;
  return (
    <>
      {owner && <OwnerPanel familyId={owner.family_id} code={owner.code} />}
      {member && <MemberPanel familyId={member.family_id} />}
    </>
  );
}

function Setup({ onDone }: { onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function create() {
    setBusy("create");
    setCreateError(null);
    const result = await postFamily("/api/family/create", {});
    if (result.ok) await onDone();
    else setCreateError(result.message);
    setBusy(null);
  }

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("join");
    setJoinError(null);
    const result = await postFamily("/api/family/join", { code });
    if (result.ok) await onDone();
    else setJoinError(result.message);
    setBusy(null);
  }

  return (
    <div className="stack family-setup">
      <section className="panel stack">
        <span className="section-icon">
          <Icon name="family" />
        </span>
        <h2>Én figyelek valakire</h2>
        <p>
          Hozz létre egy családot, és add át a kapott kódot a családtagodnak.
        </p>
        <button
          type="button"
          onClick={create}
          disabled={busy !== null}
          className={BUTTON}
        >
          {busy === "create" ? "Egy pillanat…" : "Család létrehozása"}
        </button>
        {createError && (
          <p role="alert" className="font-bold">
            {createError}
          </p>
        )}
      </section>
      <form onSubmit={join} className="panel stack">
        <h2 className="text-xl font-bold">Csatlakozás családhoz</h2>
        <label htmlFor="family-code" className="text-lg">
          Írd be a 6 karakteres családkódot:
        </label>
        <input
          id="family-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={12}
          className="family-input"
          placeholder="ABC123"
        />
        <button
          type="submit"
          disabled={busy !== null}
          className={BUTTON_OUTLINE}
        >
          {busy === "join" ? "Egy pillanat…" : "Csatlakozás családhoz"}
        </button>
        {joinError && (
          <p role="alert" className="font-bold">
            {joinError}
          </p>
        )}
      </form>
    </div>
  );
}

// Előzmények: a család legutóbbi riasztásai (RLS: csak a saját család). Újra betölt, amikor az oldal előtérbe kerül,
// mert a háttérben (lezárt telefon) az élő kapcsolat megszakadhat.
function useAlerts(familyId: string) {
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sb = browserClient();
    if (!sb) return;
    let cancelled = false;
    const fetchAlerts = async () => {
      const { data, error } = await sb
        .from("alerts")
        .select("id, brand, created_at")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(ALERT_LIMIT);
      if (cancelled) return;
      setFailed(!!error);
      if (!error)
        setAlerts(
          (data ?? []).map(toAlertRow).filter((a): a is AlertRow => a !== null),
        );
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchAlerts();
    };
    void fetchAlerts();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [familyId]);

  const add = useCallback(
    (alert: AlertRow) => setAlerts((list) => mergeAlert(list ?? [], alert)),
    [],
  );
  return { alerts, failed, add };
}

function History({
  alerts,
  failed,
}: {
  alerts: AlertRow[] | null;
  failed: boolean;
}) {
  return (
    <section className="panel stack family-panel">
      <h2>Korábbi riasztások</h2>
      {failed && <p>Az előzményeket most nem sikerült betölteni.</p>}
      {!failed && alerts === null && <p>Betöltés…</p>}
      {alerts && alerts.length === 0 && (
        <div className="history-empty">
          <Icon name="bell" />
          <p>Még nem érkezett piros riasztás.</p>
          <p className="text-xs mt-1">
            Itt látod majd a családodhoz tartozó jelzéseket.
          </p>
        </div>
      )}
      {alerts && alerts.length > 0 && (
        <ul className="flex flex-col gap-3">
          {alerts.map((a) => (
            <li key={a.id} className="history-row">
              <Icon name="alert" />
              <span>{alertLine(a)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Hang: a böngésző csak felhasználói érintés után engedi, ezért az első érintéskor "feloldjuk".
let audioContext: AudioContext | null = null;

function unlockAudio() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    audioContext ??= new Ctx();
    void audioContext.resume().catch(() => {});
  } catch {
    // hang nélkül is működik
  }
}

function beep() {
  unlockAudio();
  const ctx = audioContext;
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // hang nélkül is működik
  }
}

// Androidon a new Notification() tiltott, ezért a service workeren át jelenítjük meg.
async function showSystemNotification(alert: AlertRow) {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    !("serviceWorker" in navigator)
  )
    return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Rákattintsak? – Figyelem!", {
      body: `Nagy valószínűséggel csaló üzenetet ellenőriztek: ${alert.brand}, ${formatAlertTime(alert.created_at)}`,
      tag: alert.id,
      lang: "hu",
    });
  } catch {
    // az oldalon megjelenő piros kártya így is ott van
  }
}

type Permission = NotificationPermission | "unsupported";

function currentPermission(): Permission {
  return typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";
}

function OwnerPanel({ familyId, code }: { familyId: string; code: string }) {
  const { alerts, failed, add } = useAlerts(familyId);
  const [members, setMembers] = useState<number | null>(null);
  const [latest, setLatest] = useState<AlertRow | null>(null);
  const [live, setLive] = useState<"connecting" | "on" | "off">("connecting");
  const [permission, setPermission] = useState<Permission>(currentPermission);

  // Hány családtag (member) csatlakozott; előtérbe kerüléskor frissül (pl. amikor a nagyi épp beírta a kódot).
  useEffect(() => {
    const sb = browserClient();
    if (!sb) return;
    let cancelled = false;
    const fetchCount = async () => {
      const { count, error } = await sb
        .from("family_members")
        .select("user_id", { count: "exact", head: true })
        .eq("family_id", familyId)
        .eq("role", "member");
      if (!cancelled && !error) setMembers(count ?? 0);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchCount();
    };
    void fetchCount();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [familyId]);

  // Élő riasztás: új sor az alerts táblában ennél a családnál (RLS szerint csak a saját családé érkezik meg).
  useEffect(() => {
    const sb = browserClient();
    if (!sb) return;
    const channel = sb
      .channel(`family-alerts-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const alert = toAlertRow(payload.new);
          if (!alert) return;
          add(alert);
          setLatest(alert);
          beep();
          void showSystemNotification(alert);
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED" ? "on" : "off"));
    return () => {
      void sb.removeChannel(channel);
    };
  }, [familyId, add]);

  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  async function enableNotifications() {
    unlockAudio();
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission(currentPermission());
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {latest && (
        <div role="alert" className="notice notice-error">
          <p className="font-semibold">
            Figyelem! Nagy valószínűséggel csaló üzenetet ellenőriztek:{" "}
            {latest.brand}, {formatAlertTime(latest.created_at)}
          </p>
        </div>
      )}

      <div className="panel stack family-panel">
        <h2>A családod meghívókódja</h2>
        <p className="text-sm text-[var(--muted)]">
          Add meg ezt a kódot a nagyi telefonján a Családi védőháló oldalon:
        </p>
        <p
          className="family-code"
          aria-label={`Családkód: ${code.split("").join(" ")}`}
        >
          {code}
        </p>
        {members !== null && (
          <p>
            {members === 0
              ? "Még senki nem csatlakozott."
              : `Csatlakozott családtagok száma: ${members}`}
          </p>
        )}
      </div>

      <div className="panel stack family-panel">
        <h2>Értesítések</h2>
        <p className="text-sm text-[var(--muted)]">
          Azonnal csak akkor szól, ha ez az oldal nyitva van.
        </p>
        {live === "on" && (
          <p className="status-line">
            <span className="status-dot" />
            Élő figyelés: bekapcsolva.
          </p>
        )}
        {live === "connecting" && (
          <p className="status-line">
            <span className="spinner" aria-hidden="true" />
            Kapcsolódás az élő figyeléshez…
          </p>
        )}
        {live === "off" && (
          <p>Az élő figyelés most nem kapcsolódik. Töltsd újra az oldalt.</p>
        )}
        {permission === "default" && (
          <button
            type="button"
            onClick={enableNotifications}
            className={BUTTON_OUTLINE}
          >
            Értesítések engedélyezése
          </button>
        )}
        {permission === "granted" && <p>Értesítések: engedélyezve.</p>}
        {permission === "denied" && (
          <p>
            Az értesítések le vannak tiltva. A böngésző beállításaiban
            engedélyezheted őket.
          </p>
        )}
      </div>

      <History alerts={alerts} failed={failed} />
    </section>
  );
}

function MemberPanel({ familyId }: { familyId: string }) {
  const { alerts, failed } = useAlerts(familyId);
  return (
    <section className="flex flex-col gap-6">
      <p className="panel text-base">
        Csatlakoztál a családhoz. Ha egy ellenőrzés PIROS ítéletet ad, a
        családod értesítést kap. Csak a szervezet nevét és az időpontot látják,
        az üzenetet nem.
      </p>
      <History alerts={alerts} failed={failed} />
    </section>
  );
}
