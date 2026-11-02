"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Radio } from "lucide-react";
import { safeDestination, sessionKey, validateCredentials } from "@/lib/demo-auth";
import { siteConfig } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    document.title = `Sign in | ${siteConfig.name}`;
    try {
      if (sessionStorage.getItem(sessionKey)) router.replace(safeDestination(new URLSearchParams(window.location.search).get("next")));
    } catch { /* The form explains storage errors on submission. */ }
  }, [router]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const account = validateCredentials(username, password);
    if (!account) { setError("Incorrect username or password. Please try again."); return; }
    try { sessionStorage.setItem(sessionKey, account); }
    catch { setError("Allow browser storage to sign in, then try again."); return; }
    setPending(true);
    router.replace(safeDestination(new URLSearchParams(window.location.search).get("next")));
  }
  return <div className="login-page">
    <div className="login-brand brand"><span className="brand-icon"><Radio size={22} /></span><span><b>{siteConfig.name}</b><i /></span></div>
    <section className="login-card" aria-labelledby="login-title">
      <span className="eyebrow">YOUR NEXT FAVORITE MOMENT</span>
      <h1 id="login-title">A little closer<br />to <em>home.</em></h1>
      <p>Sign in to watch your favorite TV channels.</p>
      <form method="post" onSubmit={submit} className="login-form">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={event => setUsername(event.target.value)} aria-describedby={error ? "login-error" : undefined} aria-invalid={!!error} />
        <label htmlFor="password">Password</label>
        <div className="login-password"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} aria-describedby={error ? "login-error" : undefined} aria-invalid={!!error} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {error && <p id="login-error" className="login-error" role="alert">{error}</p>}
        <button className="button button-primary login-submit" disabled={pending || !ready} type="submit">{pending ? "Signing in…" : "Sign in"}<ArrowRight size={17} /></button>
      </form>
      <p className="login-help">Need access? Contact your account administrator.</p>
    </section>
    <p className="login-caption">Live news. Great entertainment. A familiar feeling.</p>
  </div>;
}
