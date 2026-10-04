"use client";

import { useState } from "react";

export function LoginForm({ siteName, logoUrl, hint }: { siteName: string; logoUrl: string; hint: { email: string; password: string } | null }) {
  const [identifier, setIdentifier] = useState(hint?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await response.json();
    setPending(false);
    if (!json.ok) {
      setError(json.error || "تعذر الدخول");
      return;
    }
    window.location.href = "/admin";
  }
  return (
    <div className="grid min-h-screen place-items-center bg-[#07101f] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#d4af37]/30 bg-[#0c1730] p-6 text-white">
        <img src={logoUrl} alt="" className="mx-auto h-24 w-24 object-contain" />
        <h1 className="mt-3 text-center text-2xl font-extrabold text-[#f0d78c]">{siteName}</h1>
        <p className="mb-5 text-center text-sm text-[#c5cde0]">دخول لوحة التحكم</p>
        {hint && (
          <div className="mb-4 rounded-2xl border border-[#d4af37]/30 p-3 text-sm leading-7 text-[#f7f4ec]">
            <p className="font-bold text-[#f0d78c]">بيانات الدخول الأولية للمالك</p>
            <p>البريد: {hint.email}</p>
            <p>كلمة المرور: {hint.password}</p>
            <p>يمكن تغييرها وإخفاء هذه الملاحظة من الإعدادات.</p>
          </div>
        )}
        <div className="grid gap-3">
          <input className="field" placeholder="البريد أو الهاتف" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          <input className="field" type="password" placeholder="كلمة المرور" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-gold" disabled={pending}>{pending ? "جارٍ الدخول..." : "دخول"}</button>
        </div>
      </form>
    </div>
  );
}
