
/**
 * ADHD OS — MVP v3
 *
 * Core change from v2:
 *   AI Coach is NOT a chatbox.
 *   It's a 3-mode guided decision system:
 *     1. Morning Alignment  — chốt việc hôm nay
 *     2. Unstuck Flow       — gỡ rối từng bước
 *     3. Win Reflection     — ghi lại win
 *
 * Data: localStorage (Supabase-ready — see // SUPABASE markers)
 * AI:   Mock engine (set MOCK_AI=false + add API key to go live)
 */

import { useState, useEffect, useRef } from "react";

/* ── TOKENS ──────────────────────────────────────────────── */
const C = {
  bg:       "#0C0A08",
  surface:  "#131008",
  card:     "#1A1610",
  border:   "#2A2418",
  borderHi: "#3A3020",
  amber:    "#D4943A",
  amberLo:  "#6B4A18",
  amberHi:  "#F0B060",
  text:     "#EDE5D8",
  mid:      "#8A7E70",
  dim:      "#4A4030",
  green:    "#5AAB78",
  greenLo:  "#0E2018",
  blue:     "#5A8FBB",
  red:      "#BB5050",
};

/* ── LOCAL STORAGE ───────────────────────────────────────── */
// SUPABASE: replace all LS calls with supabase.from(...).select/upsert
const LS = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ── MOCK AI ─────────────────────────────────────────────── */
const MOCK_AI = true;

// Simulates Claude API call
async function callAI(systemPrompt, userMessage) {
  if (MOCK_AI) {
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    return mockAIResponse(systemPrompt, userMessage);
  }
  // REAL API: replace with your Anthropic/OpenAI/Gemini call
  // const res = await fetch("https://api.anthropic.com/v1/messages", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
  //   body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400,
  //     system: systemPrompt, messages: [{ role: "user", content: userMessage }] })
  // });
  // const data = await res.json();
  // return data.content[0].text;
}

function mockAIResponse(systemPrompt, userMessage) {
  const msg = userMessage.toLowerCase();

  // Morning alignment — suggest task
  if (systemPrompt.includes("MORNING") || systemPrompt.includes("morning")) {
    if (msg.includes("không biết") || msg.includes("chua biet") || msg.length < 15) {
      return "Dựa vào mục tiêu 90 ngày của bạn, hôm nay nên tập trung vào:\n→ Một bước nhỏ nhất đưa bạn gần hơn mục tiêu đó.\n\nViệc đó là gì — dù nhỏ?";
    }
    return `Được. Chốt lại:\n\n→ "${userMessage}"\n\nĐây là việc duy nhất quan trọng hôm nay. Làm xong việc này là một ngày thành công.`;
  }

  // Unstuck — generate next action
  if (systemPrompt.includes("UNSTUCK")) {
    const lines = userMessage.split("\n").filter(Boolean);
    const stuck = lines[0] || userMessage;
    const block = lines[1] || "";
    const small = lines[2] || "";

    if (small && small.length > 5) {
      return `Bước tiếp theo:\n\n→ ${small}\n\nChỉ làm bước này. Không cần hoàn hảo. Set timer 10 phút và bắt đầu ngay.`;
    }
    return `Bạn đang bị kẹt vì "${block || stuck}".\n\nBước nhỏ nhất có thể làm ngay:\n→ Dành 5 phút viết ra mọi thứ đang trong đầu. Sau đó chọn 1.`;
  }

  // Ikigai synthesis
  if (systemPrompt.includes("IKIGAI")) {
    return "IKIGAI_SYNTHESIS";
  }

  return `Được rồi. Chốt lại 1 việc tiếp theo:\n→ ${userMessage.substring(0, 60)}...\n\nLàm ngay. Không cần hoàn hảo.`;
}

/* ── IKIGAI SYNTHESIS ────────────────────────────────────── */
function buildIkigaiSynthesis(name, answers) {
  const [passion, topic, help, useful, direction, lifeVision, stopThis] = answers;
  return {
    hypothesis: `${name} có năng lực tự nhiên với "${topic || passion}" và mọi người tin tưởng bạn vì "${help}". Hướng tạo ra giá trị phù hợp nhất: "${direction}".`,
    northStar:  `${lifeVision || direction} — sống có chủ đích, làm việc có ý nghĩa, có tự do thời gian.`,
    focus90:    `Trong 90 ngày tới: xây nền tảng vững cho "${direction}" bằng cách tập trung vào "${help}".`,
    stopDoing:  stopThis || "Những việc không phục vụ North Star của bạn.",
  };
}

/* ── STYLES ──────────────────────────────────────────────── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; background: ${C.bg}; overflow: hidden; }
    textarea, input { font-family: 'DM Sans', sans-serif; outline: none; }
    textarea { resize: none; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
    @keyframes up    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes in    { from { opacity:0; } to { opacity:1; } }
    @keyframes pop   { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
    @keyframes dot   { 0%,100%{opacity:.25;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
    .up  { animation: up  .4s cubic-bezier(.16,1,.3,1) both; }
    .in  { animation: in  .35s ease both; }
    .d1  { animation-delay: .07s; }
    .d2  { animation-delay: .14s; }
    .d3  { animation-delay: .21s; }
    .d4  { animation-delay: .28s; }
    button { cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all .15s; }
    button:active { transform: scale(.96); }
  `}</style>
);

/* ── PRIMITIVES ──────────────────────────────────────────── */
const mono = (s = {}) => ({ fontFamily: "'DM Mono',monospace", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: C.dim, ...s });
const serif = (s = {}) => ({ fontFamily: "'Lora',serif", ...s });

