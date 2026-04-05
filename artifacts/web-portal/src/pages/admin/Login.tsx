import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { useAdminLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export default function Login() {
  const { loginAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("Bannaga");
  const [password, setPassword] = useState("Aces@6343");
  const [error, setError] = useState("");
  
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    loginMutation.mutate({ data: { username, password } }, {
      onSuccess: (data) => {
        if (data.success) {
          loginAdmin(data.username || username, data.role || "superadmin");
          setLocation("/");
        } else {
          setError("Invalid credentials");
        }
      },
      onError: () => {
        setError("Invalid credentials. Please check your username and password.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract background" 
          className="w-full h-full object-cover opacity-60 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 to-transparent" />
      </div>

      <div className="relative z-10 w-full flex flex-col justify-center max-w-xl px-8 lg:px-16">
        <div className="mb-12">
          <img 
            src={`${import.meta.env.BASE_URL}images/aces-logo.png`} 
            alt="ACES Logo" 
            className="h-20 object-contain drop-shadow-xl"
          />
        </div>
        
        <Card className="glass-panel border-0 shadow-2xl rounded-3xl p-2">
          <CardContent className="p-8">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500 mb-8">Sign in to the ACES Operations Portal.</p>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium border border-destructive/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-primary focus-visible:bg-white transition-all text-base"
                    placeholder="Enter username"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-primary focus-visible:bg-white transition-all text-base"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/30 transition-all group"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Sign In to Portal
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
