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
const BRACE_ROWS = [230, 290, 350, 410, 470, 530, 590, 650, 710, 770, 830, 890];
const BRACE_DIAG = [230, 290, 350, 410, 470, 530, 590, 650, 710, 770, 830];
const SIGNAL_RADII = [40, 70, 100, 130];
const RING_RADII = [160, 220, 280];
const ROAD_MARKS = [100,200,300,400,500,600,700,800,900,1000,1100,1200,1300];
const NET_LINES: [number,number,number,number][] = [
  [590, 190, 1300, 165],
  [840, 110, 1300, 165],
  [355, 306, 1300, 165],
];

function RiyadhBackground() {
  return (
    <svg viewBox="-80 -80 1600 1060" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="45%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#f0f9ff" />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <radialGradient id="towerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E30613" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#E30613" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cityGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
        </radialGradient>
        <filter id="blur4"><feGaussianBlur stdDeviation="4" /></filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect x="-100" y="-100" width="1700" height="1200" fill="url(#skyGrad)" />
      <ellipse cx="720" cy="680" rx="700" ry="200" fill="url(#cityGlow)" />

      {/* Sun */}
      <circle cx="200" cy="120" r="55" fill="#fef08a" opacity="0.7" filter="url(#blur4)" />
      <circle cx="200" cy="120" r="38" fill="#fde047" opacity="0.55" />

      {/* Clouds */}
      <ellipse cx="380" cy="90" rx="90" ry="32" fill="white" opacity="0.85" />
      <ellipse cx="420" cy="78" rx="65" ry="26" fill="white" opacity="0.9" />
      <ellipse cx="340" cy="95" rx="55" ry="22" fill="white" opacity="0.8" />
      <ellipse cx="900" cy="60" rx="80" ry="28" fill="white" opacity="0.75" />
      <ellipse cx="940" cy="50" rx="55" ry="22" fill="white" opacity="0.8" />
      <ellipse cx="1200" cy="100" rx="70" ry="24" fill="white" opacity="0.7" />
      <ellipse cx="1240" cy="90" rx="50" ry="20" fill="white" opacity="0.75" />

      {/* Ground */}
      <rect x="-100" y="760" width="1700" height="300" fill="url(#groundGrad)" />
      <rect x="-100" y="758" width="1700" height="3" fill="#94a3b8" opacity="0.4" />
      {ROAD_MARKS.map((x, i) => (
        <rect key={i} x={x} y="800" width="60" height="4" rx="2" fill="#94a3b8" opacity="0.25" />
      ))}

      {/* ══════ Al-Masjid an-Nabawi — Prophet's Mosque, Madinah ══════ */}

      {/* ── Mosque main body ── */}
      <rect x="10" y="692" width="400" height="68" fill="#e6ecf5" />
      {/* Stepped roofline */}
      <rect x="10" y="682" width="400" height="12" fill="#dde4ef" />

      {/* Front arched arcade */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <path key={`nb${i}`}
          d={`M ${14+i*38} 760 L ${14+i*38} 732 Q ${33+i*38} 716 ${52+i*38} 732 L ${52+i*38} 760`}
          fill="#cdd7eb" />
      ))}

      {/* ── Green Dome (iconic, over Prophet's tomb) ── */}
      <ellipse cx="205" cy="678" rx="58" ry="32" fill="#6db98a" opacity="0.7" />
      <ellipse cx="205" cy="675" rx="46" ry="26" fill="#7ec89a" opacity="0.8" />
      <ellipse cx="205" cy="673" rx="34" ry="18" fill="#8fd4a8" opacity="0.85" />
      {/* Drum base of dome */}
      <rect x="163" y="678" width="84" height="14" fill="#c5d5e8" />
      {/* Gold finial + crescent */}
      <rect x="202" y="648" width="6" height="26" rx="2" fill="#c9a227" opacity="0.85" />
      <path d="M197 647 Q205 634 213 647 Q205 640 197 647" fill="#c9a227" opacity="0.95" />
      <circle cx="205" cy="631" r="3" fill="#c9a227" opacity="0.8" />

      {/* ── Secondary domes along roofline ── */}
      <ellipse cx="125" cy="688" rx="30" ry="17" fill="#dde6f0" />
      <ellipse cx="285" cy="688" rx="30" ry="17" fill="#dde6f0" />
      <ellipse cx="60" cy="694" rx="20" ry="13" fill="#e2e8f0" />
      <ellipse cx="350" cy="694" rx="20" ry="13" fill="#e2e8f0" />
      <ellipse cx="22" cy="698" rx="13" ry="9" fill="#e8edf5" />
      <ellipse cx="392" cy="698" rx="13" ry="9" fill="#e8edf5" />

      {/* ── Outer tall minarets (pencil-shaped) ── */}
      {/* Far left */}
      <rect x="14" y="558" width="13" height="202" fill="#dde4ef" />
      <rect x="15" y="558" width="11" height="202" fill="#e4eaf5" />
      <polygon points="14,558 20.5,536 27,558" fill="#cdd5e8" />
      <circle cx="20" cy="532" r="4.5" fill="#c9a227" opacity="0.7" />
      <ellipse cx="20" cy="537" rx="7" ry="4" fill="#d6dfee" />
      {/* Far right */}
      <rect x="393" y="558" width="13" height="202" fill="#dde4ef" />
      <rect x="394" y="558" width="11" height="202" fill="#e4eaf5" />
      <polygon points="393,558 399.5,536 406,558" fill="#cdd5e8" />
      <circle cx="400" cy="532" r="4.5" fill="#c9a227" opacity="0.7" />
      <ellipse cx="400" cy="537" rx="7" ry="4" fill="#d6dfee" />

      {/* ── Inner minarets ── */}
      {/* Left inner */}
      <rect x="78" y="592" width="11" height="168" fill="#e2e8f0" />
      <polygon points="78,592 83.5,578 89,592" fill="#d8e2f0" />
      <circle cx="83" cy="574" r="3.5" fill="#c9a227" opacity="0.65" />
      {/* Right inner */}
      <rect x="331" y="592" width="11" height="168" fill="#e2e8f0" />
      <polygon points="331,592 336.5,578 342,592" fill="#d8e2f0" />
      <circle cx="336" cy="574" r="3.5" fill="#c9a227" opacity="0.65" />
      {/* Centre-left */}
      <rect x="148" y="610" width="9" height="150" fill="#e4eaf5" />
      <polygon points="148,610 152.5,599 157,610" fill="#dde6f0" />
      <circle cx="152" cy="596" r="3" fill="#c9a227" opacity="0.6" />
      {/* Centre-right */}
      <rect x="263" y="610" width="9" height="150" fill="#e4eaf5" />
      <polygon points="263,610 267.5,599 272,610" fill="#dde6f0" />
      <circle cx="267" cy="596" r="3" fill="#c9a227" opacity="0.6" />

      {/* ── Retractable umbrella shades (iconic courtyard feature) ── */}
      {[0,1,2,3].map(i => (
        <g key={`umb${i}`}>
          <line x1={68+i*80} y1="692" x2={68+i*80} y2="668" stroke="#94a3b8" strokeWidth="2" opacity="0.4" />
          <path d={`M ${32+i*80} 668 Q ${68+i*80} 652 ${104+i*80} 668`}
            fill="#d4dff0" opacity="0.65" />
          <line x1={32+i*80} y1="668" x2={104+i*80} y2="668"
            stroke="#b8c8de" strokeWidth="1" opacity="0.5" />
        </g>
      ))}

      {/* ── Masjid al-Haram (Holy Mosque) ── */}
      {/* Mosque outer body */}
      <rect x="435" y="698" width="310" height="62" fill="#e4eaf5" />
      {/* Arched arcade along front */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <path key={`ma${i}`} d={`M ${441+i*36} 760 L ${441+i*36} 735 Q ${459+i*36} 720 ${477+i*36} 735 L ${477+i*36} 760`}
          fill="#d0d9ed" />
      ))}
      {/* Central large dome */}
      <ellipse cx="590" cy="696" rx="54" ry="27" fill="#dde4ef" />
      <ellipse cx="590" cy="694" rx="42" ry="21" fill="#e6ecf7" />
      <path d="M584 669 Q590 659 596 669 Q590 663 584 669" fill="#c9a227" opacity="0.75" />
      {/* Secondary side domes */}
      <ellipse cx="507" cy="704" rx="32" ry="19" fill="#dde4ef" />
      <ellipse cx="673" cy="704" rx="32" ry="19" fill="#dde4ef" />
      <ellipse cx="455" cy="710" rx="20" ry="13" fill="#e2e8f0" />
      <ellipse cx="725" cy="710" rx="20" ry="13" fill="#e2e8f0" />
      {/* Outer tall minarets */}
      <rect x="435" y="642" width="12" height="118" fill="#dde4ef" />
      <path d="M435 642 L441 626 L447 642 Z" fill="#cbd5e1" />
      <circle cx="441" cy="622" r="3.5" fill="#c9a227" opacity="0.65" />
      <rect x="733" y="642" width="12" height="118" fill="#dde4ef" />
      <path d="M733 642 L739 626 L745 642 Z" fill="#cbd5e1" />
      <circle cx="739" cy="622" r="3.5" fill="#c9a227" opacity="0.65" />
      {/* Inner minarets */}
      <rect x="475" y="656" width="10" height="104" fill="#e2e8f0" />
      <path d="M475 656 L480 644 L485 656 Z" fill="#dde4ef" />
      <rect x="695" y="656" width="10" height="104" fill="#e2e8f0" />
      <path d="M695 656 L700 644 L705 656 Z" fill="#dde4ef" />

      {/* ── Abraj Al-Bait (Makkah Clock Tower) — moved to far right near Kaaba ── */}
      <g transform="translate(780, 0)">
        {/* Podium base */}
        <rect x="516" y="598" width="148" height="162" fill="#dde4ef" />
        {[0,1,2,3].map(r => [0,1,2,3].map(c => (
          <rect key={`pod${r}${c}`} x={522+c*34} y={606+r*36} width="24" height="22" rx="1" fill="#bfdbfe" opacity="0.5" />
        )))}
        {/* Flanking hotel towers */}
        <rect x="491" y="522" width="32" height="238" fill="#e2e8f0" />
        <rect x="657" y="522" width="32" height="238" fill="#e2e8f0" />
        {[0,1,2,3,4,5].map(r => (
          <g key={`ht${r}`}>
            <rect x={495} y={530+r*36} width="22" height="22" rx="1" fill="#bfdbfe" opacity="0.5" />
            <rect x={661} y={530+r*36} width="22" height="22" rx="1" fill="#bfdbfe" opacity="0.5" />
          </g>
        ))}
        {/* Main clock tower shaft */}
        <rect x="557" y="190" width="66" height="410" fill="#e2e8f0" />
        <rect x="563" y="190" width="54" height="410" fill="#e8eef8" />
        {[0,1,2,3,4,5,6,7,8,9].map(r => (
          <g key={`cw${r}`}>
            <rect x={566} y={198+r*38} width="18" height="24" rx="1" fill="#bfdbfe" opacity="0.55" />
            <rect x={596} y={198+r*38} width="18" height="24" rx="1" fill="#bfdbfe" opacity="0.55" />
          </g>
        ))}
        {/* Crown battlements — drawn first so clock face renders on top */}
        <rect x="554" y="96" width="72" height="44" fill="#dde4ef" />
        {[0,1,2,3,4].map(i => (
          <rect key={`bat${i}`} x={554+i*14} y={84} width="10" height="14" rx="1" fill="#dde4ef" />
        ))}
        {/* Golden spire */}
        <rect x="587" y="64" width="6" height="22" rx="2" fill="#c9a227" opacity="0.65" />
        {/* Crescent */}
        <path d="M582 63 Q590 50 598 63 Q591 56 582 63" fill="#c9a227" opacity="0.85" />
        <circle cx="590" cy="47" r="3.5" fill="#E30613" opacity="0.85" filter="url(#glow)" />
        {/* Clock head — wide section */}
        <rect x="533" y="138" width="114" height="54" fill="#dde4ef" rx="2" />
        <rect x="537" y="142" width="106" height="46" fill="#e4eaf5" rx="2" />
        <rect x="533" y="188" width="114" height="5" fill="#c9a227" opacity="0.5" />
        {/* Clock face */}
        <circle cx="590" cy="165" r="42" fill="white" opacity="0.88" />
        <circle cx="590" cy="165" r="39" fill="#f5f8ff" />
        <circle cx="590" cy="165" r="35" fill="none" stroke="#1e3a6e" strokeWidth="2" opacity="0.3" />
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          const r1 = 30, r2 = i % 3 === 0 ? 23 : 27;
          return (
            <line key={`ctick${i}`}
              x1={590+r1*Math.cos(angle)} y1={165+r1*Math.sin(angle)}
              x2={590+r2*Math.cos(angle)} y2={165+r2*Math.sin(angle)}
              stroke="#1e3a6e" strokeWidth={i % 3 === 0 ? 2.5 : 1.2} opacity="0.4" />
          );
        })}
        <line x1="590" y1="165" x2="590" y2="145" stroke="#1e3a6e" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1="590" y1="165" x2="610" y2="170" stroke="#E30613" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <circle cx="590" cy="165" r="3.5" fill="#1e3a6e" opacity="0.5" />
      </g>

      {/* ── Riyadh Tower (tallest) ── */}
      <rect x="800" y="202" width="80" height="558" fill="#dde6f0" />
      <line x1="835" y1="202" x2="835" y2="760" stroke="#94a3b8" strokeWidth="2" opacity="0.4" />
      <line x1="850" y1="202" x2="850" y2="760" stroke="#94a3b8" strokeWidth="2" opacity="0.4" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(r => [0,1].map(c => (
        <rect key={`h${r}${c}`} x={810+c*32} y={212+r*45} width="22" height="28" rx="2" fill="#bfdbfe" opacity="0.6" />
      )))}
      <rect x="812" y="182" width="56" height="22" fill="#e2e8f0" />
      <rect x="820" y="164" width="40" height="20" fill="#e2e8f0" />
      <rect x="827" y="150" width="26" height="16" fill="#dde6f0" />
      <line x1="840" y1="150" x2="840" y2="112" stroke="#94a3b8" strokeWidth="3" />
      <circle cx="840" cy="110" r="5" fill="#E30613" opacity="0.8" filter="url(#glow)" />

      {/* ══════ Masjid al-Haram + Holy Kaaba — Makkah (right side) ══════ */}

      {/* ── Mosque outer body ── */}
      <rect x="1155" y="693" width="285" height="67" fill="#e6ecf5" />
      <rect x="1155" y="683" width="285" height="12" fill="#dde4ef" />

      {/* Front arched arcade */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <path key={`hka${i}`}
          d={`M ${1161+i*34} 760 L ${1161+i*34} 733 Q ${1178+i*34} 717 ${1195+i*34} 733 L ${1195+i*34} 760`}
          fill="#cdd7eb" />
      ))}

      {/* ── Minarets of Masjid al-Haram ── */}
      {/* Far left */}
      <rect x="1153" y="558" width="13" height="202" fill="#dde4ef" />
      <rect x="1154" y="558" width="11" height="202" fill="#e4eaf5" />
      <polygon points="1153,558 1159.5,536 1166,558" fill="#cdd5e8" />
      <circle cx="1160" cy="532" r="4.5" fill="#c9a227" opacity="0.7" />
      <ellipse cx="1160" cy="537" rx="7" ry="3.5" fill="#d6dfee" />
      {/* Centre-left */}
      <rect x="1223" y="590" width="11" height="170" fill="#e2e8f0" />
      <polygon points="1223,590 1228.5,577 1234,590" fill="#d8e2f0" />
      <circle cx="1229" cy="573" r="3.5" fill="#c9a227" opacity="0.65" />
      {/* Centre-right */}
      <rect x="1340" y="590" width="11" height="170" fill="#e2e8f0" />
      <polygon points="1340,590 1345.5,577 1351,590" fill="#d8e2f0" />
      <circle cx="1346" cy="573" r="3.5" fill="#c9a227" opacity="0.65" />
      {/* Far right */}
      <rect x="1422" y="558" width="13" height="202" fill="#dde4ef" />
      <rect x="1423" y="558" width="11" height="202" fill="#e4eaf5" />
      <polygon points="1422,558 1428.5,536 1435,558" fill="#cdd5e8" />
      <circle cx="1429" cy="532" r="4.5" fill="#c9a227" opacity="0.7" />
      <ellipse cx="1429" cy="537" rx="7" ry="3.5" fill="#d6dfee" />

      {/* ── Domes along roofline ── */}
      <ellipse cx="1270" cy="686" rx="30" ry="17" fill="#dde6f0" />
      <ellipse cx="1380" cy="686" rx="30" ry="17" fill="#dde6f0" />
      <ellipse cx="1193" cy="693" rx="20" ry="13" fill="#e2e8f0" />
      <ellipse cx="1438" cy="693" rx="20" ry="13" fill="#e2e8f0" />

      {/* ── Marble Mataf (circumambulation courtyard) ── */}
      <ellipse cx="1315" cy="722" rx="82" ry="38" fill="#f0f4f8" opacity="0.85" />
      <ellipse cx="1315" cy="720" rx="68" ry="31" fill="#f5f8fb" opacity="0.9" />
      <ellipse cx="1315" cy="720" rx="65" ry="28" fill="none" stroke="#c8d4e4" strokeWidth="1.2" opacity="0.55" />
      <ellipse cx="1315" cy="720" rx="52" ry="22" fill="none" stroke="#c8d4e4" strokeWidth="0.8" opacity="0.4" />

      {/* ── The Holy Kaaba — centered in Mataf ── */}
      {/* Kaaba center target: x=1315, bottom≈y=718 (sitting on courtyard floor) */}
      {/* Front face: w=32, h=36 → x=1299..1331, y=682..718 */}
      {/* Top offset: 10 right, 10 up → top-left=(1299,682), top-right=(1331,682), TR+off=(1341,672), TL+off=(1309,672) */}
      {/* Right face: (1331,682)→(1331,718)→(1341,708)→(1341,672) */}

      {/* Cube shadow on courtyard */}
      <ellipse cx="1315" cy="719" rx="22" ry="6" fill="#475569" opacity="0.18" />

      {/* Top face — lightest gray */}
      <polygon points="1299,682 1331,682 1341,672 1309,672" fill="#94a3b8" />
      {/* Front face — medium gray */}
      <rect x="1299" y="682" width="32" height="36" fill="#64748b" />
      {/* Right side face — darkest gray */}
      <polygon points="1331,682 1331,718 1341,708 1341,672" fill="#475569" />

      {/* Kiswa band on front face */}
      <rect x="1299" y="689" width="32" height="6" fill="#374151" />
      <rect x="1299" y="688" width="32" height="1.5" fill="#2d3748" opacity="0.7" />
      <rect x="1299" y="695" width="32" height="1.5" fill="#2d3748" opacity="0.7" />
      {/* Kiswa band on right face (perspective) */}
      <polygon points="1331,689 1341,679 1341,681 1331,691" fill="#2d3748" opacity="0.5" />
      <polygon points="1331,695 1341,685 1341,687 1331,697" fill="#2d3748" opacity="0.5" />

      {/* Door — bottom-center of front face (y=704..718) */}
      <rect x="1310" y="704" width="9" height="14" rx="1" fill="#4b5563" />
      <rect x="1311" y="705" width="7" height="12" rx="1" fill="#374151" />
      {/* Door arch at top of door */}
      <path d="M1310 705 Q1314.5 701 1319 705" fill="none" stroke="#4b5563" strokeWidth="1" />

      {/* Face edge highlights */}
      <polygon points="1299,682 1331,682 1341,672 1309,672" fill="none" stroke="#b0bec8" strokeWidth="0.8" opacity="0.6" />
      <rect x="1299" y="682" width="32" height="36" fill="none" stroke="#6b7a8a" strokeWidth="0.8" />
      <polygon points="1331,682 1331,718 1341,708 1341,672" fill="none" stroke="#3d4f60" strokeWidth="0.8" />

      {/* ══════ GSM TOWER ══════ */}
      <ellipse cx="1100" cy="520" rx="140" ry="140" fill="url(#towerGlow)" filter="url(#blur4)" />

      {/* Lattice legs */}
      <line x1="1100" y1="200" x2="1027" y2="900" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      <line x1="1100" y1="200" x2="1173" y2="900" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      <line x1="1100" y1="200" x2="1100" y2="900" stroke="#94a3b8" strokeWidth="3" />

      {/* Horizontal braces */}
      {BRACE_ROWS.map((y, i) => {
        const sp = 6 + i * 6;
        return <line key={y} x1={1100-sp} y1={y} x2={1100+sp} y2={y} stroke="#94a3b8" strokeWidth="3" opacity="0.7" />;
      })}

      {/* Diagonal braces */}
      {BRACE_DIAG.map((y, i) => {
        const s1 = 6 + i * 6;
        const s2 = 6 + (i+1) * 6;
        return (
          <g key={y}>
            <line x1={1100-s1} y1={y} x2={1100+s2} y2={y+60} stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
            <line x1={1100+s1} y1={y} x2={1100-s2} y2={y+60} stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
          </g>
        );
      })}

      {/* Platform */}
      <ellipse cx="1100" cy="212" rx="28" ry="8" fill="#94a3b8" />
      <rect x="1072" y="206" width="56" height="10" rx="3" fill="#94a3b8" />

      {/* Antenna mast */}
      <rect x="1094" y="142" width="12" height="70" rx="3" fill="#94a3b8" />

      {/* Side arms */}
      <rect x="1056" y="167" width="44" height="8" rx="2" fill="#94a3b8" />
      <rect x="1056" y="167" width="8" height="25" rx="2" fill="#cbd5e1" />
      <rect x="1100" y="167" width="44" height="8" rx="2" fill="#94a3b8" />
      <rect x="1136" y="167" width="8" height="25" rx="2" fill="#cbd5e1" />
      <rect x="1058" y="177" width="6" height="30" rx="2" fill="#94a3b8" />
      <rect x="1136" y="177" width="6" height="30" rx="2" fill="#94a3b8" />

      {/* Top beacon */}
      <circle cx="1100" cy="137" r="5" fill="#E30613" opacity="0.85" filter="url(#glow)" />
      <circle cx="1100" cy="137" r="12" fill="#E30613" opacity="0.1" />

      {/* Signal arcs – left */}
      {SIGNAL_RADII.map((r, i) => (
        <path key={`sl${i}`}
          d={`M ${1100-r} 167 A ${r} ${r} 0 0 1 ${1100} ${167-r}`}
          fill="none" stroke="#E30613"
          strokeWidth={1.5 - i * 0.25}
          opacity={0.35 - i * 0.07}
          strokeDasharray={i % 2 === 0 ? undefined : "6 4"}
        />
      ))}
      {/* Signal arcs – right */}
      {SIGNAL_RADII.map((r, i) => (
        <path key={`sr${i}`}
          d={`M ${1100+r} 167 A ${r} ${r} 0 0 0 ${1100} ${167-r}`}
          fill="none" stroke="#E30613"
          strokeWidth={1.5 - i * 0.25}
          opacity={0.35 - i * 0.07}
          strokeDasharray={i % 2 === 0 ? undefined : "6 4"}
        />
      ))}
      {/* Full signal rings */}
      {RING_RADII.map((r, i) => (
        <circle key={`rr${i}`} cx="1100" cy="167" r={r}
          fill="none" stroke="#E30613" strokeWidth="0.8" opacity={0.08 - i * 0.02} />
      ))}

      {/* GSM label */}
      <text x="1100" y="718" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="4" opacity="0.55">GSM</text>

      {/* Network connection lines from buildings to tower */}
      {NET_LINES.map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#E30613" strokeWidth="0.8" opacity="0.1" strokeDasharray="8 6" />
      ))}
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
          loginAdmin(data.username || username, data.role || "superadmin", data.region || "");
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
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#eff6ff]">
      {/* SVG illustrated background */}
      <div className="absolute inset-0 z-0">
        <RiyadhBackground />
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6">
        <div className="mb-8 flex justify-center">
          <img
            src={`${import.meta.env.BASE_URL}images/aces-logo.png`}
            alt="ACES Logo"
            className="h-36 object-contain drop-shadow-md"
          />
        </div>

        <Card
          className="border border-slate-200 shadow-xl rounded-3xl p-2 w-full max-w-md backdrop-blur-xl bg-white/90"
        >
          <CardContent className="p-8">
            <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Welcome Back</h1>
            <p className="text-slate-500 mb-8">Sign in to the ACES-MSD Fueling Web Portal.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Username</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-red-400/40 focus-visible:bg-white transition-all text-base"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-red-400/40 focus-visible:bg-white transition-all text-base"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-14 rounded-xl bg-[#E30613] hover:bg-[#c50511] text-white font-bold text-lg shadow-md shadow-red-200 transition-all group"
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
