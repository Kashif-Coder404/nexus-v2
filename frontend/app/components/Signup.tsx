"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserCredentials } from "../store/useUserCredentials";

const Signup = () => {
  const setCredentials = useUserCredentials((state) => state.setCredentials);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [fetchError, setFetchError] = useState<Error | null>(null);
  const router = useRouter();
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFetchError(null);
    setIsLoading(true);
    if (!email || !password || !name) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    try {
      const res = await fetch(`${backendUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });
      if (res.status === 400) {
        setFetchError(new Error("User Already Exists!"));
        return;
      }
      const data = await res.json();
      console.log(data);
      if (data.success) {
        setCredentials(data.data.token, data.data.user);
        router.push("/dashboard");
      } else {
        throw new Error(data.message || "SIGNUP FAILED!");
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
        <h1 className={style.title}>Sign Up</h1>
        {fetchError ? (
          <div className={style.error}>
            <p>{fetchError.message}</p>
          </div>
        ) : (
          <p className={style.subtitle}>Get your Desktop AI Today</p>
        )}
        <div id="form" className={style.formWrapper}>
          <form onSubmit={handleSignup} className={style.form}>
            <div className={style.inputGroup}>
              <label htmlFor="name" className={style.label}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                maxLength={20}
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={style.input}
              />
            </div>
            <div className={style.inputGroup}>
              <label htmlFor="email" className={style.label}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Enter your password..."
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={style.input}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={style.submitBtn}
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          <p className={style.footerText}>
            Already have an account?
            <Link href="/auth/login" className={style.footerLink}>
              Log in
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
  form: "flex flex-col gap-5",
  inputGroup: "flex flex-col gap-1.5",
  error: "text-red-500 text-center m-2 text-xl",
  label: "text-xs font-semibold uppercase tracking-wider text-[#DCD3FF]/80",
  input:
    "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:border-[#7357E2] focus:ring-2 focus:ring-[#7357E2]/30 focus:outline-none transition",
  submitBtn:
    "mt-2 w-full flex items-center justify-center rounded-xl py-3 px-4 text-white text-base font-bold bg-linear-to-r from-[#7357E2] to-[#9129b6] shadow-lg shadow-purple-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  footerText: "text-center text-sm text-[#8A859E] mt-6",
  footerLink:
    "font-semibold text-[#DCD3FF] hover:text-white hover:underline transition-colors ml-1",
};

export default Signup;
