import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#about", label: "ABOUT" },
  { href: "#projects", label: "PROJECTS" },
  { href: "#adventures", label: "ADVENTURES" },
  { href: "#resume", label: "RESUME" },
];

interface HeaderProps {
  showBack?: boolean;
  backTo?: string;
}

export default function Header({ showBack, backTo = "/" }: HeaderProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-[var(--font-pixel)] text-primary text-sm sm:text-base cursor-blink hover:text-glow-primary transition-all"
          >
            {">"} VISHWAS_
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            {showBack ? (
              <Link
                to={backTo}
                className="font-mono text-sm text-muted hover:text-primary transition-colors group"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {">"}{" "}
                </span>
                {"<"} BACK
              </Link>
            ) : isHome ? (
              navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-mono text-xs sm:text-sm text-muted hover:text-primary transition-colors group hidden sm:block"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {">"}{" "}
                  </span>
                  {link.label}
                </a>
              ))
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
