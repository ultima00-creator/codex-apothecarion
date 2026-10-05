import type { CSSProperties } from "react";

export function HelixMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 48" aria-hidden="true">
      <path d="M10 6 C22 12 10 18 22 24 C10 30 22 36 10 42" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M22 6 C10 12 22 18 10 24 C22 30 10 36 22 42" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 10 H22 M10 24 H22 M10 38 H22" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BookMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 8 H18 V34 H6 Z M22 8 H34 V34 H22 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M18 8 C20 14 20 28 18 34 M22 8 C20 14 20 28 22 34" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function CaseMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 48" aria-hidden="true">
      <path d="M22 14 V8 H42 V14" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="14" width="52" height="28" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M26 22 C32 26 26 30 32 34 M38 22 C32 26 38 30 32 34" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function VialMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 48" aria-hidden="true">
      <path fill="currentColor" d="M12 0 H20 V5 H18 V10 L26 18 V46 H6 V18 L14 10 V5 H12 Z" />
    </svg>
  );
}

export function VaultMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 52" aria-hidden="true">
      <path d="M14 10 V4 H26 V10" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="10" width="24" height="36" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 22 C22 25 16 29 22 32" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ChartMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 48 40" aria-hidden="true">
      <path d="M4 34 H44" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 28 C14 28 14 12 22 16 C30 20 30 8 40 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function BellMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 44" aria-hidden="true">
      <path d="M20 4 V8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 32 H32 L28 16 A8 8 0 0 0 12 16 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 32 A4 4 0 0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function CrossMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return <HelixMark className={className} style={style} />;
}

export function StimMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 2 L30 10 L14 26 L8 40" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M18 14 L26 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const glyphs: Record<string, string> = {
  vial: "M12 1 H20 V6 H18 V11 L26 19 V38 H6 V19 L14 11 V6 H12 Z",
  ampule: "M13 2 H19 L21 8 V14 L26 20 V36 H6 V20 L11 14 V8 Z",
  tablet: "M8 14 H24 A4 4 0 0 1 24 26 H8 A4 4 0 0 1 8 14 Z",
  capsule: "M11 6 H16 V34 H11 A5 5 0 0 1 11 6 Z M16 6 H21 A5 5 0 0 1 21 34 H16 Z",
  crystal: "M16 2 L28 16 L16 38 L4 16 Z",
  drop: "M16 3 C16 3 6 16 6 24 A10 10 0 0 0 26 24 C26 16 16 3 16 3 Z",
  heart: "M16 34 L5 21 A8 8 0 0 1 16 12 A8 8 0 0 1 27 21 Z",
  flask: "M12 2 H20 V12 L28 36 H4 L12 12 Z",
  injector: "M22 2 L28 8 L16 20 L20 24 L10 34 L6 30 L16 20 L12 16 Z",
};

export function SubstanceMark({ glyph, className, style }: { glyph: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 40" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" d={glyphs[glyph] ?? glyphs.vial} />
    </svg>
  );
}
