import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useDriverLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export default function DriverLogin() {
  const { loginDriver } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const loginMutation = useDriverLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        if (data.success && data.driverId) {
          loginDriver(data.driverId, data.name || email.split("@")[0]);
          setLocation("/driver/dashboard");
        } else {
          setError("Invalid email or password");
        }
      },
      onError: () => {
        setError("Invalid email or password. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center relative overflow-hidden sm:items-center">
      {/* Background Graphic for Mobile */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/driver-bg.png`} 
          alt="Abstract background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12 flex flex-col items-center">
        <div className="mb-8">
          <img 
            src={`${import.meta.env.BASE_URL}images/aces-logo.png`} 
            alt="ACES Logo" 
            className="h-20 object-contain drop-shadow-2xl"
          />
        </div>
        
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Driver Portal</h1>
          <p className="text-slate-400">Access your tasks and routes</p>
        </div>
        
        <form onSubmit={handleLogin} className="w-full space-y-4">
          {error && (
            <div className="bg-destructive/20 text-red-200 px-4 py-3 rounded-2xl text-sm font-medium border border-destructive/30 text-center backdrop-blur-md">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white/10 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:bg-white/20 transition-all text-base backdrop-blur-md"
                placeholder="Driver Email"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white/10 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:bg-white/20 transition-all text-base backdrop-blur-md"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/30 transition-all group"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
