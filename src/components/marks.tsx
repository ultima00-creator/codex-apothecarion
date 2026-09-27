export function DiariumMark({ className = "size-10" }: { className?: string }) {
  return <img src="/diarium-light.png" alt="" className={`object-cover ${className}`} />;
}

export function GeneSeedMark({ className = "size-16" }: { className?: string }) {
  return <img src="/gene-seed-light.png" alt="" className={`vial-mark object-cover ${className}`} />;
}

export function MateriaMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 14h16l-2.2 10.2a4 4 0 0 1-3.9 3.2h-3.8a4 4 0 0 1-3.9-3.2L8 14z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 14h18" stroke="currentColor" strokeWidth="1.4" />
      <path d="M18 6.5l6.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
      <path d="M16.2 8.2l2.2 3.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