function Lbl({ children, style }) { return <div style={{ ...mono(), ...style }}>{children}</div>; }

function Card({ children, style, className }) {
  return <div className={className} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", ...style }}>{children}</div>;
}

function Btn({ children, onClick, v = "primary", full, style, disabled }) {
  const vars = {
    primary: { background: `linear-gradient(135deg,${C.amber},${C.amberLo})`, color: "#0C0A08" },
    ghost:   { background: "transparent", border: `1.5px solid ${C.border}`,   color: C.mid      },
    green:   { background: C.greenLo,     border: `1.5px solid ${C.green}44`,  color: C.green    },
  };
  return (
    <button onClick={!disabled ? onClick : undefined}
      style={{ padding: "13px 20px", borderRadius: "12px", fontSize: "15px", fontWeight: 600,
        opacity: disabled ? 0.4 : 1, width: full ? "100%" : "auto", ...vars[v], ...style }}>
      {children}
    </button>
  );
}

function Dots({ n, cur }) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "28px" }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: i === cur ? "18px" : "6px", height: "6px", borderRadius: "3px",
          background: i <= cur ? C.amber : C.border, opacity: i < cur ? .5 : 1, transition: "all .3s" }} />
      ))}
    </div>
  );
}

function Thinking() {
  return (
    <div style={{ display: "flex", gap: "7px", justifyContent: "center", padding: "28px 0" }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%",
        background: C.amber, animation: `dot 1.3s ease ${i * .22}s infinite` }} />)}
    </div>
  );
}

function Divider() { return <div style={{ height: "1px", background: C.border, margin: "16px 0" }} />; }

/* ══════════════════════════════════════════════════════════
   ONBOARDING  (7 Ikigai questions → AI synthesis)
══════════════════════════════════════════════════════════ */
const IQ = [
  { q: "Việc gì làm bạn quên mất thời gian?",                   ph: "Bất kỳ thứ gì — không cần hợp lý..." },
  { q: "Bạn hay tìm hiểu, nói về chủ đề gì nhất?",             ph: "Chủ đề bạn đọc, xem, học mà không ai bắt..." },
  { q: "Mọi người hay nhờ bạn giúp việc gì?",                   ph: "Trong công việc lẫn cuộc sống..." },
  { q: "Việc gì khiến bạn cảm thấy có ích?",                    ph: "Khi nào bạn thấy mình đang đóng góp thật sự..." },
  { q: "Nếu 3 năm tới chỉ kiếm tiền từ 1 hướng — bạn chọn gì?", ph: "Hướng nào bạn thấy khả thi nhất..." },
  { q: "Cuộc sống lý tưởng của bạn sau 1 năm?",                 ph: "Một ngày bình thường trong cuộc sống đó..." },
  { q: "Điều gì bạn không muốn tiếp tục lặp lại nữa?",         ph: "Thói quen, môi trường, kiểu công việc..." },
];

