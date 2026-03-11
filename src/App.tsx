"use client";

// ============================================================
// ADHD OS — Demo App v1
// Design: Dark "Mission Control" — deep navy + amber
// AI: 7 integration points via /api/chat proxy
// Data: localStorage (schema mirrors Supabase for easy migration)
// Deploy: Drop into src/app/page.jsx on existing Vercel project
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

// ─── INLINE ICONS (no external dependency) ────────────────────
// Each icon is a tiny SVG component matching the lucide-react API:
//   <IconName size={N} style={...} className="..." />
function Ic({ d, size = 16, style, className = "", strokeWidth = 2, fill = "none" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" style={style} className={className}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}
function Brain({ size, style, className })       { return <Ic size={size} style={style} className={className} d={["M9.5 2a2.5 2.5 0 0 1 5 0","M9.5 2C6 2 3 5 3 8.5c0 2.5 1.5 4.5 3.5 5.5V20a2 2 0 0 0 4 0v-1h1v1a2 2 0 0 0 4 0v-6c2-1 3.5-3 3.5-5.5C19 5 16 2 12.5 2"]} />; }
function Sun({ size, style, className })         { return <Ic size={size} style={style} className={className} d={["M12 3v1","M12 20v1","M4.22 4.22l.7.7","M19.07 19.07l.7.7","M3 12h1","M20 12h1","M4.22 19.78l.7-.7","M19.07 4.93l.7-.7","M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"]} />; }
function Moon({ size, style, className })        { return <Ic size={size} style={style} className={className} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />; }
function Compass({ size, style, className })     { return <Ic size={size} style={style} className={className} d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"]} />; }
function Target({ size, style, className })      { return <Ic size={size} style={style} className={className} d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z","M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"]} />; }
function Flame({ size, style, className })       { return <Ic size={size} style={style} className={className} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />; }
function MessageCircle({ size, style, className }) { return <Ic size={size} style={style} className={className} d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />; }
function TrendingUp({ size, style, className })  { return <Ic size={size} style={style} className={className} d={["M22 7 13.5 15.5 8.5 10.5 2 17","m16 7 6 0 0 6"]} />; }
function ChevronRight({ size, style, className }) { return <Ic size={size} style={style} className={className} d="m9 18 6-6-6-6" />; }
function ChevronLeft({ size, style, className }) { return <Ic size={size} style={style} className={className} d="m15 18-6-6 6-6" />; }
function Check({ size, style, className, color, strokeWidth }) { return <Ic size={size} style={{ ...style, color }} className={className} strokeWidth={strokeWidth || 2} d="M20 6 9 17l-5-5" />; }
function Loader2({ size, style, className })     { return <Ic size={size} style={style} className={className} d="M21 12a9 9 0 1 1-6.219-8.56" />; }
function Sparkles({ size, style, className })    { return <Ic size={size} style={style} className={className} d={["m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z","M5 3v4","M19 17v4","M3 5h4","M17 19h4"]} />; }
function Home({ size, style, className })        { return <Ic size={size} style={style} className={className} d={["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]} />; }
function CalendarDays({ size, style, className }) { return <Ic size={size} style={style} className={className} d={["M8 2v4","M16 2v4","M3 10h18","M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z","M8 14h.01","M12 14h.01","M16 14h.01","M8 18h.01","M12 18h.01","M16 18h.01"]} />; }
function Star({ size, style, className })        { return <Ic size={size} style={style} className={className} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />; }
function Zap({ size, style, className })         { return <Ic size={size} style={style} className={className} d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />; }
function Eye({ size, style, className })         { return <Ic size={size} style={style} className={className} d={["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]} />; }
function Heart({ size, style, className })       { return <Ic size={size} style={style} className={className} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />; }
function RefreshCw({ size, style, className })   { return <Ic size={size} style={style} className={className} d={["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8","M21 3v5h-5","M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16","M8 16H3v5"]} />; }
function Send({ size, style, className })        { return <Ic size={size} style={style} className={className} d={["m22 2-7 20-4-9-9-4 20-7z","M22 2 11 13"]} />; }
function Award({ size, style, className })       { return <Ic size={size} style={style} className={className} d={["M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z","M8.21 13.89 7 23l5-3 5 3-1.21-9.12"]} />; }
function AlertTriangle({ size, style, className }) { return <Ic size={size} style={style} className={className} d={["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z","M12 9v4","M12 17h.01"]} />; }
function BarChart2({ size, style, className })   { return <Ic size={size} style={style} className={className} d={["M18 20V10","M12 20V4","M6 20v-6"]} />; }
function CheckCircle2({ size, style, className }) { return <Ic size={size} style={style} className={className} d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","m9 12 2 2 4-4"]} />; }
function Circle({ size, style, className })      { return <Ic size={size} style={style} className={className} d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />; }
function ArrowRight({ size, style, className })  { return <Ic size={size} style={style} className={className} d={["M5 12h14","m12 5 7 7-7 7"]} />; }
function Minus({ size, style, className })       { return <Ic size={size} style={style} className={className} d="M5 12h14" />; }
function Plus({ size, style, className })        { return <Ic size={size} style={style} className={className} d={["M5 12h14","M12 5v14"]} />; }
function X({ size, style, className })           { return <Ic size={size} style={style} className={className} d={["M18 6 6 18","m6 6 12 12"]} />; }
// Clock kept for future use
// eslint-disable-next-line no-unused-vars
function Clock({ size, style, className })       { return <Ic size={size} style={style} className={className} d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 6v6l4 2"]} />; }

// ─── CONSTANTS ────────────────────────────────────────────────
const STORAGE_KEY = "adhd-os-v1";
const API = "/api/chat";

// ─── COLOR TOKENS (matches CSS vars for easy theming) ─────────
const C = {
  bg:       "#030B1A",
  surface:  "#0A1628",
  elevated: "#0F1F38",
  border:   "#1A2D4A",
  amber:    "#F59E0B",
  amberDim: "#92600A",
  blue:     "#60A5FA",
  teal:     "#22D3EE",
  green:    "#34D399",
  red:      "#F87171",
  text:     "#F1F5F9",
  muted:    "#64748B",
  soft:     "#94A3B8",
};

// ─── DEFAULT DATA MODEL ───────────────────────────────────────
// Schema mirrors the Supabase tables in the brief.
// To migrate: replace localStorage calls with Supabase SDK calls.
const DEFAULT = {
  ui:   { screen: "welcome" },
  user: { name: "", disclaimerAccepted: false },
  onboarding: { completed: false, phase: 1, step: 0 },

  // SPRINT 2 → Supabase: self_awareness_profiles table
  p1: {
    adhdStatus:  "diagnosed",
    pains:       ["", "", ""],
    strengths:   "",
    triggers:    "",
    sabotage:    "",
    toDo:        "",
    notToDo:     "",
    toBe:        "",
  },

  // SPRINT 2 → Supabase: ikigai_profiles table
  p2: {
    meaning:      "",
    problem:      "",
    futureSelf:   "",
    valueToOthers:"",
    skills:       "",
  },

  // SPRINT 2 → Supabase: routines table
  p3: {
    wakeTime:  "06:30",
    sleepTime: "23:00",
    peakTime:  "morning",
    fixedWork: "",
    exercise:  "",
  },

  // AI-Generated — null until first onboarding complete
  selfAwareness: null, // {strengths[], weaknesses[], triggers[], toDo[], notToDo[], toBe[], summary}
  ikigai:        null, // {hypotheses[], recommendation, whyRecommended, manifesto, northStar, plan90d[], stopDoing[]}
  routines:      null, // {morning[], work[], evening[], minimum[]}

  // SPRINT 2 → Supabase: daily_checkins table
  today: {
    date:           "",
    gratitude:      ["", "", ""],
    energy:         5,
    focus:          5,
    desiredFeeling: "",
    tasks: [
      { id: 1, title: "", goal: "", minutes: 25, done: false, minimum: "" },
      { id: 2, title: "", goal: "", minutes: 25, done: false, minimum: "" },
      { id: 3, title: "", goal: "", minutes: 25, done: false, minimum: "" },
    ],
    aiNudge:     "",
    morningDone: false,
    // SPRINT 2 → Supabase: daily_checkouts table
    evening: {
      wins: "", offTrack: "", brainDump: "", tomorrowPrep: "", aiSummary: "", done: false,
    },
  },

  // SPRINT 2 → Supabase: weekly_reviews table
  weekly: { wins: "", misses: "", patterns: "", adjustments: "", generated: false },

  // SPRINT 2 → Supabase: messages table
  chat: [
    { role: "assistant", content: "Tôi là AI Coach của bạn trong ADHD OS. Hỏi tôi bất cứ điều gì — về kế hoạch hôm nay, lúc lệch hướng, hay pattern bạn muốn hiểu sâu hơn." }
  ],

  // SPRINT 4 → Supabase: gamification_stats table
  gamification: { streak: 0, score: 0, badges: [], lastDate: "" },
};

// ─── STORAGE LAYER ────────────────────────────────────────────
// SPRINT 2: Replace these two functions with Supabase SDK calls
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT; }
  catch { return DEFAULT; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { console.error("Storage write failed"); }
}

// ─── AI LAYER ─────────────────────────────────────────────────
// SPRINT 3: Extend callAI with streaming support for Coach Chat
async function callAI(messages, systemPrompt) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text || "";
  } catch (err) {
    console.error("AI call failed:", err);
    return null;
  }
}

function safeParseJSON(text, fallback) {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch { return fallback; }
}

// AI Moment 1: Self-Awareness Analysis
async function generateSelfAwareness(p1) {
  const system = `You are a Self-Awareness Analyst for ADHD OS. Analyze the user's data and return ONLY valid JSON — no explanation, no markdown, just the JSON object.`;
  const prompt = `Analyze this ADHD user profile and extract behavioral patterns. Be honest, not flattering.

ADHD Status: ${p1.adhdStatus}
Biggest Pains: ${p1.pains.filter(Boolean).join(", ")}
Natural Strengths: ${p1.strengths}
Distraction Triggers: ${p1.triggers}
Self-Sabotage Patterns: ${p1.sabotage}
Should-Do List: ${p1.toDo}
Should-Avoid List: ${p1.notToDo}
Person They Want To Be: ${p1.toBe}

Return this JSON (max 5 items per array, Vietnamese language):
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "triggers": ["..."],
  "toDo": ["..."],
  "notToDo": ["..."],
  "toBe": ["..."],
  "summary": "2-3 câu mô tả pattern hành vi thực sự — không tâng bốc, chỉ ra điểm nghẽn thật"
}`;
  const text = await callAI([{ role: "user", content: prompt }], system);
  if (!text) return null;
  return safeParseJSON(text, null);
}

// AI Moment 2: Ikigai / North Star Generation
async function generateIkigai(p1, p2, sa) {
  const system = `You are an Ikigai Strategist for ADHD OS. Return ONLY valid JSON — no explanation, no markdown.`;
  const prompt = `Generate a personalized Ikigai analysis for this ADHD user.

Self-awareness summary: ${sa?.summary || ""}
Key strengths: ${sa?.strengths?.join(", ") || ""}
Key weaknesses: ${sa?.weaknesses?.join(", ") || ""}
What gives them meaning: ${p2.meaning}
Recurring problem they care about: ${p2.problem}
Future self vision: ${p2.futureSelf}
Value others see in them: ${p2.valueToOthers}
Current skills: ${p2.skills}

IMPORTANT: 
- Find contradictions in their answers and name them honestly
- Hypotheses must be testable with a concrete 7-14 day action
- Do NOT just summarize what they said — synthesize and challenge
- North Star must be specific and measurable for 1 year
- All text in Vietnamese

Return JSON:
{
  "hypotheses": [
    { "title": "...", "fit": "1-2 câu tại sao phù hợp", "risk": "1 câu rủi ro thật", "test": "Hành động kiểm chứng trong 7-14 ngày" },
    { "title": "...", "fit": "...", "risk": "...", "test": "..." },
    { "title": "...", "fit": "...", "risk": "...", "test": "..." }
  ],
  "recommendation": "title của hypothesis được chọn",
  "whyRecommended": "2 câu lý do — gắn với nỗi đau thật và điểm mạnh thật",
  "manifesto": "1 câu tuyên ngôn mạnh, cá nhân, không sáo rỗng",
  "northStar": "North Star 1 năm cụ thể, đo được",
  "plan90d": ["hành động 1", "hành động 2", "hành động 3"],
  "stopDoing": ["việc 1 cần dừng", "việc 2 cần dừng", "việc 3 cần dừng"]
}`;
  const text = await callAI([{ role: "user", content: prompt }], system);
  if (!text) return null;
  return safeParseJSON(text, null);
}

// AI Moment 3: Routine Builder
async function generateRoutines(p1, p3, sa) {
  const system = `You are a Routine Builder for ADHD OS. Return ONLY valid JSON — no explanation.`;
  const prompt = `Build a realistic daily routine for this ADHD user. The routine must be achievable, not ideal.

Wake time: ${p3.wakeTime} | Sleep time: ${p3.sleepTime}
Peak energy time: ${p3.peakTime}
Fixed commitments: ${p3.fixedWork}
Exercise habits: ${p3.exercise}
Main triggers: ${sa?.triggers?.join(", ") || p1.triggers}
Self-sabotage: ${p1.sabotage}

Rules:
- Each item must have a CLEAR PURPOSE (not generic)
- Minimum version must be genuinely doable on bad days (max 3 items, max 20 min total)
- Morning: light cognitive load, not heroic tasks
- All text in Vietnamese

Return JSON:
{
  "morning": [{"title": "...", "minutes": N, "purpose": "..."}],
  "work": [{"title": "...", "minutes": N, "purpose": "..."}],
  "evening": [{"title": "...", "minutes": N, "purpose": "..."}],
  "minimum": [{"title": "...", "minutes": N, "purpose": "..."}]
}`;
  const text = await callAI([{ role: "user", content: prompt }], system);
  if (!text) return null;
  return safeParseJSON(text, null);
}

// AI Moment 4: Morning Nudge
async function generateMorningNudge(today, ikigai, sa) {
  const taskLoad = today.tasks.reduce((s, t) => s + (Number(t.minutes) || 0), 0);
  const filledTasks = today.tasks.filter(t => t.title.trim()).length;
  const system = `You are an ADHD Morning Coach. Give a SHORT, direct nudge (2-3 sentences max). No fluff.`;
  const prompt = `User's morning state:
Energy: ${today.energy}/10 | Focus: ${today.focus}/10
Tasks planned: ${filledTasks}/3 (${taskLoad} min total)
North Star: ${ikigai?.northStar || "chưa xác định"}
Known triggers: ${sa?.triggers?.slice(0,2).join(", ") || ""}
Gratitude filled: ${today.gratitude.filter(Boolean).length}/3

Give a 2-3 sentence coach nudge in Vietnamese. Be direct, not motivational-poster-like. If overloaded, say so. If underplanned, say so.`;
  const text = await callAI([{ role: "user", content: prompt }], system);
  return text || "Chốt được 3 việc rồi. Đừng tối ưu thêm — bắt đầu việc số 1 ngay.";
}

// AI Moment 5: Evening Summary
async function generateEveningSummary(today, sa, ikigai) {
  const doneTasks = today.tasks.filter(t => t.done).length;
  const system = `You are an ADHD Evening Review Coach. Be honest, specific, and brief (3-4 sentences).`;
  const prompt = `User's day:
Tasks done: ${doneTasks}/3
What went well: ${today.evening.wins}
What caused derailment: ${today.evening.offTrack}
Brain dump: ${today.evening.brainDump}
Tomorrow prep: ${today.evening.tomorrowPrep}
Known self-sabotage patterns: ${sa?.weaknesses?.slice(0,2).join(", ") || ""}

Write 3-4 sentences in Vietnamese: what the data shows about today, one honest observation about pattern, one specific thing to try tomorrow. No false positivity.`;
  const text = await callAI([{ role: "user", content: prompt }], system);
  return text || "Dữ liệu hôm nay đã được ghi lại. Ngày mai, bắt đầu bằng đúng 1 việc trong 10 phút đầu tiên.";
}

// AI Moment 6: Weekly Review
async function generateWeeklyReview(today, sa, ikigai, gamification) {
  const system = `You are a Weekly Review Coach for ADHD. Return ONLY valid JSON.`;
  const prompt = `Weekly review data:
Consistency score: ${gamification.score}/100 | Streak: ${gamification.streak} days
This week's wins: ${today.evening.wins}
Main derailments: ${today.evening.offTrack}
User's known weaknesses: ${sa?.weaknesses?.join(", ") || ""}
North Star: ${ikigai?.northStar || ""}

Return JSON (Vietnamese):
{
  "wins": "1-2 câu về điều làm tốt tuần này",
  "misses": "1-2 câu về điều chưa làm tốt — thẳng thắn",
  "patterns": "1 câu pattern quan sát được",
  "adjustments": "1-2 điều cụ thể điều chỉnh tuần tới"
}`;
  const text = await callAI([{ role: "user", content: prompt }], system);
  if (!text) return null;
  return safeParseJSON(text, null);
}

// AI Moment 7: Coach Chat
async function generateCoachReply(message, data) {
  const { selfAwareness: sa, ikigai, today, gamification } = data;
  const system = `You are an ADHD OS Coach. You have access to the user's profile and daily data. 
Rules:
- Respond in Vietnamese
- Be direct and specific — not generic AI advice
- Reference the user's actual data when possible
- Max 3-4 sentences unless the user asks for more
- If user is venting, acknowledge briefly then redirect to one actionable step
- You can gently push back if data contradicts what user says`;

  const context = `User context:
Name: ${data.user.name}
North Star: ${ikigai?.northStar || "chưa xác định"}
Main weaknesses: ${sa?.weaknesses?.slice(0,3).join(", ") || ""}
Known triggers: ${sa?.triggers?.slice(0,3).join(", ") || ""}
Today's energy: ${today.energy}/10 | focus: ${today.focus}/10
Tasks done today: ${today.tasks.filter(t=>t.done).length}/3
Current streak: ${gamification.streak} ngày`;

  const text = await callAI(
    [{ role: "user", content: `${context}\n\nUser message: ${message}` }],
    system
  );
  return text || "Hãy nói cụ thể hơn về điều bạn đang kẹt — việc gì, bước nào, và điều gì khiến bạn né nó.";
}

// ─── UI PRIMITIVES ────────────────────────────────────────────

function Btn({ children, onClick, variant = "primary", disabled = false, className = "", small = false }) {
  const base = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none ${small ? "px-3 py-1.5 text-sm" : "px-5 py-3 text-sm"}`;
  const variants = {
    primary:  `text-black hover:opacity-90 active:scale-95 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`,
    ghost:    `text-slate-400 hover:text-white hover:bg-white/5 active:scale-95`,
    outline:  `border text-slate-300 hover:text-white hover:border-white/30 active:scale-95`,
    danger:   `bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95`,
  };
  const styles = {
    primary: { background: disabled ? C.amberDim : C.amber },
    ghost:   {},
    outline: { borderColor: C.border },
    danger:  {},
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        background: C.surface,
        borderColor: C.border,
        boxShadow: glow ? `0 0 30px ${C.amber}22` : "none",
      }}
    >
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-xs font-medium" style={{ color: C.soft }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
        style={{
          background: C.elevated,
          border: `1px solid ${C.border}`,
          color: C.text,
        }}
        onFocus={e => e.target.style.borderColor = C.amber}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-xs font-medium" style={{ color: C.soft }}>{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
        style={{
          background: C.elevated,
          border: `1px solid ${C.border}`,
          color: C.text,
        }}
        onFocus={e => e.target.style.borderColor = C.amber}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );
}

function SliderInput({ label, value, onChange, min = 1, max = 10 }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: C.soft }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: C.amber }}>{value}<span className="text-xs font-normal opacity-60">/{max}</span></span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: C.amber, background: `linear-gradient(to right, ${C.amber} ${(value-min)/(max-min)*100}%, ${C.border} 0%)` }}
      />
    </div>
  );
}

function ProgressBar({ value, max = 100, color = C.amber }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: C.border, height: 4 }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Chip({ children, active = false, color = C.amber }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? `${color}22` : C.elevated,
        color: active ? color : C.soft,
        border: `1px solid ${active ? `${color}44` : C.border}`,
      }}
    >
      {children}
    </span>
  );
}

function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" style={{ color: C.amber }} />;
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color: C.amber }} />}
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.soft }}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function NudgeBox({ text, loading = false }) {
  return (
    <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: `${C.amber}11`, border: `1px solid ${C.amber}33` }}>
      <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: C.amber }} />
      {loading
        ? <div className="flex items-center gap-2"><Spinner size={12} /><span className="text-xs" style={{ color: C.soft }}>AI đang phân tích...</span></div>
        : <p className="text-sm leading-relaxed" style={{ color: C.soft }}>{text}</p>
      }
    </div>
  );
}

function TaskCard({ task, index, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border transition-all" style={{ background: C.elevated, borderColor: task.done ? `${C.green}44` : C.border }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => onChange({ ...task, done: !task.done })}
          className="shrink-0 rounded-full transition-all"
          style={{ color: task.done ? C.green : C.muted }}
        >
          {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>
        <div className="flex-1 min-w-0">
          {task.title
            ? <p className={`text-sm font-medium truncate ${task.done ? "line-through opacity-50" : ""}`} style={{ color: C.text }}>{task.title}</p>
            : <p className="text-sm" style={{ color: C.muted }}>Việc {index + 1} — chưa đặt tên</p>
          }
          {task.minutes > 0 && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{task.minutes} phút{task.goal ? ` · ${task.goal}` : ""}</p>}
        </div>
        <button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:bg-white/5">
          <ChevronRight size={14} style={{ color: C.muted, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: C.border }}>
          <Input label="Tên việc" value={task.title} onChange={v => onChange({ ...task, title: v })} placeholder="Ví dụ: Viết outline bài TikTok" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mục tiêu đạt được" value={task.goal} onChange={v => onChange({ ...task, goal: v })} placeholder="Hoàn thành script..." />
            <Input label="Thời gian (phút)" value={task.minutes} onChange={v => onChange({ ...task, minutes: Number(v) })} type="number" placeholder="25" />
          </div>
          <Input label="Minimum version (nếu quá tải)" value={task.minimum} onChange={v => onChange({ ...task, minimum: v })} placeholder="Ví dụ: Chỉ cần viết tiêu đề..." />
        </div>
      )}
    </div>
  );
}

// ─── WELCOME SCREEN ───────────────────────────────────────────
function WelcomeScreen({ data, update }) {
  const ready = data.user.name.trim() && data.user.disclaimerAccepted;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: C.bg }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${C.amber}0A 0%, transparent 70%)`
      }} />

      <div className="w-full max-w-md space-y-8 relative">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2" style={{ background: `${C.amber}18`, border: `1px solid ${C.amber}44` }}>
            <Brain size={32} style={{ color: C.amber }} />
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>ADHD OS</h1>
          <p className="text-sm leading-relaxed" style={{ color: C.soft }}>
            Từ mơ hồ sang vận hành được cuộc sống từng ngày.<br />
            Không phải todo app. Đây là hệ điều hành hành vi cá nhân.
          </p>
        </div>

        {/* Form */}
        <Card>
          <div className="space-y-4">
            <Input
              label="Tên của bạn"
              value={data.user.name}
              onChange={v => update(d => ({ ...d, user: { ...d.user, name: v } }))}
              placeholder="Ví dụ: Hoàng"
            />

            <button
              onClick={() => update(d => ({ ...d, user: { ...d.user, disclaimerAccepted: !d.user.disclaimerAccepted } }))}
              className="flex items-start gap-3 w-full text-left rounded-xl p-3 transition-all hover:bg-white/5"
            >
              <div className="mt-0.5 w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all" style={{
                background: data.user.disclaimerAccepted ? C.amber : "transparent",
                borderColor: data.user.disclaimerAccepted ? C.amber : C.border,
              }}>
                {data.user.disclaimerAccepted && <Check size={12} color="#000" strokeWidth={3} />}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.soft }}>
                Tôi hiểu đây là công cụ tự phản tư và vận hành cá nhân, không thay thế bác sĩ hoặc chuyên gia tâm lý.
              </p>
            </button>
          </div>

          <div className="mt-5">
            <Btn
              onClick={() => update(d => ({ ...d, ui: { screen: "onboarding" } }))}
              disabled={!ready}
              className="w-full"
            >
              Bắt đầu Onboarding <ArrowRight size={16} />
            </Btn>
          </div>
        </Card>

        {/* What this does */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Eye,     label: "Hiểu bản thân", desc: "Điểm mạnh, trigger, pattern" },
            { icon: Compass, label: "North Star", desc: "Ikigai + hướng 1 năm" },
            { icon: CalendarDays, label: "Planner hằng ngày", desc: "Top 3 + AI bẻ nhỏ" },
            { icon: Brain,   label: "AI Coach", desc: "Nhớ bạn, phản biện thật" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl p-3 space-y-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Icon size={14} style={{ color: C.amber }} />
              <p className="text-xs font-semibold" style={{ color: C.text }}>{label}</p>
              <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────
// 3 phases. Each phase = array of steps.
// SPRINT 2: Move AI calls to server-side onboarding API route

const P1_STEPS = [
  "Ảnh chụp nhanh",
  "Vùng mạnh",
  "Trigger & tự phá",
  "To-do / Not-to-do / To-be",
];

const P2_STEPS = [
  "Ý nghĩa sâu",
  "Giá trị & kỹ năng",
  "Tương lai",
];

const P3_STEPS = [
  "Bản đồ năng lượng",
  "Cách làm việc",
];

function OnboardingScreen({ data, update, onComplete }) {
  const { phase, step } = data.onboarding;
  const [loading, setLoading] = useState(false);

  const pSteps = phase === 1 ? P1_STEPS : phase === 2 ? P2_STEPS : P3_STEPS;
  const totalSteps = pSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const setPhase = (p) => update(d => ({ ...d, onboarding: { ...d.onboarding, phase: p, step: 0 } }));
  const nextStep = () => update(d => ({ ...d, onboarding: { ...d.onboarding, step: d.onboarding.step + 1 } }));
  const prevStep = () => {
    if (step > 0) update(d => ({ ...d, onboarding: { ...d.onboarding, step: d.onboarding.step - 1 } }));
    else if (phase > 1) update(d => ({ ...d, onboarding: { ...d.onboarding, phase: d.onboarding.phase - 1, step: 0 } }));
  };

  const updateP1 = (patch) => update(d => ({ ...d, p1: { ...d.p1, ...patch } }));
  const updateP2 = (patch) => update(d => ({ ...d, p2: { ...d.p2, ...patch } }));
  const updateP3 = (patch) => update(d => ({ ...d, p3: { ...d.p3, ...patch } }));

  const handlePhaseComplete = async (phaseNum) => {
    setLoading(true);
    if (phaseNum === 1) {
      const sa = await generateSelfAwareness(data.p1);
      update(d => ({ ...d, selfAwareness: sa }));
      setPhase(2);
    } else if (phaseNum === 2) {
      const ik = await generateIkigai(data.p1, data.p2, data.selfAwareness);
      update(d => ({ ...d, ikigai: ik }));
      setPhase(3);
    } else {
      const rt = await generateRoutines(data.p1, data.p3, data.selfAwareness);
      update(d => ({ ...d, routines: rt, onboarding: { ...d.onboarding, completed: true }, ui: { screen: "onboarding-result" } }));
    }
    setLoading(false);
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 50% 30% at 50% 0%, ${C.blue}08 0%, transparent 60%)`
      }} />

      {/* Header */}
      <div className="px-6 pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain size={18} style={{ color: C.amber }} />
            <span className="text-sm font-bold" style={{ color: C.amber, fontFamily: "'Syne', sans-serif" }}>ADHD OS</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(p => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="rounded-full text-xs font-bold px-2.5 py-0.5 transition-all"
                  style={{
                    background: phase === p ? C.amber : phase > p ? `${C.green}22` : C.elevated,
                    color: phase === p ? "#000" : phase > p ? C.green : C.muted,
                    border: `1px solid ${phase === p ? C.amber : phase > p ? `${C.green}44` : C.border}`,
                  }}>
                  {phase > p ? <Check size={10} /> : `P${p}`}
                </div>
                {p < 3 && <div className="w-4 h-px" style={{ background: phase > p ? C.green : C.border }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Phase label */}
        <div className="mb-3">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.soft }}>
            Phase {phase} — {phase === 1 ? "Self-Awareness" : phase === 2 ? "Ikigai & North Star" : "Routine Setup"}
          </p>
          <h2 className="text-xl font-bold" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>
            {pSteps[step]}
          </h2>
        </div>

        <ProgressBar value={progress} />
        <p className="text-xs mt-1.5" style={{ color: C.muted }}>Bước {step + 1} / {totalSteps}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 max-w-2xl mx-auto w-full">
        <Card>
          {/* PHASE 1 */}
          {phase === 1 && step === 0 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: C.soft }}>Bắt đầu bằng vài câu hỏi thực tế. Trả lời thẳng, không cần viết đẹp.</p>
              <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: C.soft }}>Trạng thái ADHD của bạn</label>
                <div className="grid grid-cols-3 gap-2">
                  {["diagnosed", "suspected", "self-identified"].map(v => (
                    <button key={v} onClick={() => updateP1({ adhdStatus: v })}
                      className="rounded-xl py-2.5 text-xs font-medium border transition-all"
                      style={{
                        background: data.p1.adhdStatus === v ? `${C.amber}22` : C.elevated,
                        borderColor: data.p1.adhdStatus === v ? C.amber : C.border,
                        color: data.p1.adhdStatus === v ? C.amber : C.soft,
                      }}>
                      {v === "diagnosed" ? "Đã chẩn đoán" : v === "suspected" ? "Nghi ngờ" : "Tự xác định"}
                    </button>
                  ))}
                </div>
              </div>
              {["Nỗi đau lớn nhất #1", "Nỗi đau lớn nhất #2", "Nỗi đau lớn nhất #3"].map((label, i) => (
                <Input key={i} label={label}
                  value={data.p1.pains[i]}
                  onChange={v => { const p = [...data.p1.pains]; p[i] = v; updateP1({ pains: p }); }}
                  placeholder={["Khó bắt đầu việc", "Time blindness", "Planner fail liên tục"][i]}
                />
              ))}
            </div>
          )}

          {phase === 1 && step === 1 && (
            <div className="space-y-4">
              <NudgeBox text="Điền vào những khoảng trống này. Không cần nghe hay — hãy trung thực." />
              <Textarea label="Bạn làm gì thấy tự nhiên, ít kháng cự?" value={data.p1.strengths}
                onChange={v => updateP1({ strengths: v })}
                placeholder="Ví dụ: brainstorm ý tưởng, kết nối người với nhau, bắt đầu dự án mới..." rows={3} />
              <Textarea label="Điều gì cho bạn dopamine lành mạnh (flow state)?" value={data.p1.triggers}
                onChange={v => updateP1({ triggers: v })}
                placeholder="Ví dụ: viết nội dung có deadline gấp, giúp người khác giải vấn đề..." rows={2} />
            </div>
          )}

          {phase === 1 && step === 2 && (
            <div className="space-y-4">
              <NudgeBox text="Phần này quan trọng nhất. AI sẽ dùng dữ liệu này để tìm pattern thật của bạn." />
              <Textarea label="Kiểu tự phá nhịp lặp đi lặp lại của bạn là gì?" value={data.p1.sabotage}
                onChange={v => updateP1({ sabotage: v })}
                placeholder="Ví dụ: bắt đầu tốt rồi bỏ giữa chừng, thêm task mới khi cũ chưa xong..." rows={3} />
            </div>
          )}

          {phase === 1 && step === 3 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: C.soft }}>Mỗi dòng = 1 item. Viết thẳng, không suy nghĩ quá nhiều.</p>
              <Textarea label="To-do — Việc bạn nên làm nhiều hơn" value={data.p1.toDo}
                onChange={v => updateP1({ toDo: v })}
                placeholder="Mỗi dòng 1 việc..." rows={3} />
              <Textarea label="Not-to-do — Việc bạn cần dừng" value={data.p1.notToDo}
                onChange={v => updateP1({ notToDo: v })}
                placeholder="Mỗi dòng 1 việc..." rows={3} />
              <Textarea label="To-be — Kiểu người bạn muốn trở thành" value={data.p1.toBe}
                onChange={v => updateP1({ toBe: v })}
                placeholder="Mỗi dòng 1 phẩm chất..." rows={3} />
            </div>
          )}

          {/* PHASE 2 */}
          {phase === 2 && step === 0 && (
            <div className="space-y-4">
              <NudgeBox text="Phần này tìm động lực sâu — không phải mục tiêu bề mặt. Đừng cố nghe hay." />
              <Textarea label="Điều gì làm bạn thấy đời có ý nghĩa?" value={data.p2.meaning}
                onChange={v => updateP2({ meaning: v })}
                placeholder="Khi nào bạn thấy mình đang sống đúng nhất..." rows={3} />
              <Textarea label="Vấn đề nào bạn cứ đau đáu — của bản thân hoặc người khác?" value={data.p2.problem}
                onChange={v => updateP2({ problem: v })}
                placeholder="Điều nào khiến bạn tức hoặc muốn giải quyết khi thấy nó..." rows={3} />
            </div>
          )}

          {phase === 2 && step === 1 && (
            <div className="space-y-4">
              <Textarea label="Người khác thường nhờ bạn giúp điều gì?" value={data.p2.valueToOthers}
                onChange={v => updateP2({ valueToOthers: v })}
                placeholder="Những gì họ thấy ở bạn mà bạn đôi khi không để ý..." rows={3} />
              <Textarea label="Kỹ năng / kinh nghiệm bạn đang có" value={data.p2.skills}
                onChange={v => updateP2({ skills: v })}
                placeholder="Không cần hoàn hảo — liệt kê thật, kể cả kỹ năng mềm..." rows={3} />
            </div>
          )}

          {phase === 2 && step === 2 && (
            <div className="space-y-4">
              <Textarea label="Bạn muốn trở thành ai trong 1-3 năm tới?" value={data.p2.futureSelf}
                onChange={v => updateP2({ futureSelf: v })}
                placeholder="Mô tả cụ thể — không chỉ nghề nghiệp, mà cả lifestyle và cảm giác bạn muốn có..." rows={4} />
            </div>
          )}

          {/* PHASE 3 */}
          {phase === 3 && step === 0 && (
            <div className="space-y-4">
              <NudgeBox text="AI sẽ dùng thông tin này để xây routine thực dùng được — không phải routine lý tưởng." />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Giờ dậy" value={data.p3.wakeTime} onChange={v => updateP3({ wakeTime: v })} type="time" />
                <Input label="Giờ ngủ" value={data.p3.sleepTime} onChange={v => updateP3({ sleepTime: v })} type="time" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: C.soft }}>Khung giờ năng lượng cao nhất</label>
                <div className="grid grid-cols-3 gap-2">
                  {["morning", "afternoon", "evening"].map(t => (
                    <button key={t} onClick={() => updateP3({ peakTime: t })}
                      className="rounded-xl py-2.5 text-xs font-medium border transition-all"
                      style={{
                        background: data.p3.peakTime === t ? `${C.amber}22` : C.elevated,
                        borderColor: data.p3.peakTime === t ? C.amber : C.border,
                        color: data.p3.peakTime === t ? C.amber : C.soft,
                      }}>
                      {t === "morning" ? "Sáng" : t === "afternoon" ? "Chiều" : "Tối"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === 3 && step === 1 && (
            <div className="space-y-4">
              <Textarea label="Việc cố định trong ngày (giờ học, làm, đưa con...)" value={data.p3.fixedWork}
                onChange={v => updateP3({ fixedWork: v })}
                placeholder="Ví dụ: 8-12h làm việc, 17h đón con, 19-21h coi con học..." rows={3} />
              <Textarea label="Thói quen tập luyện hiện tại" value={data.p3.exercise}
                onChange={v => updateP3({ exercise: v })}
                placeholder="Ví dụ: chạy 30 phút mỗi sáng, hoặc chưa có thói quen gì..." rows={2} />
            </div>
          )}
        </Card>
      </div>

      {/* Navigation */}
      <div className="px-6 py-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <Btn variant="ghost" onClick={prevStep} disabled={phase === 1 && step === 0}>
            <ChevronLeft size={16} /> Quay lại
          </Btn>

          {isLastStep ? (
            <Btn onClick={() => handlePhaseComplete(phase)} disabled={loading}>
              {loading
                ? <><Spinner size={14} /> AI đang xây hệ vận hành...</>
                : phase < 3
                  ? <>Phase {phase + 1} <ChevronRight size={16} /></>
                  : <>Tạo ADHD OS của tôi <Sparkles size={16} /></>
              }
            </Btn>
          ) : (
            <Btn onClick={nextStep}>
              Tiếp theo <ChevronRight size={16} />
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING RESULT ────────────────────────────────────────
function OnboardingResultScreen({ data, update }) {
  const { selfAwareness: sa, ikigai, routines } = data;

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${C.amber}0A 0%, transparent 60%)`
      }} />
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6 relative">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2" style={{ background: `${C.green}18`, border: `1px solid ${C.green}44` }}>
            <Sparkles size={28} style={{ color: C.green }} />
          </div>
          <h1 className="text-3xl font-black" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>ADHD OS của bạn đã sẵn sàng</h1>
          <p className="text-sm" style={{ color: C.soft }}>AI đã phân tích và xây hệ vận hành ban đầu. Đây là giả thuyết — không phải chân lý cuối cùng.</p>
        </div>

        {/* Self-awareness */}
        {sa && (
          <Card>
            <Section title="Self-Awareness" icon={Eye}>
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.soft }}>{sa.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                {sa.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs mb-2 font-semibold" style={{ color: C.green }}>Điểm mạnh</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sa.strengths.map((s, i) => <Chip key={i} active color={C.green}>{s}</Chip>)}
                    </div>
                  </div>
                )}
                {sa.triggers?.length > 0 && (
                  <div>
                    <p className="text-xs mb-2 font-semibold" style={{ color: C.red }}>Trigger chính</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sa.triggers.map((t, i) => <Chip key={i} active color={C.red}>{t}</Chip>)}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </Card>
        )}

        {/* North Star */}
        {ikigai && (
          <Card glow>
            <Section title="North Star" icon={Compass}>
              <div className="space-y-3">
                {ikigai.manifesto && (
                  <p className="text-base font-semibold leading-relaxed italic" style={{ color: C.amber }}>
                    "{ikigai.manifesto}"
                  </p>
                )}
                {ikigai.northStar && (
                  <p className="text-sm" style={{ color: C.soft }}>{ikigai.northStar}</p>
                )}
              </div>
            </Section>
          </Card>
        )}

        {/* Routine preview */}
        {routines && (
          <Card>
            <Section title="Routine buổi sáng" icon={Sun}>
              <div className="space-y-2">
                {routines.morning?.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: C.elevated }}>
                    <span className="text-sm" style={{ color: C.text }}>{r.title}</span>
                    <span className="text-xs" style={{ color: C.muted }}>{r.minutes}'</span>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        )}

        <Btn
          onClick={() => update(d => ({ ...d, ui: { screen: "home" } }))}
          className="w-full"
        >
          Vào ADHD OS <ArrowRight size={16} />
        </Btn>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────
function HomeScreen({ data, update, setScreen }) {
  const { ikigai, selfAwareness: sa, today, gamification, routines } = data;
  const doneTasks = today.tasks.filter(t => t.done).length;
  const taskPct = (doneTasks / 3) * 100;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.muted }}>Chào buổi sáng,</p>
          <h1 className="text-2xl font-black" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>
            {data.user.name || "Bạn"} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Flame size={14} style={{ color: C.amber }} />
          <span className="text-sm font-bold" style={{ color: C.amber }}>{gamification.streak}</span>
          <span className="text-xs" style={{ color: C.muted }}>ngày</span>
        </div>
      </div>

      {/* North Star card */}
      {ikigai ? (
        <Card glow>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass size={14} style={{ color: C.amber }} />
              <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.amber }}>North Star</span>
            </div>
            <button onClick={() => setScreen("north-star")} className="text-xs" style={{ color: C.muted }}>
              Chi tiết →
            </button>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.soft }}>{ikigai.northStar}</p>
          {ikigai.manifesto && (
            <p className="text-xs mt-3 italic" style={{ color: C.amberDim }}>"{ikigai.manifesto}"</p>
          )}
        </Card>
      ) : (
        <div className="rounded-2xl border-2 border-dashed p-5 text-center" style={{ borderColor: C.border }}>
          <p className="text-sm" style={{ color: C.muted }}>Hoàn thành onboarding để xem North Star</p>
        </div>
      )}

      {/* Today tasks */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={14} style={{ color: C.amber }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.soft }}>Top 3 hôm nay</span>
          </div>
          <button onClick={() => setScreen("today")} className="text-xs" style={{ color: C.amber }}>
            Mở Planner →
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {today.tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: C.elevated }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                background: task.done ? `${C.green}22` : `${C.amber}22`,
                border: `1px solid ${task.done ? C.green : C.amber}44`,
              }}>
                {task.done
                  ? <Check size={10} style={{ color: C.green }} />
                  : <span className="text-xs font-bold" style={{ color: C.amber }}>{i + 1}</span>
                }
              </div>
              <span className={`text-sm flex-1 truncate ${task.done ? "line-through opacity-40" : ""}`} style={{ color: C.text }}>
                {task.title || `Việc ${i + 1} — chưa đặt`}
              </span>
              {task.minutes > 0 && <span className="text-xs shrink-0" style={{ color: C.muted }}>{task.minutes}'</span>}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs" style={{ color: C.muted }}>
            <span>Tiến độ hôm nay</span>
            <span>{doneTasks}/3</span>
          </div>
          <ProgressBar value={taskPct} color={doneTasks === 3 ? C.green : C.amber} />
        </div>
      </Card>

      {/* AI Nudge */}
      {today.aiNudge && (
        <NudgeBox text={today.aiNudge} />
      )}

      {/* Routine + Consistency */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <Section title="Routine sáng" icon={Sun}>
            <div className="space-y-1.5 mt-2">
              {(routines?.morning || []).slice(0, 3).map((r, i) => (
                <div key={i} className="text-xs rounded-lg px-2.5 py-1.5" style={{ background: C.elevated, color: C.soft }}>
                  {r.title} · {r.minutes}'
                </div>
              ))}
              {!routines && <p className="text-xs" style={{ color: C.muted }}>Hoàn thành onboarding để xem routine</p>}
            </div>
          </Section>
        </Card>

        <Card>
          <Section title="Consistency" icon={Flame}>
            <div className="mt-2 space-y-2">
              <div className="text-center">
                <span className="text-3xl font-black" style={{ color: C.amber, fontFamily: "'Syne', sans-serif" }}>
                  {gamification.score}
                </span>
                <span className="text-xs ml-1" style={{ color: C.muted }}>/100</span>
              </div>
              <ProgressBar value={gamification.score} color={gamification.score >= 70 ? C.green : C.amber} />
              {gamification.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {gamification.badges.map(b => <Chip key={b} active>{b}</Chip>)}
                </div>
              )}
            </div>
          </Section>
        </Card>
      </div>
    </div>
  );
}

