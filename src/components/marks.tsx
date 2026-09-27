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

export function GeneSeedMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="9" width="20.6" height="16.4" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2.6" y="5.2" width="4.6" height="16.2" rx="0.6" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.15" />
      <rect x="8.6" y="5.2" width="4.6" height="16.2" rx="0.6" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.15" />
      <rect x="14.6" y="5.2" width="4.6" height="16.2" rx="0.6" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.15" />
      <path d="M2.6 7.6h4.6M8.6 7.6h4.6M14.6 7.6h4.6" stroke="currentColor" strokeWidth="1" />
      <path d="M1.6 14.2h19.4" stroke="currentColor" strokeWidth="2.2" />
      <path d="M4.2 14.2 6.2 12 8.2 14.2 6.2 16.4Z" fill="var(--color-parchment)" stroke="currentColor" strokeWidth="1.05" />
      <path d="M8.4 14.2 11 11.2 13.6 14.2 11 17.2Z" fill="var(--color-parchment)" stroke="currentColor" strokeWidth="1.05" />
      <path d="M13.8 14.2 15.8 12 17.8 14.2 15.8 16.4Z" fill="var(--color-parchment)" stroke="currentColor" strokeWidth="1.05" />
      <rect x="22.6" y="9.6" width="8" height="12.2" stroke="currentColor" strokeWidth="1.15" />
      <path d="M23.8 11h1.7v1.7h-1.7zM26.2 11h1.7v1.7h-1.7zM23.8 13.3h1.7v1.7h-1.7zM26.2 13.3h1.7v1.7h-1.7z" stroke="currentColor" strokeWidth="0.85" />
      <circle cx="26.6" cy="18.6" r="1.45" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
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