function Onboarding({ onDone }) {
  const [phase,  setPhase]  = useState("welcome");
  const [step,   setStep]   = useState(0);
  const [name,   setName]   = useState("");
  const [ans,    setAns]    = useState(Array(7).fill(""));
  const [synth,  setSynth]  = useState(null);
  const [busy,   setBusy]   = useState(false);
  const taRef = useRef();

  useEffect(() => { if (phase === "questions") taRef.current?.focus(); }, [step, phase]);

  const setA = v => { const a = [...ans]; a[step] = v; setAns(a); };

  const next = async () => {
    if (step < 6) return setStep(s => s + 1);
    setBusy(true); setPhase("thinking");
    await new Promise(r => setTimeout(r, 2000));
    const s = buildIkigaiSynthesis(name, ans);
    // SUPABASE: await supabase.from('profiles').insert({ name, answers: ans, synthesis: s })
    setSynth(s); setBusy(false); setPhase("result");
  };

  const finish = () => {
    const profile = { name, answers: ans, synthesis: synth };
    LS.set("adhd_profile", profile);
    LS.set("north_star",   synth.northStar);
    LS.set("focus_90",     synth.focus90);
    onDone(profile);
  };

  if (phase === "welcome") return (
    <Mid>
      <div className="up" style={{ textAlign: "center", maxWidth: "340px" }}>
        <div style={{ fontSize: "44px", marginBottom: "18px" }}>🧠</div>
        <h1 style={{ ...serif(), fontSize: "clamp(28px,8vw,36px)", color: C.text, fontWeight: 600, marginBottom: "12px" }}>ADHD OS</h1>
        <p style={{ color: C.mid, fontSize: "15px", lineHeight: 1.75, marginBottom: "28px" }}>
          Không phải app productivity.<br />
          Đây là <span style={{ color: C.amber }}>hệ thống quyết định hàng ngày</span><br />
          được xây cho não ADHD.
        </p>
        <Lbl style={{ marginBottom: "10px", textAlign: "left" }}>Bạn tên gì?</Lbl>
        <input value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && setPhase("questions")}
          placeholder="Tên hoặc biệt danh..."
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: "12px", padding: "13px 16px", color: C.text, fontSize: "16px", marginBottom: "16px" }} />
        <Btn full onClick={() => setPhase("questions")} disabled={!name.trim()}>Bắt đầu →</Btn>
        <p style={{ color: C.dim, fontSize: "12px", marginTop: "12px" }}>7 câu · ~3 phút · không có câu trả lời sai</p>
      </div>
    </Mid>
  );

  if (phase === "questions") return (
    <Col>
      <div style={{ maxWidth: "460px", width: "100%", padding: "0 4px" }}>
        <Dots n={7} cur={step} />
        <div key={step} className="up">
          <Lbl style={{ marginBottom: "14px" }}>Câu {step + 1} / 7</Lbl>
          <h2 style={{ ...serif(), color: C.text, fontSize: "clamp(17px,5vw,21px)", lineHeight: 1.55, marginBottom: "20px", fontWeight: 500 }}>{IQ[step].q}</h2>
          <textarea ref={taRef} value={ans[step]} onChange={e => setA(e.target.value)}
            placeholder={IQ[step].ph} rows={4}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
              borderRadius: "12px", padding: "14px 16px", color: C.text, fontSize: "15px", lineHeight: 1.7, marginBottom: "16px" }} />
          <div style={{ display: "flex", gap: "10px" }}>
            {step > 0 && <Btn v="ghost" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>← Lại</Btn>}
            <Btn onClick={next} disabled={!ans[step]?.trim()} style={{ flex: 2 }}>
              {step < 6 ? "Tiếp →" : "Hoàn thành ✓"}
            </Btn>
          </div>
        </div>
      </div>
    </Col>
  );

  if (phase === "thinking") return (
    <Mid>
      <div className="in" style={{ textAlign: "center" }}>
        <Thinking />
        <p style={{ color: C.mid, fontSize: "14px" }}>Đang phân tích câu trả lời của bạn...</p>
      </div>
    </Mid>
  );

  if (phase === "result" && synth) return (
    <Col>
      <div style={{ maxWidth: "460px", width: "100%", padding: "0 4px" }}>
        <div className="up" style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>✦</div>
          <h2 style={{ ...serif(), color: C.text, fontSize: "22px" }}>Ikigai của {name}</h2>
          <p style={{ color: C.mid, fontSize: "13px", marginTop: "6px" }}>Tổng hợp từ 7 câu trả lời</p>
        </div>

        <Card className="up d1" style={{ marginBottom: "10px", border: `1px solid ${C.amberLo}` }}>
          <Lbl style={{ color: C.amber, marginBottom: "8px" }}>Nhận định</Lbl>
          <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.8 }}>{synth.hypothesis}</p>
        </Card>

        <Card className="up d2" style={{ marginBottom: "10px", background: "#0C0A04", border: `1px solid ${C.amberLo}55` }}>
          <Lbl style={{ color: C.amberLo, marginBottom: "8px" }}>✦ North Star</Lbl>
          <p style={{ color: C.amberHi, fontSize: "15px", lineHeight: 1.75, ...serif(), fontStyle: "italic" }}>"{synth.northStar}"</p>
        </Card>

        <Card className="up d3" style={{ marginBottom: "20px" }}>
          <Lbl style={{ marginBottom: "8px" }}>Mục tiêu 90 ngày</Lbl>
          <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.7 }}>{synth.focus90}</p>
        </Card>

        <div className="up d4">
          <Btn full onClick={finish}>Vào ADHD OS của tôi →</Btn>
          <p style={{ color: C.dim, fontSize: "12px", textAlign: "center", marginTop: "10px" }}>Bạn có thể chỉnh sửa bất cứ lúc nào</p>
        </div>
      </div>
    </Col>
  );
  return null;
}

/* ══════════════════════════════════════════════════════════
   TODAY SCREEN
══════════════════════════════════════════════════════════ */
const EL = [
  { v: 1, e: "😴", label: "Cạn kiệt",    tip: "Làm ít thôi hôm nay. 1 việc nhỏ là đủ.",   color: C.red   },
  { v: 2, e: "😕", label: "Mệt",          tip: "Chọn việc nhỏ nhất có thể hoàn thành.",     color: "#BB7040" },
  { v: 3, e: "😐", label: "Bình thường",  tip: "Làm đúng 1 việc quan trọng nhất.",           color: C.mid   },
  { v: 4, e: "🙂", label: "Khá tốt",      tip: "Tận dụng năng lượng này — bắt đầu ngay.",   color: C.blue  },
  { v: 5, e: "🔥", label: "Cao điểm",     tip: "Đây là thời điểm vàng. Làm việc khó nhất.", color: C.amber },
];

