export function DiariumMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 6.5h14.2c1.6 0 2.8 1.2 2.8 2.8v16.2H9.2C8 25.5 7 24.5 7 23.3V6.5z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 6.5h2.2v19" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.2 11.2h8.2M12.2 14.6h8.2M12.2 18h5.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M21.2 22.2l2.2 2.2 3.4-4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function GeneSeedMark({ className = "size-16" }: { className?: string }) {
  return <img src="/gene-seed-vials.png" alt="" className={`vial-mark object-cover ${className}`} />;
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
