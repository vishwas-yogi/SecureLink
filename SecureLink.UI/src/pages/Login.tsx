import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock validation
    if (username === 'demo' && password === 'demo') {
      navigate('/dashboard')
    } else {
      setError('ERROR: invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background scanlines flex flex-col">
      <Header showBack backTo="/securelink" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="terminal-card p-8 glow-primary">
            <h1 className="font-[var(--font-pixel)] text-xl text-primary mb-2 cursor-blink">
              {'>'} SECURELINK_AUTH
            </h1>
            <p className="font-mono text-sm text-muted mb-8">
              // proving you are who you say you are
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ username:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="font-mono text-sm text-error bg-error/10 border border-error px-4 py-2">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  className="w-full font-mono text-sm text-background bg-primary hover:bg-primary/90 disabled:bg-primary/50 px-6 py-3 glow-primary transition-all"
                >
                  {loading ? (
                    <span className="loading-dots">AUTHENTICATING</span>
                  ) : (
                    '[ AUTHENTICATE ]'
                  )}
                </button>
                {hovered && !loading && (
                  <p className="font-mono text-[10px] text-muted mt-2 text-center">
                    // we promise not to sell your data
                  </p>
                )}
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="font-mono text-xs text-muted text-center">
                // hint: use demo / demo to test
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
