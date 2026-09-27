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
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-5">
      <header className="mb-3 flex items-end justify-between border-b border-bronze pb-2">
        <div>
          <p className="text-xs tracking-[0.28em] text-bronze uppercase">Apothecarion</p>
          <p className="font-display text-3xl leading-none">Codex</p>
        </div>
        <span className="mb-1 h-1 w-12 bg-bronze" />
      </header>
      <div className="plate">
        <span className="tick tick-tl" />
        <span className="tick tick-tr" />
        <span className="tick tick-bl" />
        <span className="tick tick-br" />
        {children}
      </div>
      {path !== "/tomar" ? (
        <Link
          to="/tomar"
          aria-label="Nova tomada"
          className="fixed right-4 bottom-20 flex size-14 items-center justify-center border border-bronze bg-plate text-3xl leading-none text-bronze"
        >
          +
        </Link>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 border-t-2 border-bronze bg-parchment">
        <ul className="mx-auto flex max-w-3xl">
          {links.map((link) => (
            <li key={link.to} className="flex-1">
              <Link
                to={link.to}
                className="flex min-h-12 items-center justify-center gap-1 text-sm text-ink"
                activeProps={{ className: "flex min-h-12 items-center justify-center gap-1 text-sm text-bronze" }}
              >
                {link.to === "/" ? <DiariumMark className="size-4" /> : null}
                {link.to === "/protocolos" ? <GeneSeedMark className="size-4" /> : null}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