// ─── TODAY SCREEN ─────────────────────────────────────────────
function TodayScreen({ data, update }) {
  const { today, selfAwareness: sa, ikigai } = data;
  const [tab, setTab] = useState("morning");
  const [loadingNudge, setLoadingNudge] = useState(false);
  const [loadingEvening, setLoadingEvening] = useState(false);

  const updateToday = (patch) => update(d => ({ ...d, today: { ...d.today, ...patch } }));
  const updateEvening = (patch) => update(d => ({
    ...d, today: { ...d.today, evening: { ...d.today.evening, ...patch } }
  }));

  const handleMorningDone = async () => {
    setLoadingNudge(true);
    updateToday({ morningDone: true });
    const nudge = await generateMorningNudge(today, ikigai, sa);
    updateToday({ aiNudge: nudge });
    setLoadingNudge(false);
    setTab("tasks");
  };

  const handleEveningDone = async () => {
    setLoadingEvening(true);
    const summary = await generateEveningSummary(today, sa, ikigai);
    updateEvening({ aiSummary: summary, done: true });
    // Update gamification
    const doneTasks = today.tasks.filter(t => t.done).length;
    const newScore = Math.min(100, doneTasks * 30 + (today.gratitude.filter(Boolean).length * 3) + 5);
    update(d => ({
      ...d,
      gamification: {
        ...d.gamification,
        score: newScore,
        streak: doneTasks > 0 ? d.gamification.streak + 1 : d.gamification.streak,
        badges: newScore >= 80 ? [...new Set([...d.gamification.badges, "Giữ nhịp tốt"])] : d.gamification.badges,
        lastDate: new Date().toISOString().slice(0, 10),
      }
    }));
    setLoadingEvening(false);
  };

  const TABS = [
    { key: "morning", label: "Sáng", icon: Sun },
    { key: "tasks", label: "Tasks", icon: Target },
    { key: "evening", label: "Tối", icon: Moon },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>Hôm nay</h1>
        <p className="text-xs" style={{ color: C.muted }}>{new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === key ? C.amber : "transparent",
              color: tab === key ? "#000" : C.soft,
            }}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Morning Tab */}
      {tab === "morning" && (
        <div className="space-y-4">
          <Card>
            <Section title="3 điều biết ơn" icon={Heart}>
              <div className="space-y-2 mt-2">
                {today.gratitude.map((g, i) => (
                  <Input key={i} value={g}
                    onChange={v => { const grat = [...today.gratitude]; grat[i] = v; updateToday({ gratitude: grat }); }}
                    placeholder={`Điều ${i + 1} bạn biết ơn hôm nay...`}
                  />
                ))}
              </div>
            </Section>
          </Card>

          <Card>
            <Section title="Trạng thái buổi sáng" icon={Zap}>
              <div className="space-y-4 mt-3">
                <SliderInput label="Mức năng lượng" value={today.energy} onChange={v => updateToday({ energy: v })} />
                <SliderInput label="Mức tập trung" value={today.focus} onChange={v => updateToday({ focus: v })} />
                <Input label="Cảm xúc bạn muốn có hôm nay" value={today.desiredFeeling}
                  onChange={v => updateToday({ desiredFeeling: v })}
                  placeholder="Ví dụ: Bình tĩnh và rõ ràng" />
              </div>
            </Section>
          </Card>

          <Btn onClick={handleMorningDone} disabled={loadingNudge} className="w-full">
            {loadingNudge ? <><Spinner size={14} /> AI đang tạo nudge...</> : <>Xong morning check-in · Qua Tasks <ArrowRight size={16} /></>}
          </Btn>

          {today.aiNudge && <NudgeBox text={today.aiNudge} />}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="space-y-4">
          {!today.morningDone && (
            <NudgeBox text="Hoàn thành Morning Check-in trước để AI tạo nudge cho kế hoạch hôm nay." />
          )}

          <Card>
            <Section title="Top 3 việc hôm nay" icon={Target}>
              <div className="space-y-3 mt-3">
                {today.tasks.map((task, i) => (
                  <TaskCard key={task.id} task={task} index={i}
                    onChange={updated => {
                      const tasks = [...today.tasks];
                      tasks[i] = updated;
                      updateToday({ tasks });
                    }}
                  />
                ))}
              </div>
            </Section>
          </Card>

          {today.aiNudge && <NudgeBox text={today.aiNudge} />}

          <Card>
            <Section title="Focus Mode" icon={Zap}>
              <div className="space-y-2 mt-2">
                <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: C.elevated, color: C.soft }}>
                  Bắt đầu bằng việc số 1. Không mở task mới cho đến khi xong.
                </div>
                <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: C.elevated, color: C.soft }}>
                  Nếu khựng → giảm xuống minimum version ngay, đừng né hoàn toàn.
                </div>
                {/* SPRINT 4: Add Pomodoro timer here */}
              </div>
            </Section>
          </Card>
        </div>
      )}

      {/* Evening Tab */}
      {tab === "evening" && (
        <div className="space-y-4">
          <Card>
            <Section title="Check-out buổi tối" icon={Moon}>
              <div className="space-y-3 mt-3">
                <Textarea label="Hôm nay làm được gì?" value={today.evening.wins}
                  onChange={v => updateEvening({ wins: v })}
                  placeholder="Liệt kê thực tế — dù nhỏ cũng tính..." rows={2} />
                <Textarea label="Điều gì làm trật nhịp?" value={today.evening.offTrack}
                  onChange={v => updateEvening({ offTrack: v })}
                  placeholder="Không phán xét — chỉ ghi lại thật..." rows={2} />
                <Textarea label="Brain dump" value={today.evening.brainDump}
                  onChange={v => updateEvening({ brainDump: v })}
                  placeholder="Xả hết những gì còn trong đầu..." rows={3} />
                <Textarea label="Chuẩn bị gì cho ngày mai?" value={today.evening.tomorrowPrep}
                  onChange={v => updateEvening({ tomorrowPrep: v })}
                  placeholder="1-2 điều cần chuẩn bị..." rows={2} />
              </div>
            </Section>
          </Card>

          {today.evening.done && today.evening.aiSummary && (
            <NudgeBox text={today.evening.aiSummary} />
          )}

          {!today.evening.done && (
            <Btn onClick={handleEveningDone} disabled={loadingEvening} className="w-full">
              {loadingEvening ? <><Spinner size={14} /> AI đang tổng kết ngày...</> : <>Kết thúc ngày <Moon size={16} /></>}
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NORTH STAR SCREEN ────────────────────────────────────────
function NorthStarScreen({ data, update }) {
  const { ikigai, selfAwareness: sa } = data;

  if (!ikigai) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-black" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>North Star</h1>
        <Card>
          <div className="text-center py-8 space-y-3">
            <Compass size={40} style={{ color: C.muted }} />
            <p className="text-sm" style={{ color: C.muted }}>Hoàn thành onboarding để AI tạo North Star cá nhân của bạn.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>North Star</h1>

      {/* Manifesto */}
      <Card glow>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Compass size={14} style={{ color: C.amber }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.amber }}>Tuyên ngôn cá nhân</span>
          </div>
          <p className="text-xl font-bold leading-relaxed italic" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>
            "{ikigai.manifesto}"
          </p>
        </div>
      </Card>

      {/* North Star */}
      <Card>
        <Section title="North Star 1 năm" icon={Star}>
          <p className="text-sm leading-relaxed mt-2" style={{ color: C.soft }}>{ikigai.northStar}</p>
        </Section>
      </Card>

      {/* Ikigai recommendation */}
      <Card>
        <Section title="Ikigai khuyến nghị" icon={Sparkles}>
          <div className="mt-2 space-y-2">
            <p className="text-base font-bold" style={{ color: C.text }}>{ikigai.recommendation}</p>
            <p className="text-sm" style={{ color: C.soft }}>{ikigai.whyRecommended}</p>
          </div>
        </Section>
      </Card>

      {/* 3 Hypotheses */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.soft }}>3 Giả thuyết Ikigai</p>
        {ikigai.hypotheses?.map((h, i) => (
          <Card key={i}>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: i === 0 && h.title === ikigai.recommendation ? C.amber : C.text }}>{h.title}</p>
                {h.title === ikigai.recommendation && <Chip active>Khuyến nghị</Chip>}
              </div>
              <p className="text-xs" style={{ color: C.soft }}>{h.fit}</p>
              <div className="flex items-start gap-2 rounded-lg px-2.5 py-2" style={{ background: C.elevated }}>
                <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                <p className="text-xs" style={{ color: C.muted }}>Rủi ro: {h.risk}</p>
              </div>
              <div className="flex items-start gap-2 rounded-lg px-2.5 py-2" style={{ background: `${C.green}0A` }}>
                <Zap size={11} className="mt-0.5 shrink-0" style={{ color: C.green }} />
                <p className="text-xs" style={{ color: C.soft }}>Test: {h.test}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 90-day plan */}
      {ikigai.plan90d?.length > 0 && (
        <Card>
          <Section title="Hướng 90 ngày" icon={TrendingUp}>
            <div className="space-y-2 mt-2">
              {ikigai.plan90d.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: C.elevated }}>
                  <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: C.amber }}>{i + 1}</span>
                  <p className="text-sm" style={{ color: C.soft }}>{item}</p>
                </div>
              ))}
            </div>
          </Section>
        </Card>
      )}

      {/* Stop doing */}
      {ikigai.stopDoing?.length > 0 && (
        <Card>
          <Section title="Cần dừng lại" icon={X}>
            <div className="space-y-2 mt-2">
              {ikigai.stopDoing.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: `${C.red}08` }}>
                  <Minus size={12} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                  <p className="text-sm" style={{ color: C.soft }}>{item}</p>
                </div>
              ))}
            </div>
          </Section>
        </Card>
      )}

      {/* Self-awareness summary */}
      {sa && (
        <Card>
          <Section title="Chân dung hành vi" icon={Brain}>
            <p className="text-sm leading-relaxed mt-2" style={{ color: C.soft }}>{sa.summary}</p>
            {sa.toDo?.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-1.5">
                <p className="text-xs font-semibold" style={{ color: C.green }}>To-do list</p>
                {sa.toDo.map((t, i) => <Chip key={i} active color={C.green}>{t}</Chip>)}
              </div>
            )}
          </Section>
        </Card>
      )}
    </div>
  );
}

