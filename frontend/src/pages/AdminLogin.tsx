import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { adminLogin } from "../lib/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      if (res.success) {
        navigate("/admin", { replace: true });
      } else {
        setError(res.message || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header showSettings={false} />
      <main className="mx-auto flex max-w-sm flex-col px-6 py-16">
        <h1 className="mb-1 text-2xl font-black tracking-tight">Admin sign in</h1>
        <p className="mb-6 text-sm text-ink/60">Manage the API collection and credentials.</p>
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/70" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 outline-none focus:border-ink/40"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/70" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 outline-none focus:border-ink/40"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
