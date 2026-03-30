import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, Wrench } from "lucide-react";

export default function TechnicianLogin() {
  const { loginTechnician } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("ahmed@aces-sa.com");
  const [password, setPassword] = useState("Tech@1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/technician/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loginTechnician(data.technicianId, data.name, data.zone);
        setLocation("/technician/dashboard");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1E3E] flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#E30613]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm z-10 space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E30613] to-[#a01010] shadow-2xl shadow-[#E30613]/30">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Technician Portal</h1>
            <p className="text-slate-400 mt-1 text-sm">Daily Fueling Follow-up System</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="pl-12 h-14 bg-white/10 border-white/10 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-[#E30613] focus-visible:border-[#E30613]"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="pl-12 h-14 bg-white/10 border-white/10 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-[#E30613] focus-visible:border-[#E30613]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-14 rounded-2xl bg-[#E30613] hover:bg-[#c01010] text-white font-bold text-base shadow-lg shadow-[#E30613]/25 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-slate-600 text-xs">ACES Managed Services · Technician Access</p>
        </div>
      </div>
    </div>
  );
}
