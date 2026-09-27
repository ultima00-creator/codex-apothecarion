import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DiariumMark, GeneSeedMark } from "@/components/marks";

const links = [
  { to: "/", label: "Diarium" },
  { to: "/protocolos", label: "Gene-Seed" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className={`mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-5 ${path.startsWith("/protocolos") ? "wing-gene" : "wing-base"}`}>
      <header className="mast">
        <div className="flex items-center gap-3">
          <img src="/helix-bio.png" alt="" className="helix-banner" />
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
        <p className="plate-motto">
          <span>Codex</span>
          <span />
          <span>Apothecarion</span>
        </p>
        {children}
        <div className="plate-hazard" aria-hidden="true" />
      </div>
      <nav className="dock">
        <ul className="mx-auto flex max-w-3xl">
          {links.map((link) => (
            <li key={link.to} className="flex-1 border-l border-bronze/30 first:border-l-0">
              <Link
                to={link.to}
                className="flex min-h-14 items-center justify-center gap-2 text-sm text-ink"
                activeProps={{ className: "flex min-h-14 items-center justify-center gap-2 text-sm text-bronze" }}
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
