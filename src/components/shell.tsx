import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { DiariumMark, GeneSeedMark } from "@/components/marks";
import { watchHerald } from "@/lib/signal";

const links = [
  { to: "/", label: "Diarium" },
  { to: "/protocolos", label: "Gene-Seed" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => watchHerald(), []);
  return (
    <div className={`shell mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-5 ${path.startsWith("/protocolos") ? "wing-gene" : "wing-base"}`}>
      <header className="mast">
        <div className="flex items-center gap-3">
          <img src="/helix-bio.png" alt="" className="helix-banner iron-mark" />
          <div>
            <p className="text-xs tracking-[0.28em] text-bronze uppercase">Codex</p>
            <p className="font-display text-3xl leading-none">Apothecarion</p>
          </div>
        </div>
      </header>
      <div className="plate">
        <span className="tick tick-tl" />
        <span className="tick tick-tr" />
        <span className="tick tick-bl" />
        <span className="tick tick-br" />
        {children}
        <div className="plate-hazard" aria-hidden="true" />
      </div>
      <nav className="dock">
        <ul className="mx-auto flex max-w-3xl">
          {links.map((link) => (
            <li key={link.to} className="flex-1 border-l border-bronze/30 first:border-l-0">
              <Link
                to={link.to}
                className="dock-link flex min-h-14 items-center justify-center gap-2 text-sm"
                activeProps={{ className: "dock-link flex min-h-14 items-center justify-center gap-2 text-sm text-ink" }}
              >
                {link.to === "/" ? <DiariumMark className="size-9" /> : null}
                {link.to === "/protocolos" ? <GeneSeedMark className="size-9" /> : null}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