function TodayScreen({ profile, onWin }) {
  const key   = new Date().toLocaleDateString("vi-VN");
  const [nrg,  setNrg]  = useState(() => LS.get("nrg_"  + key, 0));
  const [task, setTask] = useState(() => LS.get("task_" + key, ""));
  const [done, setDone] = useState(() => LS.get("done_" + key, false));
  const [edit, setEdit] = useState(() => !LS.get("task_" + key, ""));
  const taRef = useRef();

  const northStar = LS.get("north_star", profile?.synthesis?.northStar || "");
  const focus90   = LS.get("focus_90",   profile?.synthesis?.focus90   || "");

  const saveNrg  = v => { setNrg(v);  LS.set("nrg_"  + key, v); };
  const saveTask = v => { setTask(v); LS.set("task_" + key, v); };

  const markDone = () => {
    setDone(true); LS.set("done_" + key, true);
    onWin({ date: key, task, energy: nrg });
    // SUPABASE: await supabase.from('wins').insert({ date: key, task, energy: nrg, user_id: uid })
  };

  useEffect(() => { if (edit) taRef.current?.focus(); }, [edit]);

  const el = EL.find(e => e.v === nrg);

  return (
    <Scroll>
      {/* North Star */}
      <div className="up" style={{ background: "#0C0902", border: `1px solid ${C.amberLo}55`,
        borderRadius: "14px", padding: "16px 18px", marginBottom: "14px" }}>
        <Lbl style={{ color: C.amberLo, marginBottom: "6px" }}>✦ North Star</Lbl>
        <p style={{ color: C.amber, fontSize: "13px", lineHeight: 1.7, ...serif(), fontStyle: "italic",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          "{northStar || "Chưa đặt — hoàn thành onboarding để bắt đầu"}"
        </p>
      </div>

      {/* Energy */}
      <Card className="up d1" style={{ marginBottom: "12px" }}>
        <Lbl style={{ marginBottom: "12px" }}>Năng lượng hôm nay</Lbl>
        <div style={{ display: "flex", gap: "6px" }}>
          {EL.map(o => (
            <button key={o.v} onClick={() => saveNrg(o.v)} style={{
              flex: 1, padding: "10px 0", borderRadius: "10px", fontSize: "20px",
              background: nrg === o.v ? o.color + "20" : "transparent",
              border:     `1.5px solid ${nrg === o.v ? o.color : C.border}`,
            }}>{o.e}</button>
          ))}
        </div>
        {el && <p style={{ textAlign: "center", marginTop: "10px", fontSize: "13px", color: el.color, fontWeight: 500 }}>
          {el.label} — {el.tip}
        </p>}
      </Card>

      {/* ONE THING */}
      <div className="up d2" style={{
        background: done ? C.greenLo : C.card,
        border: `1.5px solid ${done ? C.green + "55" : C.borderHi}`,
        borderRadius: "16px", padding: "20px", marginBottom: "12px", transition: "all .4s",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <Lbl style={{ color: done ? C.green : C.amber }}>⚡ Việc duy nhất hôm nay</Lbl>
          {done && <span style={{ fontSize: "18px", animation: "pop .4s ease" }}>✅</span>}
        </div>

        {done ? (
          <p style={{ color: C.green, fontSize: "16px", lineHeight: 1.65, ...serif() }}>{task}</p>
        ) : edit ? (
          <>
            <textarea ref={taRef} value={task} onChange={e => saveTask(e.target.value)}
              placeholder="Nếu chỉ làm được 1 việc hôm nay — việc đó là gì?" rows={3}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "10px", padding: "12px 14px", color: C.text, fontSize: "15px",
                lineHeight: 1.7, marginBottom: "12px" }} />
            {task.trim() && <Btn full onClick={() => setEdit(false)}>Chốt việc này ✓</Btn>}
          </>
        ) : (
          <>
            <p style={{ color: C.text, fontSize: "16px", lineHeight: 1.65, ...serif(), marginBottom: "16px" }}>{task}</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn v="ghost" onClick={() => setEdit(true)} style={{ flex: 1 }}>Đổi</Btn>
              <Btn onClick={markDone} style={{ flex: 2 }}>Hoàn thành ✓</Btn>
            </div>
          </>
        )}
      </div>

      {/* Connection */}
      {task && !edit && (
        <div className="up d3" style={{ background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "12px", padding: "12px 16px" }}>
          <Lbl style={{ marginBottom: "8px" }}>Việc hôm nay đang phục vụ</Lbl>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: C.mid, fontSize: "12px", maxWidth: "130px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task}</span>
            <span style={{ color: C.dim }}>→</span>
            <span style={{ color: C.amber, fontSize: "12px", flex: 1, lineHeight: 1.5 }}>
              {(focus90 || northStar).substring(0, 70)}...
            </span>
          </div>
        </div>
      )}

      {done && (
        <p className="in" style={{ textAlign: "center", color: C.green, fontSize: "14px",
          lineHeight: 1.7, ...serif(), fontStyle: "italic", marginTop: "20px" }}>
          "Một win nhỏ vẫn là bằng chứng tiến bộ."
        </p>
      )}
    </Scroll>
  );
}

/* ══════════════════════════════════════════════════════════
   AI COACH — 3 GUIDED FLOWS (not a chatbox)
   
   Logic:
   IF click "Chốt việc hôm nay"  → Morning Alignment flow
   IF click "Tôi đang bị rối"    → Unstuck flow  
   IF click "Ghi lại win"        → Win Reflection flow
══════════════════════════════════════════════════════════ */

// ── FLOW: Morning Alignment ───────────────────────────────
function FlowMorning({ profile, onDone, onBack }) {
  const [step,   setStep]   = useState(0); // 0=energy 1=task 2=confirm
  const [energy, setEnergy] = useState(0);
  const [task,   setTask]   = useState("");
  const [aiTip,  setAiTip]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const taRef = useRef();

  const focus90   = LS.get("focus_90",   "");
  const northStar = LS.get("north_star", "");

  useEffect(() => { if (step === 1) taRef.current?.focus(); }, [step]);

  const goToTask = async (e) => {
    setEnergy(e);
    setBusy(true);
    const sys = `MORNING ALIGNMENT. User: ${profile.name}. ADHD. 90-day goal: "${focus90}". North Star: "${northStar}". Energy: ${EL.find(x=>x.v===e)?.label}.`;
    const tip = await callAI(sys, "Tôi cần gợi ý việc quan trọng nhất hôm nay.");
    setAiTip(tip); setBusy(false); setStep(1);
  };

  const confirm = () => {
    const key = new Date().toLocaleDateString("vi-VN");
    LS.set("task_" + key, task);
    LS.set("nrg_"  + key, energy);
    // SUPABASE: await supabase.from('daily_focus').upsert({ date: key, task, energy, user_id: uid })
    onDone({ task, energy });
  };

  return (
    <FlowWrapper title="Chốt việc hôm nay" onBack={onBack}>
      {step === 0 && (
        <div className="up">
          <Lbl style={{ marginBottom: "14px" }}>Năng lượng của bạn lúc này?</Lbl>
          {EL.map(o => (
            <button key={o.v} onClick={() => goToTask(o.v)} style={{
              width: "100%", background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: "12px", padding: "14px 16px", marginBottom: "8px",
              display: "flex", alignItems: "center", gap: "14px", textAlign: "left",
            }}>
              <span style={{ fontSize: "22px" }}>{o.e}</span>
              <div>
                <p style={{ color: C.text, fontSize: "14px", fontWeight: 500 }}>{o.label}</p>
                <p style={{ color: C.mid, fontSize: "12px", marginTop: "2px" }}>{o.tip}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div key="task" className="up">
          {busy ? <Thinking /> : (
            <>
              {aiTip && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                  <Lbl style={{ color: C.amberLo, marginBottom: "8px" }}>Coach gợi ý</Lbl>
                  <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.7 }}>{aiTip}</p>
                </div>
              )}
              <Lbl style={{ marginBottom: "10px" }}>Việc duy nhất quan trọng nhất hôm nay?</Lbl>
              <textarea ref={taRef} value={task} onChange={e => setTask(e.target.value)}
                placeholder="Viết ngắn gọn — 1 câu là đủ..." rows={3}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
                  borderRadius: "12px", padding: "13px 15px", color: C.text, fontSize: "15px",
                  lineHeight: 1.7, marginBottom: "14px" }} />
              <Btn full onClick={() => setStep(2)} disabled={!task.trim()}>Chốt →</Btn>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="up">
          <Card style={{ border: `1px solid ${C.green}44`, background: C.greenLo, marginBottom: "14px" }}>
            <Lbl style={{ color: C.green, marginBottom: "10px" }}>Chốt lại</Lbl>
            <p style={{ color: C.text, fontSize: "17px", lineHeight: 1.65, ...serif() }}>{task}</p>
            <Divider />
            <p style={{ color: C.mid, fontSize: "13px", lineHeight: 1.6 }}>
              {EL.find(e => e.v === energy)?.e} Năng lượng: {EL.find(e => e.v === energy)?.label}
            </p>
          </Card>
          <Btn full onClick={confirm}>Bắt đầu ngay →</Btn>
        </div>
      )}
    </FlowWrapper>
  );
}

// ── FLOW: Unstuck ─────────────────────────────────────────
const UNSTUCK_Q = [
  { q: "Bạn đang cố làm điều gì?",              ph: "Mô tả ngắn gọn..." },
  { q: "Điều gì đang làm bạn chần chừ?",        ph: "Không biết bắt đầu? Sợ làm sai? Quá nhiều việc?..." },
  { q: "Nếu chỉ làm 1 bước rất nhỏ, bước đó là gì?", ph: "Nhỏ đến mức không thể từ chối làm..." },
];

function FlowUnstuck({ profile, onBack }) {
  const [step,  setStep]  = useState(0);
  const [ans,   setAns]   = useState(Array(3).fill(""));
  const [result,setResult]= useState("");
  const [busy,  setBusy]  = useState(false);
  const taRef = useRef();

  useEffect(() => { taRef.current?.focus(); }, [step]);

  const setA = v => { const a = [...ans]; a[step] = v; setAns(a); };

  const next = async () => {
    if (step < 2) return setStep(s => s + 1);
    setBusy(true);
    const sys = `UNSTUCK FLOW. User: ${profile.name}. ADHD. Đang bị kẹt.`;
    const msg = `Đang cố làm: ${ans[0]}\nĐang bị chặn vì: ${ans[1]}\nBước nhỏ nhất: ${ans[2]}`;
    const r = await callAI(sys, msg);
    // SUPABASE: await supabase.from('coaching_sessions').insert({ type:'unstuck', answers:ans, result:r, user_id:uid })
    setResult(r); setBusy(false);
  };

  if (busy) return <FlowWrapper title="Tôi đang bị rối" onBack={onBack}><Thinking /></FlowWrapper>;

  if (result) return (
    <FlowWrapper title="Bước tiếp theo" onBack={onBack}>
      <div className="up">
        <Card style={{ border: `1px solid ${C.green}55`, background: C.greenLo, marginBottom: "14px" }}>
          <Lbl style={{ color: C.green, marginBottom: "10px" }}>Coach chốt lại</Lbl>
          <pre style={{ color: C.text, fontSize: "15px", lineHeight: 1.8,
            fontFamily: "'DM Sans',sans-serif", whiteSpace: "pre-wrap" }}>{result}</pre>
        </Card>
        <Btn v="ghost" full onClick={() => { setStep(0); setAns(Array(3).fill("")); setResult(""); }}>
          Gỡ rối lại từ đầu
        </Btn>
      </div>
    </FlowWrapper>
  );

  return (
    <FlowWrapper title="Tôi đang bị rối" onBack={onBack}>
      <div key={step} className="up">
        <Dots n={3} cur={step} />
        <p style={{ color: C.mid, fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>
          Không cần giải thích nhiều. Trả lời 3 câu — mình sẽ giúp bạn chốt 1 bước.
        </p>
        <Lbl style={{ marginBottom: "10px" }}>Câu {step + 1}</Lbl>
        <p style={{ color: C.text, fontSize: "17px", lineHeight: 1.55, ...serif(),
          fontStyle: "italic", marginBottom: "18px" }}>
          "{UNSTUCK_Q[step].q}"
        </p>
        <textarea ref={taRef} value={ans[step]} onChange={e => setA(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && ans[step].trim()) { e.preventDefault(); next(); } }}
          placeholder={UNSTUCK_Q[step].ph} rows={3}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
            borderRadius: "12px", padding: "13px 15px", color: C.text, fontSize: "15px",
            lineHeight: 1.7, marginBottom: "14px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          {step > 0 && <Btn v="ghost" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>← Lại</Btn>}
          <Btn onClick={next} disabled={!ans[step].trim()} style={{ flex: 2 }}>
            {step < 2 ? "Tiếp →" : "Chốt ngay →"}
          </Btn>
        </div>
        <p style={{ color: C.dim, fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
          Enter để tiếp · Shift+Enter xuống dòng
        </p>
      </div>
    </FlowWrapper>
  );
}

// ── FLOW: Win Reflection ──────────────────────────────────
function FlowWin({ onSave, onBack }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const taRef = useRef();
  useEffect(() => { taRef.current?.focus(); }, []);

  const save = () => {
    const key = new Date().toLocaleDateString("vi-VN");
    onSave({ date: key, task: text, energy: 3 });
    setDone(true);
  };

  if (done) return (
    <FlowWrapper title="Win đã ghi lại" onBack={onBack}>
      <div className="up" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pop .5s ease" }}>🏆</div>
        <Card style={{ border: `1px solid ${C.green}44`, background: C.greenLo, marginBottom: "16px" }}>
          <p style={{ color: C.green, fontSize: "16px", lineHeight: 1.65, ...serif() }}>{text}</p>
        </Card>
        <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.7, fontStyle: "italic", ...serif() }}>
          "Một win nhỏ vẫn là bằng chứng tiến bộ."
        </p>
      </div>
    </FlowWrapper>
  );

  return (
    <FlowWrapper title="Ghi lại win" onBack={onBack}>
      <div className="up">
        <Lbl style={{ marginBottom: "10px" }}>Bạn vừa hoàn thành điều gì?</Lbl>
        <p style={{ color: C.mid, fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
          Dù nhỏ cũng tính. Hoàn thành một email, đi tập, đọc 10 trang — tất cả đều là bằng chứng.
        </p>
        <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)}
          placeholder="Mô tả ngắn gọn điều bạn vừa làm xong..." rows={4}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
            borderRadius: "12px", padding: "13px 15px", color: C.text, fontSize: "15px",
            lineHeight: 1.7, marginBottom: "14px" }} />
        <Btn full onClick={save} disabled={!text.trim()}>Ghi lại win này →</Btn>
      </div>
    </FlowWrapper>
  );
}

// ── COACH HOME (3 big buttons) ────────────────────────────
function CoachScreen({ profile, onWin }) {
  const [flow, setFlow] = useState(null); // null | "morning" | "unstuck" | "win"
  const [doneTask, setDoneTask] = useState(null);

  if (flow === "morning") return <FlowMorning profile={profile}
    onDone={t => { setDoneTask(t); setFlow("done_morning"); }}
    onBack={() => setFlow(null)} />;

  if (flow === "done_morning") return (
    <FlowWrapper title="Xong rồi!" onBack={() => setFlow(null)}>
      <div className="up" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
        <Card style={{ border: `1px solid ${C.amber}44`, marginBottom: "14px" }}>
          <Lbl style={{ color: C.amber, marginBottom: "8px" }}>Việc hôm nay</Lbl>
          <p style={{ color: C.text, fontSize: "16px", lineHeight: 1.65, ...serif() }}>
            {doneTask?.task}
          </p>
        </Card>
        <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.7 }}>
          Đã lưu vào Today. Bắt đầu làm ngay — không cần chờ "điều kiện hoàn hảo".
        </p>
      </div>
    </FlowWrapper>
  );

  if (flow === "unstuck") return <FlowUnstuck profile={profile} onBack={() => setFlow(null)} />;

  if (flow === "win") return <FlowWin
    onSave={w => { onWin(w); setFlow("done_win"); }}
    onBack={() => setFlow(null)} />;

  if (flow === "done_win") return (
    <FlowWrapper title="Win ghi lại rồi" onBack={() => setFlow(null)}>
      <div className="up" style={{ textAlign: "center", paddingTop: "20px" }}>
        <div style={{ fontSize: "44px", marginBottom: "16px" }}>🏆</div>
        <p style={{ color: C.green, fontSize: "16px", ...serif(), fontStyle: "italic" }}>
          "Não ADHD cần thấy bằng chứng để tin vào bản thân."
        </p>
        <Divider />
        <Btn v="ghost" full onClick={() => setFlow(null)}>Quay lại Coach</Btn>
      </div>
    </FlowWrapper>
  );

  // HOME
  return (
    <Scroll>
      <div className="up" style={{ marginBottom: "24px" }}>
        <h2 style={{ ...serif(), color: C.text, fontSize: "22px", marginBottom: "6px" }}>AI Coach</h2>
        <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.6 }}>
          Không phải chatbot. Đây là hệ thống dẫn quyết định<br />cho não ADHD.
        </p>
      </div>

      {/* 3 BIG BUTTONS — the core UX */}
      {[
        {
          flow: "morning",
          icon: "⚡",
          title: "Chốt việc hôm nay",
          sub: "Chọn năng lượng → AI gợi ý → chốt 1 việc",
          color: C.amber,
          bg: "#1A1208",
          border: C.amberLo,
        },
        {
          flow: "unstuck",
          icon: "🌀",
          title: "Tôi đang bị rối",
          sub: "3 câu hỏi → AI chốt 1 bước nhỏ tiếp theo",
          color: C.blue,
          bg: "#08101A",
          border: "#1A3050",
        },
        {
          flow: "win",
          icon: "✦",
          title: "Ghi lại win",
          sub: "Hoàn thành rồi? Lưu lại — não cần bằng chứng",
          color: C.green,
          bg: C.greenLo,
          border: C.green + "33",
        },
      ].map((item, i) => (
        <button key={i} onClick={() => setFlow(item.flow)}
          className={`up d${i + 1}`}
          style={{
            width: "100%", background: item.bg, border: `1.5px solid ${item.border}`,
            borderRadius: "16px", padding: "20px", marginBottom: "10px",
            display: "flex", alignItems: "center", gap: "16px", textAlign: "left",
          }}>
          <span style={{ fontSize: "28px", flexShrink: 0 }}>{item.icon}</span>
          <div>
            <p style={{ color: C.text, fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</p>
            <p style={{ color: C.mid, fontSize: "13px", lineHeight: 1.5 }}>{item.sub}</p>
          </div>
          <span style={{ color: C.dim, marginLeft: "auto", fontSize: "18px" }}>›</span>
        </button>
      ))}

      <Divider />

      {/* Philosophy */}
      <div className="up d4">
        {[
          "Bạn không cần giải quyết mọi thứ hôm nay.",
          "Chỉ cần biết 1 bước tiếp theo.",
          "Làm ít nhưng đúng.",
        ].map((t, i) => (
          <p key={i} style={{ color: C.dim, fontSize: "13px", lineHeight: 1.7,
            textAlign: "center", marginBottom: i < 2 ? "6px" : 0 }}>— {t}</p>
        ))}
      </div>
    </Scroll>
  );
}

