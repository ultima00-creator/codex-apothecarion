import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

type Win = { a: number; b: number };

export function ChartLens<T>({ data, children }: { data: T[]; children: (view: T[]) => ReactNode }) {
  const [win, setWin] = useState<Win>({ a: 0, b: data.length });
  const box = useRef<HTMLDivElement>(null);
  const winRef = useRef(win);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; a: number; b: number } | null>(null);
  const drag = useRef<{ x: number; a: number; b: number } | null>(null);
  winRef.current = win;

  const signature = `${data.length}:${String((data[0] as { x?: unknown } | undefined)?.x ?? "")}:${String((data.at(-1) as { x?: unknown } | undefined)?.x ?? "")}`;
  useEffect(() => {
    setWin({ a: 0, b: data.length });
  }, [signature, data.length]);

  const clamp = (a: number, b: number): Win => {
    const n = data.length;
    if (n <= 1) return { a: 0, b: n };
    const min = Math.min(6, n);
    let width = Math.max(min, Math.min(n, Math.round(b - a)));
    let start = Math.round(a);
    if (start < 0) start = 0;
    if (start + width > n) start = n - width;
    return { a: start, b: start + width };
  };

  const zoom = (factor: number, anchor = 0.5) => {
    const cur = winRef.current;
    const width = Math.max(1, cur.b - cur.a);
    const next = width * factor;
    const focus = cur.a + width * anchor;
    const a = focus - next * anchor;
    setWin(clamp(a, a + next));
  };

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const anchor = rect.width ? (event.clientX - rect.left) / rect.width : 0.5;
      zoom(event.deltaY > 0 ? 1.4 : 0.7, Math.min(1, Math.max(0, anchor)));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  });

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const here = pointers.current.get(event.pointerId);
    if (here) here.x = event.clientX;
    if (pointers.current.size >= 2 && pinch.current) {
      const [p, q] = [...pointers.current.values()];
      const dist = Math.hypot(p.x - q.x, p.y - q.y);
      if (pinch.current.dist < 12 || dist < 12) return;
      const base = pinch.current;
      const width = base.b - base.a;
      const next = width * (base.dist / dist);
      const mid = (base.a + base.b) / 2;
      setWin(clamp(mid - next / 2, mid + next / 2));
      return;
    }
    if (drag.current && box.current) {
      const span = drag.current.b - drag.current.a;
      const shift = Math.round((-(event.clientX - drag.current.x) / box.current.clientWidth) * span);
      setWin(clamp(drag.current.a + shift, drag.current.b + shift));
    }
  };

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) drag.current = { x: event.clientX, a: winRef.current.a, b: winRef.current.b };
    if (pointers.current.size >= 2) {
      const [p, q] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(p.x - q.x, p.y - q.y), a: winRef.current.a, b: winRef.current.b };
      drag.current = null;
    }
  };

  const up = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    drag.current = pointers.current.size === 1 ? { x: [...pointers.current.values()][0].x, a: winRef.current.a, b: winRef.current.b } : null;
  };

  const view = data.slice(win.a, Math.max(win.a + 1, win.b));
  const tight = data.length > 0 && win.b - win.a < data.length;

  return (
    <div className="chart-lens">
      <div
        className="chart-lens-face"
        ref={box}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {children(view.length > 0 ? view : data)}
      </div>
      <div className="chart-zoom">
        <button type="button" onClick={() => zoom(0.65)} aria-label="Aproximar o gráfico">+</button>
        <button type="button" onClick={() => setWin({ a: 0, b: data.length })} disabled={!tight}>tudo</button>
        <button type="button" onClick={() => zoom(1.45)} aria-label="Afastar o gráfico">−</button>
      </div>
    </div>
  );
}
