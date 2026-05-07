import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import {
  RegisterFormData,
  registerSchema,
  useRegister,
} from "@/lib/SecureLink";
import { useEffect } from "react";

export default function Register() {
  const navigate = useNavigate();
  const {
    mutateAsync: signIn,
    isPending: isLoading,
    isSuccess,
  } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signIn(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const apiErrors = err.response.data;
        Object.entries(apiErrors).forEach(([field, message]) => {
          if (!message) return;

          if (field === "message") {
            setError("root", { message: "// error: something went wrong" });
            return;
          }
          setError(field as keyof RegisterFormData, {
            message: `// error: ${message}`,
          });
        });
        return;
      }
      setError("root", { message: "// error: something went wrong" });
    }
  };

  return (
    <div className="min-h-screen bg-background scanlines flex flex-col">
      <Header showBack backTo="/login" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="terminal-card p-8 glow-primary">
            <h1 className="font-[var(--font-pixel)] text-xl text-primary mb-2 cursor-blink">
              {">"} SECURELINK_REGISTER
            </h1>
            <p className="font-mono text-sm text-muted mb-8">
              // join the network
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ name:
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={isLoading}
                />
                {errors.name && (
                  <div className="font-mono text-sm text-error bg-error/10 border border-error px-4 py-2">
                    {errors.name.message}
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ email:
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={isLoading}
                />
                {errors.email && (
                  <div className="font-mono text-sm text-error bg-error/10 border border-error px-4 py-2">
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ username:
                </label>
                <input
                  type="text"
                  {...register("username")}
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={isLoading}
                />
                {errors.username && (
                  <div className="font-mono text-sm text-error bg-error/10 border border-error px-4 py-2">
                    {errors.username.message}
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono text-sm text-muted block mb-2">
                  $ password:
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full bg-background border border-border px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="[_________]"
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="font-mono text-sm text-error bg-error/10 border border-error px-4 py-2">
                    {errors.password.message}
                  </div>
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
                  disabled={isLoading}
                  className="w-full font-mono text-sm text-background bg-primary hover:bg-primary/90 disabled:bg-primary/50 px-6 py-3 glow-primary transition-all"
                >
                  {isLoading ? (
                    <span className="loading-dots">REGISTERING</span>
                  ) : (
                    "[ CREATE ACCOUNT ]"
                  )}
                </button>
              </div>
            </form>

            {isSuccess && (
              <div className="font-mono text-sm border border-primary bg-primary/10 px-4 py-3 mt-2">
                <span className="text-primary">{">"} REGISTRATION_SUCCESS</span>
                <p className="text-muted mt-1 text-xs">
                  // redirecting to login in 3 seconds
                  <span className="cursor-blink">_</span>
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border">
              <p className="font-mono text-xs text-muted text-center mb-4">
                // already have an account?
              </p>
              <Link
                to="/login"
                className="block text-center font-mono text-sm text-primary hover:text-secondary transition-colors underline"
              >
                [ SIGN IN ]
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