// ── FLOW WRAPPER (shared layout for all flows) ────────────
function FlowWrapper({ title, onBack, children }) {
  return (
    <Scroll>
      <div style={{ maxWidth: "460px", width: "100%", padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button onClick={onBack} style={{ background: "transparent", color: C.mid,
            fontSize: "20px", padding: "4px 8px" }}>←</button>
          <h2 style={{ ...serif(), color: C.text, fontSize: "20px" }}>{title}</h2>
        </div>
        {children}
      </div>
    </Scroll>
  );
}

/* ══════════════════════════════════════════════════════════
   WINS SCREEN
══════════════════════════════════════════════════════════ */
function WinsScreen({ wins }) {
  const today    = new Date().toLocaleDateString("vi-VN");
  const todayW   = wins.filter(w => w.date === today);
  const pastW    = wins.filter(w => w.date !== today);
  const totalDays= new Set(wins.map(w => w.date)).size;

  return (
    <Scroll>
      <div className="up" style={{ marginBottom: "20px" }}>
        <h2 style={{ ...serif(), color: C.text, fontSize: "22px", marginBottom: "6px" }}>Bằng chứng tiến bộ</h2>
        <p style={{ color: C.mid, fontSize: "14px" }}>Não ADHD cần thấy bằng chứng để tin vào bản thân.</p>
      </div>

      <div className="up d1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
        {[
          { n: wins.length, label: "Tổng wins",   color: C.amber },
          { n: totalDays,   label: "Ngày có win", color: C.green },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: "18px" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "36px",
              color: s.color, fontWeight: 500, lineHeight: 1 }}>{s.n}</div>
            <Lbl style={{ marginTop: "8px" }}>{s.label}</Lbl>
          </Card>
        ))}
      </div>

      {todayW.length > 0 && (
        <div className="up d2">
          <Lbl style={{ marginBottom: "10px" }}>Hôm nay</Lbl>
          {todayW.map((w, i) => <WinRow key={i} w={w} hi />)}
          <Divider />
        </div>
      )}

      {pastW.length > 0 && (
        <div className="up d3">
          <Lbl style={{ marginBottom: "10px" }}>Gần đây</Lbl>
          {pastW.slice(0, 15).map((w, i) => <WinRow key={i} w={w} />)}
        </div>
      )}

      {wins.length === 0 && (
        <Card className="up d2" style={{ textAlign: "center", padding: "36px 20px" }}>
          <p style={{ color: C.mid, fontSize: "15px", lineHeight: 1.7, marginBottom: "8px" }}>Chưa có win nào.</p>
          <p style={{ color: C.dim, fontSize: "13px" }}>Dùng tab Coach → "Ghi lại win" sau khi hoàn thành việc gì đó.</p>
        </Card>
      )}
    </Scroll>
  );
}

