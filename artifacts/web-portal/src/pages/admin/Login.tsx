import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { useAdminLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";

const WIN_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];
const WIN_COLS_3 = [0, 1, 2];
const WIN_COLS_4 = [0, 1, 2, 3];
const WIN_COLS_7 = [0, 1, 2, 3, 4, 5, 6];
const BRACE_ROWS = [230, 290, 350, 410, 470, 530, 590, 650];
const BRACE_DIAG = [230, 290, 350, 410, 470, 530, 590];
const SIGNAL_RADII = [40, 70, 100, 130];
const RING_RADII = [160, 220, 280];
const STARS = [
  [80,60],[200,30],[350,80],[500,40],[650,20],[800,55],[950,35],[1100,65],[1280,25],[1380,50],
  [140,130],[300,110],[460,140],[600,90],[760,120],[900,95],[1050,130],[1200,100],[50,170],[1400,145],
  [240,200],[420,180],[580,210],[740,190],[900,170],[1060,200],[1220,185],[1340,220],
];
const ROAD_MARKS = [100,200,300,400,500,600,700,800,900,1000,1100,1200,1300];
const NET_LINES: [number,number,number,number][] = [
  [590, 190, 1300, 165],
  [840, 110, 1300, 165],
  [355, 306, 1300, 165],
];

