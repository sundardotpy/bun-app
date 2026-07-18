export default function Header() {
  return (
    <header className="flex items-center gap-2 border-b border-ink/10 bg-cream px-6 py-4 sm:px-10">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-cream">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-lg font-extrabold tracking-tight">Report Downloader</span>
    </header>
  );
}
