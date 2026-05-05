import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormData, loginSchema, useLogin } from "@/lib/SecureLink";
import Header from "../components/Header";

export default function Login() {
  const [hovered, setHovered] = useState(false);
  const { mutateAsync: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (err) {
      setError("root", { message: "// error: invalid credentials" });
    }
  };

  return (
    <div className="min-h-screen bg-background scanlines flex flex-col">
      <Header showBack backTo="/securelink" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="terminal-card p-8 glow-primary">
            <h1 className="font-[var(--font-pixel)] text-xl text-primary mb-2 cursor-blink">
              {">"} SECURELINK_AUTH
            </h1>
            <p className="font-mono text-sm text-muted mb-8">
              // proving you are who you say you are
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ username:
                </label>
                <input
                  {...register("username")}
                  type="text"
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={isPending}
                />
                {errors.username && (
                  <p className="font-mono text-xs text-error mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ password:
                </label>
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={isPending}
                />
                {errors.password && (
                  <p className="font-mono text-xs text-error mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <div className="font-mono text-sm text-error bg-error/10 border border-error px-4 py-2">
                  {errors.root.message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isPending}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  className="w-full font-mono text-sm text-background bg-primary hover:bg-primary/90 disabled:bg-primary/50 px-6 py-3 glow-primary transition-all"
                >
                  {isPending ? (
                    <span className="loading-dots">AUTHENTICATING</span>
                  ) : (
                    "[ AUTHENTICATE ]"
                  )}
                </button>
                {hovered && !isPending && (
                  <p className="font-mono text-[10px] text-muted mt-2 text-center">
                    // we promise not to sell your data
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