function WinRow({ w, hi = false }) {
  const e = EL.find(x => x.v === w.energy);
  return (
    <div style={{ background: hi ? C.greenLo : C.surface, border: `1px solid ${hi ? C.green + "33" : C.border}`,
      borderRadius: "12px", padding: "13px 16px", marginBottom: "8px",
      display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <span style={{ fontSize: "16px" }}>{e?.e || "✅"}</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.55 }}>{w.task}</p>
        <p style={{ color: C.dim, fontSize: "10px", marginTop: "4px", fontFamily: "'DM Mono',monospace" }}>{w.date}</p>
      </div>
      <span style={{ color: C.green, fontSize: "13px" }}>✓</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LAYOUT HELPERS
══════════════════════════════════════════════════════════ */
function Mid({ children }) {
  return <div style={{ height: "calc(100dvh - 64px)", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "24px 20px" }}>{children}</div>;
}
function Col({ children }) {
  return <div style={{ height: "calc(100dvh - 64px)", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "24px 20px",
    overflowY: "auto", maxWidth: "480px", margin: "0 auto" }}>{children}</div>;
}
function Scroll({ children }) {
  return <div style={{ height: "calc(100dvh - 64px)", overflowY: "auto",
    padding: "20px 16px", maxWidth: "480px", margin: "0 auto" }}>{children}</div>;
}

/* ══════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "today", icon: "⚡", label: "Hôm nay"  },
  { id: "coach", icon: "🧠", label: "Coach"    },
  { id: "wins",  icon: "✦",  label: "Tiến bộ"  },
];

function Nav({ active, set }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: "480px", background: C.surface, borderTop: `1px solid ${C.border}`,
      display: "flex", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 20 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => set(t.id)} style={{ flex: 1, padding: "12px 4px 14px",
          background: "transparent", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "20px", opacity: active === t.id ? 1 : .3, transition: "all .2s" }}>{t.icon}</span>
          <span style={{ color: active === t.id ? C.amber : C.dim, fontSize: "10px",
            fontFamily: "'DM Mono',monospace", letterSpacing: ".5px", transition: "all .2s" }}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function App() {
  const [profile, setProfile] = useState(() => LS.get("adhd_profile", null));
  const [tab,     setTab]     = useState("today");
  const [wins,    setWins]    = useState(() => LS.get("adhd_wins", []));

  const addWin = (w) => {
    const updated = [w, ...wins];
    setWins(updated);
    LS.set("adhd_wins", updated);
    // SUPABASE: await supabase.from('wins').insert({ ...w, user_id: uid })
  };

  if (!profile) return <><G /><Onboarding onDone={p => { setProfile(p); setTab("coach"); }} /></>;

  return (
    <>
      <G />
      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "480px", zIndex: 10, background: C.bg + "F0",
        backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`,
        padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "7px",
            background: `linear-gradient(135deg,${C.amber},${C.amberLo})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>🧠</div>
          <span style={{ ...serif(), color: C.text, fontSize: "15px", fontWeight: 500 }}>ADHD OS</span>
        </div>
        <span style={{ color: C.dim, fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>
          {profile.name}
        </span>
      </header>

      {/* Screens */}
      <div style={{ paddingTop: "58px" }}>
        {tab === "today" && <TodayScreen profile={profile} onWin={addWin} />}
        {tab === "coach" && <CoachScreen profile={profile}  onWin={addWin} />}
        {tab === "wins"  && <WinsScreen  wins={wins} />}
      </div>

      <Nav active={tab} set={setTab} />
    </>
  );
}