// ─── REVIEW SCREEN ────────────────────────────────────────────
function ReviewScreen({ data, update }) {
  const { weekly, today, selfAwareness: sa, ikigai, gamification } = data;
  const [loading, setLoading] = useState(false);

  const handleGenerateWeekly = async () => {
    setLoading(true);
    const result = await generateWeeklyReview(today, sa, ikigai, gamification);
    if (result) {
      update(d => ({ ...d, weekly: { ...result, generated: true } }));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>Review</h1>

      {/* Consistency card */}
      <Card>
        <Section title="Consistency Score" icon={BarChart2}>
          <div className="mt-3 space-y-3">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black" style={{ color: C.amber, fontFamily: "'Syne', sans-serif" }}>{gamification.score}</span>
              <span className="text-sm mb-1" style={{ color: C.muted }}>/100</span>
            </div>
            <ProgressBar value={gamification.score} color={gamification.score >= 70 ? C.green : C.amber} />
            <div className="flex gap-4 text-xs" style={{ color: C.soft }}>
              <span>Streak: <strong style={{ color: C.amber }}>{gamification.streak} ngày</strong></span>
              <span>Task hoàn thành: <strong style={{ color: C.amber }}>{today.tasks.filter(t => t.done).length}/3</strong></span>
            </div>
            {gamification.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gamification.badges.map(b => (
                  <div key={b} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: `${C.amber}22`, color: C.amber, border: `1px solid ${C.amber}44` }}>
                    <Award size={11} /> {b}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </Card>

      {/* Evening summary */}
      {today.evening.done && today.evening.aiSummary && (
        <Card>
          <Section title="AI tổng kết hôm nay" icon={Sparkles}>
            <p className="text-sm leading-relaxed mt-2" style={{ color: C.soft }}>{today.evening.aiSummary}</p>
          </Section>
        </Card>
      )}

      {/* Weekly Review */}
      <Card>
        <Section title="Weekly Review" icon={TrendingUp}
          action={
            <Btn small variant="outline" onClick={handleGenerateWeekly} disabled={loading}>
              {loading ? <Spinner size={12} /> : <><RefreshCw size={11} /> Phân tích tuần</>}
            </Btn>
          }
        >
          {weekly.generated ? (
            <div className="space-y-3 mt-3">
              {[
                { label: "Wins", text: weekly.wins, color: C.green },
                { label: "Misses", text: weekly.misses, color: C.red },
                { label: "Pattern", text: weekly.patterns, color: C.blue },
                { label: "Tuần tới", text: weekly.adjustments, color: C.amber },
              ].map(({ label, text, color }) => (
                <div key={label} className="rounded-xl px-3 py-3" style={{ background: C.elevated }}>
                  <p className="text-xs font-bold mb-1.5" style={{ color }}>{label}</p>
                  <p className="text-sm" style={{ color: C.soft }}>{text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm mb-3" style={{ color: C.muted }}>
                Nhấn "Phân tích tuần" để AI review pattern 7 ngày của bạn.
              </p>
            </div>
          )}
        </Section>
      </Card>

      {/* Routine adherence */}
      {data.routines && (
        <Card>
          <Section title="Routine minimum version" icon={Moon}>
            <div className="space-y-2 mt-2">
              {data.routines.minimum?.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: C.elevated }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: C.text }}>{r.title}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{r.purpose}</p>
                  </div>
                  <span className="text-xs" style={{ color: C.soft }}>{r.minutes}'</span>
                </div>
              ))}
            </div>
          </Section>
        </Card>
      )}
    </div>
  );
}

// ─── COACH SCREEN ─────────────────────────────────────────────
function CoachScreen({ data, update }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const SHORTCUTS = [
    "Sửa kế hoạch hôm nay",
    "Tôi đang lệch hướng",
    "Giúp tôi hiểu pattern của mình",
    "Review tuần này",
  ];

  const sendMessage = useCallback(async (msg) => {
    if (!msg.trim() || loading) return;
    const userMsg = { role: "user", content: msg };
    update(d => ({ ...d, chat: [...d.chat, userMsg] }));
    setInput("");
    setLoading(true);

    const reply = await generateCoachReply(msg, data);
    const assistantMsg = { role: "assistant", content: reply };
    update(d => ({ ...d, chat: [...d.chat, assistantMsg] }));
    setLoading(false);
  }, [data, loading, update]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.chat]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <h1 className="text-2xl font-black mb-4" style={{ color: C.text, fontFamily: "'Syne', sans-serif" }}>AI Coach</h1>

      {/* Context panel */}
      {data.selfAwareness && (
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { label: `Streak: ${data.gamification.streak}d`, color: C.amber },
            { label: `Tasks: ${data.today.tasks.filter(t => t.done).length}/3`, color: data.today.tasks.filter(t=>t.done).length === 3 ? C.green : C.soft },
            { label: `Energy: ${data.today.energy}/10`, color: C.blue },
          ].map(({ label, color }) => (
            <span key={label} className="text-xs rounded-full px-2.5 py-1 font-medium"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Shortcuts */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SHORTCUTS.map(q => (
          <button key={q} onClick={() => sendMessage(q)}
            className="text-xs rounded-full px-3 py-1.5 transition-all hover:opacity-90"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.soft }}>
            {q}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: "thin" }}>
        {data.chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === "user" ? C.amber : C.surface,
                color: msg.role === "user" ? "#000" : C.soft,
                border: msg.role === "assistant" ? `1px solid ${C.border}` : "none",
                borderTopRightRadius: msg.role === "user" ? 4 : undefined,
                borderTopLeftRadius: msg.role === "assistant" ? 4 : undefined,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Spinner size={14} />
              <span className="text-xs" style={{ color: C.soft }}>Coach đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Hỏi Coach bất cứ điều gì..."
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          onFocus={e => e.target.style.borderColor = C.amber}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="rounded-xl px-4 transition-all"
          style={{
            background: input.trim() && !loading ? C.amber : C.elevated,
            color: input.trim() && !loading ? "#000" : C.muted,
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── NAV BAR ──────────────────────────────────────────────────
function NavBar({ screen, setScreen }) {
  const ITEMS = [
    { key: "home",       label: "Home",      icon: Home },
    { key: "today",      label: "Today",     icon: CalendarDays },
    { key: "north-star", label: "North Star",icon: Compass },
    { key: "review",     label: "Review",    icon: BarChart2 },
    { key: "coach",      label: "Coach",     icon: MessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-2"
      style={{ background: `${C.bg}EE`, backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-2xl mx-auto grid grid-cols-5 gap-1">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const active = screen === key;
          return (
            <button key={key} onClick={() => setScreen(key)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
              style={{ color: active ? C.amber : C.muted, background: active ? `${C.amber}12` : "transparent" }}>
              <Icon size={18} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────
export default function ADHDOSApp() {
  const [data, setData] = useState(DEFAULT);

  // Font injection
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${C.amber}; cursor: pointer; }
      input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${C.amber}; cursor: pointer; border: none; }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: ${C.bg}; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
    `;
    document.head.appendChild(style);
  }, []);

  // Load from storage
  useEffect(() => {
    const saved = load();
    if (saved) setData(prev => ({ ...prev, ...saved }));
  }, []);

  // Save on change
  useEffect(() => { save(data); }, [data]);

  // Update helper (supports patch object or updater function)
  const update = useCallback((patchOrFn) => {
    setData(prev => {
      const next = typeof patchOrFn === "function" ? patchOrFn(prev) : { ...prev, ...patchOrFn };
      return next;
    });
  }, []);

  const setScreen = useCallback((screen) => {
    update(d => ({ ...d, ui: { screen } }));
  }, [update]);

  const { screen } = data.ui;

  // Route: pre-onboarding
  if (screen === "welcome") return <WelcomeScreen data={data} update={update} />;
  if (screen === "onboarding") return <OnboardingScreen data={data} update={update} />;
  if (screen === "onboarding-result") return <OnboardingResultScreen data={data} update={update} />;

  // Route: main app
  const SCREENS = {
    home:        <HomeScreen      data={data} update={update} setScreen={setScreen} />,
    today:       <TodayScreen     data={data} update={update} />,
    "north-star":<NorthStarScreen data={data} update={update} />,
    review:      <ReviewScreen    data={data} update={update} />,
    coach:       <CoachScreen     data={data} update={update} />,
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 40% 30% at 50% 0%, ${C.amber}06 0%, transparent 50%)`
      }} />
      <main className="max-w-2xl mx-auto px-4 pt-8 pb-32 relative">
        {SCREENS[screen] || SCREENS["home"]}
      </main>
      <NavBar screen={screen} setScreen={setScreen} />
    </div>
  );
}
