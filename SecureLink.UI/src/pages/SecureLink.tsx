import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const techStack = ['.NET', 'Python', 'DeepFace', 'pgvector', 'PostgreSQL', 'React', 'TypeScript', 'Docker']

const steps = [
  {
    command: "$ upload_photos --event='birthday_2024'",
    description: 'Upload your event photos. We index every face in the background.',
  },
  {
    command: '$ upload_selfie --find-me=true',
    description: 'Take a quick selfie. Our AI extracts your facial features.',
  },
  {
    command: '$ profit ???',
    description: 'Get all photos featuring you in seconds. No scrolling required.',
  },
]

export default function SecureLink() {
  return (
    <div className="min-h-screen bg-background scanlines">
      <Header showBack backTo="/" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-[var(--font-pixel)] text-3xl sm:text-4xl lg:text-5xl text-primary mb-6 glitch">
            SECURELINK
          </h1>
          <p className="font-mono text-lg sm:text-xl text-foreground mb-8">
            Your face. Your photos. No scrolling through 500 event pics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="font-mono text-sm text-background bg-primary hover:bg-primary/90 px-8 py-3 glow-primary transition-all w-full sm:w-auto text-center"
            >
              [ LOGIN ]
            </Link>
            <a
              href="#how-it-works"
              className="font-mono text-sm text-primary border border-primary hover:bg-primary hover:text-background px-8 py-3 transition-all w-full sm:w-auto text-center"
            >
              [ LEARN MORE ]
            </a>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-lg sm:text-xl text-primary mb-8 cursor-blink">
            {'>'} HOW_IT_WORKS
          </h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="terminal-card p-6 hover:glow-primary transition-all">
                <p className="font-mono text-primary text-sm sm:text-base mb-2">
                  {step.command}
                </p>
                <p className="font-mono text-muted text-sm pl-4 border-l-2 border-border">
                  // {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-lg sm:text-xl text-primary mb-8">
            // BUILT_WITH
          </h2>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="font-mono text-sm px-4 py-2 border border-primary text-primary glow-primary hover:bg-primary hover:text-background transition-all cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-lg sm:text-xl text-primary mb-8 cursor-blink">
            {'>'} FEATURES.list
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="terminal-card p-6">
              <h3 className="font-mono text-secondary text-sm mb-2">// PRIVACY_FIRST</h3>
              <p className="font-mono text-muted text-sm">
                Your photos never leave our secure servers. Face embeddings are stored, not your actual face data.
              </p>
            </div>
            <div className="terminal-card p-6">
              <h3 className="font-mono text-secondary text-sm mb-2">// BLAZING_FAST</h3>
              <p className="font-mono text-muted text-sm">
                Vector similarity search powered by pgvector. Results in milliseconds, not minutes.
              </p>
            </div>
            <div className="terminal-card p-6">
              <h3 className="font-mono text-secondary text-sm mb-2">// ACCURATE_AF</h3>
              <p className="font-mono text-muted text-sm">
                DeepFace provides state-of-the-art facial recognition. Even finds you in group photos.
              </p>
            </div>
            <div className="terminal-card p-6">
              <h3 className="font-mono text-secondary text-sm mb-2">// BATCH_UPLOAD</h3>
              <p className="font-mono text-muted text-sm">
                Drop hundreds of photos at once. We handle the processing in the background.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="terminal-card p-8 glow-secondary border-secondary">
            <h2 className="font-[var(--font-pixel)] text-lg text-secondary mb-4">
              {'>'} READY_TO_START?
            </h2>
            <p className="font-mono text-muted mb-6">
              Stop scrolling. Start finding.
            </p>
            <Link
              to="/login"
              className="font-mono text-sm text-background bg-secondary hover:bg-secondary/90 px-8 py-3 inline-block glow-secondary transition-all"
            >
              [ GET STARTED ]
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
