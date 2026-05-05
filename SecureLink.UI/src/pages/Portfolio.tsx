import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { cn } from "@/lib/utils";

const techStack = [".NET", "Python", "React", "PostgreSQL", "Docker"];

const projects = [
  {
    id: "securelink",
    name: "SECURELINK",
    tagline: "Find your face. Find your photos.",
    description:
      "Face recognition powered photo search. Upload event photos, find yourself using just a selfie.",
    tags: [".NET", "Python", "DeepFace", "pgvector", "React"],
    featured: true,
    link: "/securelink",
  },
  {
    id: "devops-dashboard",
    name: "DEVOPS_DASH",
    tagline: "Monitor all the things.",
    description:
      "Real-time infrastructure monitoring with beautiful terminal aesthetics.",
    tags: ["Go", "React", "Prometheus", "Grafana"],
    featured: false,
    link: "#",
  },
  {
    id: "code-collab",
    name: "CODE_COLLAB",
    tagline: "Pair program from anywhere.",
    description:
      "Real-time collaborative code editor with video chat integration.",
    tags: ["Node.js", "WebRTC", "Monaco", "Redis"],
    featured: false,
    link: "#",
  },
];

const adventures = [
  {
    icon: "🗺️",
    title: "TRAVEL",
    description: "Explored 12 countries. Lost luggage twice. Worth it.",
  },
  {
    icon: "🏃",
    title: "RUNNING",
    description:
      "Half marathons completed: 3. Full marathons: still loading...",
  },
  {
    icon: "⛰️",
    title: "TREKKING",
    description: "Conquered peaks, conquered bugs. Same energy.",
  },
];

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayed, text, started]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

function AsciiArt() {
  return (
    <pre className="text-primary text-[6px] sm:text-[8px] leading-tight font-mono opacity-60 select-none">
      {`
    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   ██░░░░░░░░░░░░░░██
   ██░░▓▓░░░░░░▓▓░░██
   ██░░░░░░░░░░░░░░██
   ██░░░░░▓▓▓░░░░░░██
   ██░░░░░░░░░░░░░░██
    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
      ║║║║║║║║║║║║
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  █░░░░░░░░░░░░░░░░░░█
  █░░░░░░░░░░░░░░░░░░█
   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`}
    </pre>
  );
}

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-background scanlines">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="flex-1">
              <div className="terminal-card p-6 sm:p-8 glow-primary">
                <p className="font-mono text-muted text-sm mb-4">$ whoami</p>
                <h1 className="font-[var(--font-pixel)] text-xl sm:text-2xl lg:text-3xl text-primary mb-4">
                  <TypewriterText text="Vishwas Yogi" />
                </h1>
                <p className="font-mono text-lg sm:text-xl text-foreground mb-2">
                  <TypewriterText text="Full Stack Developer" delay={800} />
                </p>
                <p className="font-mono text-muted mt-4">
                  <TypewriterText
                    text="4 years shipping products, breaking things, fixing them."
                    delay={1500}
                  />
                </p>
                <p className="font-mono text-secondary mt-4">
                  <TypewriterText
                    text="Currently: Looking for my next quest 🗺️"
                    delay={2500}
                  />
                </p>
              </div>
            </div>
            <div className="hidden lg:block">
              <AsciiArt />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="terminal-card p-6 sm:p-8">
            <h2 className="font-[var(--font-pixel)] text-lg text-primary mb-6 cursor-blink">
              // ABOUT_ME
            </h2>
            <p className="font-mono text-foreground leading-relaxed mb-6">
              I build things that live on the internet. From robust backend
              systems to pixel-perfect frontends, I enjoy the entire spectrum of
              web development. When I&apos;m not debugging production issues at
              2 AM, you&apos;ll find me exploring new tech, contributing to open
              source, or pretending I understand distributed systems.
            </p>
            <div className="flex flex-wrap gap-3">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-sm px-3 py-1 border border-primary text-primary glow-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-lg sm:text-xl text-primary mb-8 cursor-blink">
            {">"} PROJECTS.exe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "terminal-card p-6 hover:glow-primary transition-all duration-300 group",
                  project.featured &&
                    "md:col-span-2 lg:col-span-1 border-primary",
                )}
              >
                {project.featured && (
                  <span className="font-mono text-[10px] text-secondary mb-2 block">
                    // FEATURED
                  </span>
                )}
                <h3 className="font-[var(--font-pixel)] text-sm text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="font-mono text-xs text-secondary mb-3">
                  {project.tagline}
                </p>
                <p className="font-mono text-sm text-muted mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] px-2 py-0.5 bg-border text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to={project.link}
                  className="font-mono text-sm text-primary hover:text-glow-primary transition-all border border-primary px-4 py-2 inline-block hover:bg-primary hover:text-background"
                >
                  {project.featured ? "[ VIEW PROJECT ]" : "[ LAUNCH ]"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adventures Section */}
      <section id="adventures" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-lg sm:text-xl text-primary mb-2 cursor-blink">
            {">"} SIDE_QUESTS.log
          </h2>
          <p className="font-mono text-sm text-muted mb-8">
            // because devs have lives too
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {adventures.map((adventure) => (
              <div
                key={adventure.title}
                className="terminal-card p-6 hover:glow-secondary transition-all duration-300 group border-secondary/30 hover:border-secondary"
              >
                <div className="text-3xl mb-3">{adventure.icon}</div>
                <h3 className="font-[var(--font-pixel)] text-xs text-secondary mb-2">
                  {adventure.title}
                </h3>
                <p className="font-mono text-sm text-muted">
                  {adventure.description}
                </p>
                <div className="mt-4 font-mono text-[10px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  ACHIEVEMENT UNLOCKED
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Section */}
      <section id="resume" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="terminal-card p-8 inline-block">
            <h2 className="font-[var(--font-pixel)] text-lg text-primary mb-4 cursor-blink">
              {">"} DOWNLOAD_RESUME
            </h2>
            <p className="font-mono text-muted mb-6">
              Want the full story? Get the PDF.
            </p>
            <a
              href="#"
              className="font-mono text-sm text-background bg-primary hover:bg-primary/90 px-6 py-3 inline-block glow-primary transition-all"
            >
              [ DOWNLOAD CV ]
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
