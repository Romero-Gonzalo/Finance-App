"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, pass);
      }
      router.push("/app");
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Fluxo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login" ? "Iniciá sesión" : "Creá tu cuenta"} para guardar tus movimientos.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm">Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm">Contraseña</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="mínimo 6 caracteres"
              type="password"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            className="w-full rounded-xl border px-3 py-2 font-medium"
            disabled={busy}
          >
            {busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          className="mt-4 text-sm underline"
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
        >
          {mode === "login" ? "No tengo cuenta (registrarme)" : "Ya tengo cuenta (iniciar sesión)"}
        </button>
      </div>
    </main>
  );
}