function RiyadhBackground() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060f1e" />
          <stop offset="55%" stopColor="#0B1E3E" />
          <stop offset="100%" stopColor="#0d2448" />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2448" />
          <stop offset="100%" stopColor="#061020" />
        </linearGradient>
        <radialGradient id="towerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E30613" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#E30613" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cityGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#1a3a6e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0B1E3E" stopOpacity="0" />
        </radialGradient>
        <filter id="blur4"><feGaussianBlur stdDeviation="4" /></filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="1440" height="900" fill="url(#skyGrad)" />
      <ellipse cx="720" cy="680" rx="700" ry="200" fill="url(#cityGlow)" />

      {/* Stars */}
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1} fill="white" opacity={0.35 + (i % 4) * 0.1} />
      ))}

      {/* Ground */}
      <rect x="0" y="760" width="1440" height="140" fill="url(#groundGrad)" />
      <rect x="0" y="758" width="1440" height="3" fill="#0e2550" opacity="0.6" />
      {ROAD_MARKS.map((x, i) => (
        <rect key={i} x={x} y="800" width="60" height="4" rx="2" fill="#1e3a6e" opacity="0.35" />
      ))}

      {/* ── Left cluster ── */}
      <rect x="30" y="640" width="80" height="120" fill="#0f1e3d" />
      {[0,1,2,3].map(r => WIN_COLS_3.map(c => (
        <rect key={`a${r}${c}`} x={42+c*22} y={648+r*26} width="14" height="16" rx="1" fill="#1a3060" opacity="0.6" />
      )))}
      <rect x="55" y="622" width="50" height="20" fill="#112245" />

      <rect x="120" y="592" width="100" height="168" fill="#112245" />
      {[0,1,2,3,4].map(r => WIN_COLS_4.map(c => (
        <rect key={`b${r}${c}`} x={127+c*23} y={601+r*30} width="14" height="18" rx="1" fill="#1e3870" opacity="0.45" />
      )))}
      <rect x="130" y="576" width="80" height="18" fill="#0e2244" />

      <rect x="230" y="660" width="70" height="100" fill="#0f1e3d" />
      {[0,1,2].map(r => [0,1].map(c => (
        <rect key={`c${r}${c}`} x={240+c*28} y={668+r*28} width="14" height="16" rx="1" fill="#1a3060" opacity="0.4" />
      )))}

      {/* ── Al Faisaliah Tower ── */}
      <rect x="310" y="460" width="90" height="300" fill="#132650" />
      <rect x="320" y="460" width="70" height="300" fill="#0f2248" />
      {WIN_ROWS.map(r => WIN_COLS_3.map(c => (
        <rect key={`d${r}${c}`} x={323+c*22} y={468+r*34} width="14" height="20" rx="1" fill="#1e3a70" opacity="0.45" />
      )))}
      <polygon points="355,352 400,460 310,460" fill="#1a2e5a" />
      <rect x="312" y="455" width="86" height="8" fill="#c9a227" opacity="0.5" />
      <line x1="355" y1="340" x2="355" y2="310" stroke="#c9a227" strokeWidth="3" />
      <circle cx="355" cy="306" r="4" fill="#E30613" opacity="0.9" filter="url(#glow)" />

      {/* ── Kingdom Centre Tower ── */}
      <rect x="490" y="265" width="50" height="495" fill="#112450" />
      <rect x="640" y="265" width="50" height="495" fill="#112450" />
      <rect x="475" y="612" width="230" height="148" fill="#112450" />
      <rect x="480" y="452" width="220" height="58" fill="#1e3570" />
      <path d="M540 265 Q590 165 640 265" fill="none" stroke="#1e3570" strokeWidth="28" />
      {[0,1,2,3,4,5,6,7,8,9].map(r => (
        <rect key={`e${r}`} x={498} y={272+r*34} width="34" height="22" rx="2" fill="#1e3a72" opacity="0.45" />
      ))}
      {[0,1,2,3,4,5,6,7,8,9].map(r => (
        <rect key={`f${r}`} x={648} y={272+r*34} width="34" height="22" rx="2" fill="#1e3a72" opacity="0.45" />
      ))}
      {[0,1,2,3,4,5,6,7].map(r => WIN_COLS_7.map(c => (
        <rect key={`g${r}${c}`} x={482+c*30} y={618+r*18} width="20" height="11" rx="1" fill="#1e3a72" opacity="0.35" />
      )))}
      <ellipse cx="590" cy="222" rx="80" ry="28" fill="#E30613" opacity="0.1" filter="url(#blur4)" />
      <circle cx="590" cy="192" r="6" fill="#E30613" opacity="0.9" filter="url(#glow)" />
      <line x1="590" y1="186" x2="590" y2="162" stroke="#E30613" strokeWidth="2" opacity="0.6" />

      {/* ── Riyadh Tower (tallest) ── */}
      <rect x="800" y="202" width="80" height="558" fill="#0f2040" />
      <line x1="835" y1="202" x2="835" y2="760" stroke="#1e3870" strokeWidth="2" opacity="0.45" />
      <line x1="850" y1="202" x2="850" y2="760" stroke="#1e3870" strokeWidth="2" opacity="0.45" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(r => [0,1].map(c => (
        <rect key={`h${r}${c}`} x={810+c*32} y={212+r*45} width="22" height="28" rx="2" fill="#1e3a72" opacity="0.45" />
      )))}
      <rect x="812" y="182" width="56" height="22" fill="#142550" />
      <rect x="820" y="164" width="40" height="20" fill="#142550" />
      <rect x="827" y="150" width="26" height="16" fill="#112040" />
      <line x1="840" y1="150" x2="840" y2="112" stroke="#c0c8d8" strokeWidth="3" />
      <circle cx="840" cy="110" r="5" fill="#E30613" opacity="0.95" filter="url(#glow)" />

      {/* ── Right cluster ── */}
      <rect x="900" y="532" width="85" height="228" fill="#0f2040" />
      {[0,1,2,3].map(r => WIN_COLS_3.map(c => (
        <rect key={`i${r}${c}`} x={908+c*25} y={542+r*50} width="16" height="30" rx="1" fill="#1a3060" opacity="0.45" />
      )))}
      <rect x="1000" y="582" width="70" height="178" fill="#0f1e3d" />
      {[0,1,2].map(r => [0,1].map(c => (
        <rect key={`j${r}${c}`} x={1013+c*25} y={592+r*50} width="16" height="30" rx="1" fill="#1a3060" opacity="0.4" />
      )))}
      <rect x="1085" y="562" width="90" height="198" fill="#132447" />
      <rect x="1090" y="556" width="80" height="24" fill="#1a2e5a" />
      {[0,1,2,3].map(r => WIN_COLS_3.map(c => (
        <rect key={`k${r}${c}`} x={1093+c*25} y={566+r*45} width="16" height="28" rx="1" fill="#1e3870" opacity="0.38" />
      )))}
      <rect x="1190" y="612" width="110" height="148" fill="#0e1e3a" />
      <rect x="1195" y="606" width="100" height="10" fill="#142550" />
      {[0,1,2].map(r => WIN_COLS_4.map(c => (
        <rect key={`l${r}${c}`} x={1200+c*24} y={618+r*43} width="16" height="28" rx="1" fill="#1a3060" opacity="0.38" />
      )))}
      <rect x="1315" y="652" width="75" height="108" fill="#0f1e3a" />
      <rect x="1405" y="692" width="35" height="68" fill="#0e1d38" />

      {/* ══════ GSM TOWER ══════ */}
      <ellipse cx="1100" cy="520" rx="140" ry="140" fill="url(#towerGlow)" filter="url(#blur4)" />

      {/* Lattice legs */}
      <line x1="1100" y1="200" x2="1050" y2="680" stroke="#243d72" strokeWidth="5" strokeLinecap="round" />
      <line x1="1100" y1="200" x2="1150" y2="680" stroke="#243d72" strokeWidth="5" strokeLinecap="round" />
      <line x1="1100" y1="200" x2="1100" y2="680" stroke="#1e3870" strokeWidth="3" />

      {/* Horizontal braces */}
      {BRACE_ROWS.map((y, i) => {
        const sp = 6 + i * 6;
        return <line key={y} x1={1100-sp} y1={y} x2={1100+sp} y2={y} stroke="#2a4880" strokeWidth="3" opacity="0.9" />;
      })}

      {/* Diagonal braces */}
      {BRACE_DIAG.map((y, i) => {
        const s1 = 6 + i * 6;
        const s2 = 6 + (i+1) * 6;
        return (
          <g key={y}>
            <line x1={1100-s1} y1={y} x2={1100+s2} y2={y+60} stroke="#2a4880" strokeWidth="2" opacity="0.65" />
            <line x1={1100+s1} y1={y} x2={1100-s2} y2={y+60} stroke="#2a4880" strokeWidth="2" opacity="0.65" />
          </g>
        );
      })}

      {/* Platform */}
      <ellipse cx="1100" cy="212" rx="28" ry="8" fill="#1e3870" />
      <rect x="1072" y="206" width="56" height="10" rx="3" fill="#243d80" />

      {/* Antenna mast */}
      <rect x="1094" y="142" width="12" height="70" rx="3" fill="#2a4880" />

      {/* Side arms */}
      <rect x="1056" y="167" width="44" height="8" rx="2" fill="#243d72" />
      <rect x="1056" y="167" width="8" height="25" rx="2" fill="#1e3870" />
      <rect x="1100" y="167" width="44" height="8" rx="2" fill="#243d72" />
      <rect x="1136" y="167" width="8" height="25" rx="2" fill="#1e3870" />
      <rect x="1058" y="177" width="6" height="30" rx="2" fill="#344e8a" />
      <rect x="1136" y="177" width="6" height="30" rx="2" fill="#344e8a" />

      {/* Top beacon */}
      <circle cx="1100" cy="137" r="5" fill="#E30613" opacity="0.95" filter="url(#glow)" />
      <circle cx="1100" cy="137" r="12" fill="#E30613" opacity="0.15" />

      {/* Signal arcs – left */}
      {SIGNAL_RADII.map((r, i) => (
        <path key={`sl${i}`}
          d={`M ${1100-r} 167 A ${r} ${r} 0 0 1 ${1100} ${167-r}`}
          fill="none" stroke="#E30613"
          strokeWidth={1.5 - i * 0.25}
          opacity={0.55 - i * 0.1}
          strokeDasharray={i % 2 === 0 ? undefined : "6 4"}
        />
      ))}
      {/* Signal arcs – right */}
      {SIGNAL_RADII.map((r, i) => (
        <path key={`sr${i}`}
          d={`M ${1100+r} 167 A ${r} ${r} 0 0 0 ${1100} ${167-r}`}
          fill="none" stroke="#E30613"
          strokeWidth={1.5 - i * 0.25}
          opacity={0.55 - i * 0.1}
          strokeDasharray={i % 2 === 0 ? undefined : "6 4"}
        />
      ))}
      {/* Full signal rings */}
      {RING_RADII.map((r, i) => (
        <circle key={`rr${i}`} cx="1100" cy="167" r={r}
          fill="none" stroke="#E30613" strokeWidth="0.8" opacity={0.12 - i * 0.03} />
      ))}

      {/* GSM label */}
      <text x="1100" y="718" textAnchor="middle" fill="#2a4a80" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="4" opacity="0.55">GSM</text>

      {/* Network connection lines from buildings to tower */}
      {NET_LINES.map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#E30613" strokeWidth="0.8" opacity="0.14" strokeDasharray="8 6" />
      ))}

      {/* Dot grid overlay */}
      {Array.from({length:18}).map((_,row) =>
        Array.from({length:36}).map((_,col) => (
          <circle key={`${row}-${col}`} cx={20+col*40} cy={20+row*40} r="1" fill="white" opacity="0.04" />
        ))
      )}

      {/* Horizon accent */}
      <rect x="0" y="757" width="1440" height="2" fill="#1e4080" opacity="0.4" />
      <rect x="0" y="755" width="1440" height="3" fill="#E30613" opacity="0.07" />
    </svg>
  );
}

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
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#060f1e]">
      {/* SVG illustrated background */}
      <div className="absolute inset-0 z-0">
        <RiyadhBackground />
      </div>

      {/* Gradient overlay so left-side card is legible */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#060f1e]/95 via-[#0B1E3E]/65 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6">
        <div className="mb-8 flex justify-center">
          <img
            src={`${import.meta.env.BASE_URL}images/aces-logo.png`}
            alt="ACES Logo"
            className="h-36 object-contain drop-shadow-2xl"
          />
        </div>

        <Card
          className="border border-white/10 shadow-2xl rounded-3xl p-2 w-full max-w-md backdrop-blur-xl"
          style={{ background: "rgba(6,15,30,0.80)" }}
        >
          <CardContent className="p-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400 mb-8">Sign in to the ACES Operations Portal.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Username</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-red-500/40 focus-visible:bg-white/8 transition-all text-base"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-red-500/40 focus-visible:bg-white/8 transition-all text-base"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-14 rounded-xl bg-[#E30613] hover:bg-[#c50511] text-white font-bold text-lg shadow-lg shadow-red-900/40 transition-all group"
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
