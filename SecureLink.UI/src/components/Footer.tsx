export default function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            © VISHWAS_YOGI — All bugs reserved
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-muted hover:text-primary transition-colors border border-border px-3 py-1 hover:border-primary hover:glow-primary"
            >
              [ GITHUB ]
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-muted hover:text-primary transition-colors border border-border px-3 py-1 hover:border-primary hover:glow-primary"
            >
              [ LINKEDIN ]
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
