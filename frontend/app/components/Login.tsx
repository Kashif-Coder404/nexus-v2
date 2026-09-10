"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserCredentials } from "../store/useUserCredentials";
import { Loader, LoaderIcon } from "lucide-react";

const Login = (): React.JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const router = useRouter();
  const setCredentials = useUserCredentials((state) => state.setCredentials);
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFetchError(null);
    setIsLoading(true);
    if (!email || !password) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const cloudbackendUrl = "https://nexus-v2-e38m.onrender.com";

    try {
      const res = await fetch(`${cloudbackendUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      if (res.status === 401) {
        setFetchError(new Error("Invalid Credentials!"));
        return;
      }
      const data = await res.json();
      console.log(data);
      if (data.success) {
        setCredentials(data.data.token, data.data.user);
        router.push("/dashboard");
      } else {
        throw new Error(data.message || "LOGIN FAILED!");
      }
    } catch (error: any) {
      console.log(error.message);
      if (error.message.includes("Failed to fetch")) {
        setFetchError(new Error("Server Is Not Responding!"));
      } else {
        setFetchError(error);
      }
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };
  useEffect(() => {
    if (fetchError) {
      const fetchErrorTimeout = setTimeout(() => {
        setFetchError(null);
      }, 5000);
      return () => clearTimeout(fetchErrorTimeout);
    }
  }, [fetchError]);
  return (
    <div className={style.container}>
      <div className={style.card}>
        <h1 className={style.title}>Log in</h1>
        {fetchError ? (
          <div className={style.error}>
            <p>{fetchError.message}</p>
          </div>
        ) : (
          <p className={style.subtitle}>Welcome back to Nexus</p>
        )}
        <div id="form" className={style.formWrapper}>
          <form onSubmit={handleLogin} className={style.form}>
            <div className={style.inputGroup}>
              <label htmlFor="email" className={style.label}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setFetchError(null);
                  setEmail(e.target.value);
                }}
                required
                className={style.input}
              />
            </div>
            <div className={style.inputGroup}>
              <label htmlFor="password" className={style.label}>
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Enter your password"
                id="password"
                value={password}
                onChange={(e) => {
                  setFetchError(null);
                  setPassword(e.target.value);
                }}
                className={style.input}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={style.submitBtn}
            >
              {isLoading ? (
                <LoaderIcon className="animate-spin" size={24} />
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className={style.footerText}>
            Don&apos;t have an account?
            <Link href="/auth/signup" className={style.footerLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const style = {
  container: "flex flex-1 items-start justify-center p-4 sm:p-6 my-20",
  card: "w-full max-w-md rounded-2xl border border-purple-900/30 bg-zinc-950/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl",
  title: "text-center text-3xl font-bold tracking-tight text-[#DCD3FF]",
  subtitle: "text-center mt-2 text-sm text-[#8A859E]",
  formWrapper: "mt-8",
  error: "text-red-500 text-center m-2 text-xl",
  form: "flex flex-col gap-5",
  inputGroup: "flex flex-col gap-1.5",
  label: "text-xs font-semibold uppercase tracking-wider text-[#DCD3FF]/80",
  input:
    "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:border-[#7357E2] focus:ring-2 focus:ring-[#7357E2]/30 focus:outline-none transition",
  submitBtn:
    "mt-2 w-full flex items-center justify-center rounded-xl py-3 px-4 text-white text-base font-bold bg-linear-to-r from-[#7357E2] to-[#9129b6] shadow-lg shadow-purple-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  footerText: "text-center text-sm text-[#8A859E] mt-6",
  footerLink:
    "font-semibold text-[#DCD3FF] hover:text-white hover:underline transition-colors ml-1",
};

export default Login;
