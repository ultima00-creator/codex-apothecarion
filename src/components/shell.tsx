import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { watchHerald } from "@/lib/signal";

const links = [
  { to: "/", label: "Diarium" },
  { to: "/codex", label: "Codex" },
  { to: "/protocolos", label: "Gene-Seed" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const metal = ["/codex", "/protocolos", "/administracao", "/agumentarium", "/conditionarium", "/abrir", "/tomar"].some((item) => path === item || path.startsWith(`${item}/`));
  useEffect(() => watchHerald(), []);
  useEffect(() => {
    const stop = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
    };
  }, []);
  return (
    <div className={`shell mx-auto min-h-screen w-full max-w-3xl px-4 pt-5 ${path.startsWith("/protocolos") ? "wing-gene" : "wing-base"}`}>
      <header className="mast">
        <div className="flex items-center gap-3">
          <img src="/helix-bio.png" alt="" className="helix-banner iron-mark" />
          <div>
            <p className="text-xs tracking-[0.28em] text-bronze uppercase">Codex</p>
            <p className="font-display text-3xl leading-none">Apothecarion</p>
          </div>
        </div>
      </header>
      <div className={metal ? "plate plate-metal" : "plate"}>
        <div className="plate-scroll">
          {children}
          <div className="plate-hazard" aria-hidden="true" />
        </div>
      </div>
      <nav className="dock">
        <ul className="mx-auto flex max-w-3xl">
          {links.map((link) => (
            <li key={link.to} className="flex-1 border-l border-white/15 first:border-l-0">
              <Link
                to={link.to}
                className="dock-link flex min-h-14 items-center justify-center gap-2 text-sm"
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "dock-link flex min-h-14 items-center justify-center gap-2 text-sm text-ink" }}
              >
                {link.to === "/" ? <img src="/relics/sigil-registro.png" alt="" className="sigil" /> : null}
                {link.to === "/codex" ? <img src="/relics/sigil-codex.png" alt="" className="sigil" /> : null}
                {link.to === "/protocolos" ? <img src="/relics/gene-vault.png" alt="" className="sigil" /> : null}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
