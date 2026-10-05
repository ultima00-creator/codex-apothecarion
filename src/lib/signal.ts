import { settleDiary, upcomingEnds } from "@/lib/diary";

const ARMED = "apothecarion-signal";
const FIRED = "apothecarion-signaled";

function ios(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function installedHome(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function signalArmed(): boolean {
  return localStorage.getItem(ARMED) === "on";
}

export function signalStatus(): string {
  if (!("Notification" in window)) return "Este aparelho não expõe a notificação.";
  const perm = Notification.permission;
  const word = perm === "granted" ? "concedida" : perm === "denied" ? "negada" : "pendente";
  const home = installedHome() ? "na Tela de Início" : "ainda no Safari";
  return `Permissão ${word}. Aplicativo ${home}. O som é o do sistema.`;
}

export function registerHerald(): void {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

async function fireSignal(title: string, body: string, tag: string): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const opts: NotificationOptions = {
    body,
    tag,
    icon: "/favicon-bio.png",
    badge: "/favicon-bio.png",
    data: { go: "/" },
  };
  const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
  if (reg?.showNotification) await reg.showNotification(title, opts);
  else new Notification(title, opts);
}

function firedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function remember(ids: Set<string>) {
  localStorage.setItem(FIRED, JSON.stringify([...ids].slice(-40)));
}

export async function heraldEnded(): Promise<void> {
  const notices = settleDiary();
  const fresh = notices.filter((notice) => !firedIds().has(notice.id));
  if (fresh.length > 0) window.dispatchEvent(new Event("apothecarion-settled"));
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const seen = firedIds();
  let wrote = false;
  for (const notice of fresh) {
    seen.add(notice.id);
    wrote = true;
    const body = notice.word === "efeito" ? "O efeito acabou." : "O tempo desta curva acabou.";
    await fireSignal(notice.name, body, notice.id);
  }
  if (wrote) remember(seen);
}

export async function pledgeAlarm(): Promise<void> {
  localStorage.setItem(ARMED, "on");
  if ("Notification" in window && !(ios() && !installedHome()) && Notification.permission === "default") {
    await Notification.requestPermission();
  }
  registerHerald();
  window.dispatchEvent(new Event("apothecarion-alarms"));
}

export async function armSignal(): Promise<"on" | "denied" | "need-home" | "missing"> {
  if (!("Notification" in window)) return "missing";
  if (ios() && !installedHome()) return "need-home";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  localStorage.setItem(ARMED, "on");
  registerHerald();
  await fireSignal("Codex:Apothecarion", "Sinais armados. O aviso soa quando o efeito acaba.", "arm");
  return "on";
}

export function disarmSignal(): void {
  localStorage.setItem(ARMED, "off");
}

export async function testSignal(): Promise<"on" | "denied" | "need-home" | "missing"> {
  if (Notification.permission !== "granted" || !signalArmed()) return armSignal();
  await fireSignal("Sinal de teste", "O Apothecarion alcançou o aparelho.", "test");
  return "on";
}

export function watchHerald(): () => void {
  registerHerald();
  const timers = new Map<string, number>();
  const armTimers = () => {
    for (const handle of timers.values()) window.clearTimeout(handle);
    timers.clear();
    const now = Date.now();
    for (const row of upcomingEnds(now)) {
      const wait = row.end - now + 500;
      if (wait <= 0 || wait > 2_000_000_000) continue;
      timers.set(row.id, window.setTimeout(() => {
        void heraldEnded().then(armTimers);
      }, wait));
    }
  };
  void heraldEnded().then(armTimers);
  const poll = window.setInterval(() => {
    void heraldEnded().then(armTimers);
  }, 30000);
  const onVis = () => {
    if (!document.hidden) void heraldEnded().then(armTimers);
  };
  document.addEventListener("visibilitychange", onVis);
  const onAlarm = () => {
    void heraldEnded().then(armTimers);
  };
  window.addEventListener("apothecarion-alarms", onAlarm);
  return () => {
    window.clearInterval(poll);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("apothecarion-alarms", onAlarm);
    for (const handle of timers.values()) window.clearTimeout(handle);
  };
}
