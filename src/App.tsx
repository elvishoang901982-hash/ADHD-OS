/**
 * ADHD OS — v4
 * 
 * 5 màn hình:
 *   1. REFLECT  — Phản tư sâu 3 vòng → Core Identity
 *   2. COMPASS  — North Star → 90 ngày → Tuần này
 *   3. TODAY    — Brain dump → AI lọc → 3 bước nhỏ
 *   4. COACH    — 3 tình huống bị kẹt cụ thể
 *   5. EVIDENCE — Nhật ký bằng chứng tiến bộ
 * 
 * AI: Claude API (claude-sonnet-4-20250514)
 * Data: localStorage (Supabase-ready)
 * 
 * THUẬT NGỮ:
 *   Brain dump    = Đổ hết suy nghĩ ra không lọc
 *   Executive Function = Khả năng lên kế hoạch & bắt đầu hành động
 *   Core Identity = Câu mô tả bạn là ai ở cốt lõi
 *   North Star    = Tầm nhìn dài hạn định hướng mọi quyết định
 *   Sprint        = Giai đoạn tập trung ngắn có mục tiêu rõ
 */

import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS — Warm dark, ink & amber
══════════════════════════════════════════════════════════ */
const C = {
  bg:       "#0A0906",
  surface:  "#111009",
  card:     "#181510",
  cardHi:   "#201C14",
  border:   "#282010",
  borderHi: "#382C18",
  amber:    "#C8863A",
  amberLo:  "#5A3A10",
  amberHi:  "#E8A850",
  amberGlow:"#C8863A22",
  text:     "#EDE5D4",
  textMid:  "#8A7A60",
  textDim:  "#48402A",
  green:    "#4A9660",
  greenLo:  "#0A180E",
  greenHi:  "#6ABB80",
  blue:     "#4A7AAA",
  blueLo:   "#0A1420",
  red:      "#AA4A4A",
  redLo:    "#1A0A0A",
};

/* ══════════════════════════════════════════════════════════
   LOCAL STORAGE — Supabase-ready
══════════════════════════════════════════════════════════ */
// SUPABASE: thay thế bằng supabase.from('table').select/upsert
const LS = {
  get: (k, d = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
    catch { return d; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)    => { try { localStorage.removeItem(k); } catch {} },
};

/* ══════════════════════════════════════════════════════════
   CLAUDE API
══════════════════════════════════════════════════════════ */
async function askClaude(systemPrompt, messages, apiKey, maxTokens = 600) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ systemPrompt, messages, apiKey, maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Lỗi kết nối API");
  }
  const data = await res.json();
  return data.content.map(b => b.text || "").join("").trim();
}

// System prompt cốt lõi — inject profile vào mọi lần gọi AI
function buildSystemPrompt(profile) {
  const p = profile || {};
  return `Bạn là AI Coach chuyên biệt cho người ADHD (Rối loạn tăng động giảm chú ý — Attention Deficit Hyperactivity Disorder).

HIỂU VỀ NÃO ADHD:
- Không phải lười biếng. Đây là vấn đề về Executive Function (khả năng khởi động & điều hướng hành động).
- Não ADHD cần: rõ ràng tuyệt đối, bước nhỏ không thể từ chối, và bằng chứng tiến bộ liên tục.
- Tránh: áp lực, phán xét, câu trả lời dài dòng, nhiều lựa chọn cùng lúc.

THÔNG TIN VỀ NGƯỜI DÙNG:
- Tên: ${p.name || "chưa có"}
- Core Identity (Bản sắc cốt lõi): ${p.coreIdentity || "chưa xác định"}
- North Star (Tầm nhìn dài hạn): ${p.northStar || "chưa xác định"}
- Mục tiêu 90 ngày: ${p.goal90 || "chưa xác định"}
- Điểm yếu chính: ${(p.struggles || []).join(", ") || "chưa biết"}

QUY TẮC TRẢ LỜI:
1. Tối đa 120 từ — não ADHD không đọc dài
2. Luôn kết thúc bằng 1 hành động CỰC KỲ cụ thể
3. Không hỏi nhiều hơn 1 câu một lúc
4. Dùng tiếng Việt, giải thích thuật ngữ tiếng Anh khi cần
5. Giọng: ấm áp, thực tế, không thuyết giảng
6. Khi chia nhỏ việc: mỗi bước < 15 phút, bắt đầu bằng động từ cụ thể`;
}

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════ */
function GS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Nunito:wght@300;400;500;600;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; background: ${C.bg}; color: ${C.text}; }
      textarea, input { font-family: 'Nunito', sans-serif; }
      textarea { resize: none; }
      ::-webkit-scrollbar { width: 2px; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 1px; }

      @keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
      @keyframes scaleIn  { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }
      @keyframes pulse    { 0%,100%{ opacity:.2; transform:scale(.7) } 50%{ opacity:1; transform:scale(1) } }
      @keyframes shimmer  { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
      @keyframes glow     { 0%,100%{ box-shadow:0 0 20px ${C.amberGlow} } 50%{ box-shadow:0 0 40px ${C.amberGlow} } }
      @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.4)} 100%{transform:scale(1)} }
      @keyframes slideIn  { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }

      .fu  { animation: fadeUp  .5s cubic-bezier(.16,1,.3,1) both; }
      .fi  { animation: fadeIn  .4s ease both; }
      .si  { animation: scaleIn .4s cubic-bezier(.16,1,.3,1) both; }
      .d1  { animation-delay: .06s; }
      .d2  { animation-delay: .12s; }
      .d3  { animation-delay: .18s; }
      .d4  { animation-delay: .24s; }
      .d5  { animation-delay: .30s; }

      button { cursor: pointer; border: none; font-family: 'Nunito', sans-serif; transition: all .18s ease; }
      button:active { transform: scale(.95) !important; }
      button:disabled { opacity: .4; cursor: default; }
      textarea:focus, input:focus { outline: none; border-color: ${C.amberLo} !important; }

      .loading-dots span {
        display: inline-block; width: 7px; height: 7px; border-radius: 50%;
        background: ${C.amber}; margin: 0 3px;
        animation: pulse 1.4s ease infinite;
      }
      .loading-dots span:nth-child(2) { animation-delay: .2s; }
      .loading-dots span:nth-child(3) { animation-delay: .4s; }
    `}</style>
  );
}

/* ══════════════════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════════════════ */
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };

function Tag({ children, color = C.amber, style = {} }) {
  return (
    <span style={{
      ...mono, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
      color, ...style
    }}>{children}</span>
  );
}

function Card({ children, style = {}, className = "", glow = false }) {
  return (
    <div className={className} style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: "18px", padding: "20px",
      ...(glow ? { animation: "glow 3s ease infinite", border: `1px solid ${C.amberLo}` } : {}),
      ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, v = "primary", full = false, style = {}, disabled = false, size = "md" }) {
  const sizes = { sm: "10px 16px", md: "13px 22px", lg: "16px 28px" };
  const fonts = { sm: "13px", md: "15px", lg: "17px" };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.amber}, ${C.amberLo})`, color: "#0A0906", fontWeight: 700 },
    ghost:   { background: "transparent", border: `1.5px solid ${C.border}`, color: C.textMid },
    green:   { background: C.greenLo, border: `1.5px solid ${C.green}44`, color: C.greenHi, fontWeight: 600 },
    red:     { background: C.redLo, border: `1.5px solid ${C.red}44`, color: C.red },
    amber:   { background: C.amberGlow, border: `1.5px solid ${C.amberLo}`, color: C.amberHi, fontWeight: 600 },
  };
  return (
    <button disabled={disabled} onClick={disabled ? undefined : onClick} style={{
      padding: sizes[size], borderRadius: "12px", fontSize: fonts[size],
      width: full ? "100%" : "auto", ...variants[v], ...style,
    }}>{children}</button>
  );
}

function Divider({ color = C.border, margin = "20px 0" }) {
  return <div style={{ height: "1px", background: color, margin }} />;
}

function Sp({ n = 1 }) {
  return <div style={{ height: `${n * 12}px` }} />;
}

function Loading({ text = "Đang phân tích..." }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div className="loading-dots" style={{ marginBottom: "16px" }}>
        <span /><span /><span />
      </div>
      <p style={{ color: C.textMid, fontSize: "14px" }}>{text}</p>
    </div>
  );
}

function ProgressBar({ value, max, color = C.amber }) {
  return (
    <div style={{ background: C.border, borderRadius: "4px", height: "4px", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${(value / max) * 100}%`,
        background: color, borderRadius: "4px", transition: "width .5s ease",
      }} />
    </div>
  );
}

function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "32px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: "5px", borderRadius: "3px", transition: "all .35s ease",
          width: i === current ? "24px" : "5px",
          background: i <= current ? C.amber : C.border,
          opacity: i < current ? 0.4 : 1,
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   API KEY SCREEN
══════════════════════════════════════════════════════════ */
function ApiKeyScreen({ onSave }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [testing, setTesting] = useState(false);

  const test = async () => {
    if (!key.trim().startsWith("sk-ant-")) {
      return setErr("API key không đúng định dạng — phải bắt đầu bằng sk-ant-");
    }
    setTesting(true); setErr("");
    try {
      await askClaude("Trả lời ngắn gọn bằng tiếng Việt.", [{ role: "user", content: "Xin chào" }], key.trim(), 50);
      LS.set("adhd_api_key", key.trim());
      onSave(key.trim());
    } catch (e) {
      setErr("API key không hợp lệ: " + e.message);
    }
    setTesting(false);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="fu" style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "44px", marginBottom: "20px" }}>🔑</div>
        <h2 style={{ ...serif, color: C.text, fontSize: "26px", marginBottom: "10px" }}>Kết nối AI</h2>
        <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.75, marginBottom: "28px" }}>
          ADHD OS dùng <strong style={{ color: C.amber }}>Claude AI</strong> — trí tuệ nhân tạo của Anthropic —
          để coach bạn thật sự, không phải giả lập.
        </p>

        <Card style={{ textAlign: "left", marginBottom: "20px" }}>
          <Tag style={{ marginBottom: "10px", display: "block" }}>Lấy API Key</Tag>
          <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.7, marginBottom: "12px" }}>
            1. Vào <span style={{ color: C.amberHi }}>console.anthropic.com</span><br />
            2. Đăng ký / đăng nhập<br />
            3. Vào <em>API Keys</em> → <em>Create Key</em><br />
            4. Copy key và paste vào đây
          </p>
          <p style={{ color: C.textDim, fontSize: "12px" }}>
            Chi phí ước tính: ~$0.50–$2 / tháng cho 1 người dùng
          </p>
        </Card>

        <input
          value={key} onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          type="password"
          style={{
            width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
            borderRadius: "12px", padding: "13px 16px", color: C.text, fontSize: "14px",
            marginBottom: "12px", letterSpacing: "0.5px",
          }}
        />

        {err && <p style={{ color: C.red, fontSize: "13px", marginBottom: "12px" }}>{err}</p>}

        <Btn full onClick={test} disabled={!key.trim() || testing} size="lg">
          {testing ? "Đang kiểm tra..." : "Kết nối & bắt đầu →"}
        </Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SCREEN 1 — REFLECT (Phản tư sâu 3 vòng)
══════════════════════════════════════════════════════════ */
const REFLECT_ROUNDS = [
  {
    id: "past",
    title: "Quá khứ",
    icon: "◎",
    color: C.blue,
    intro: "Nhìn lại để hiểu bạn là ai thật sự — không phải bạn muốn người khác thấy gì.",
    questions: [
      { q: "Khi nào trong cuộc sống bạn cảm thấy 'mình nhất' — tràn đầy năng lượng và đúng chỗ?", ph: "Có thể là một khoảnh khắc nhỏ, một dự án, một ngày..." },
      { q: "Điều gì bạn đã làm được mà chính bạn cũng bất ngờ về bản thân?", ph: "Dù nhỏ cũng kể..." },
    ]
  },
  {
    id: "present",
    title: "Hiện tại",
    icon: "◉",
    color: C.amber,
    intro: "Não ADHD thường chạy ở 'chế độ nền' — nhiều thứ đang chiếm không gian mà bạn chưa nhận ra.",
    questions: [
      { q: "Điều gì đang chiếm não bạn nhiều nhất lúc này — kể cả những thứ bạn cố không nghĩ đến?", ph: "Đổ hết ra — không cần logic, không cần thứ tự..." },
      { q: "Nếu giải quyết được 1 thứ trong danh sách đó, cuộc sống sẽ nhẹ hơn bao nhiêu?", ph: "Thứ nào nặng nhất?..." },
    ]
  },
  {
    id: "future",
    title: "Tương lai",
    icon: "◈",
    color: C.green,
    intro: "Không hỏi mục tiêu. Hỏi ước mơ — thứ não ADHD hay bị vùi lấp bởi lo lắng hàng ngày.",
    questions: [
      { q: "Nếu không sợ thất bại, không lo người khác nghĩ gì — bạn sẽ dành thời gian cho điều gì?", ph: "Thứ gì khiến bạn hứng khởi nhất khi tưởng tượng?..." },
      { q: "10 năm nữa, bạn muốn người thân nói gì về bạn?", ph: "Không phải về thành tích — về con người bạn là..." },
    ]
  }
];

function ReflectScreen({ profile, apiKey, onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro | round | thinking | result
  const [roundIdx, setRoundIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({ past: [], present: [], future: [] });
  const [input, setInput] = useState("");
  const [name, setName] = useState(profile?.name || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const taRef = useRef();

  const round = REFLECT_ROUNDS[roundIdx];
  const totalQ = REFLECT_ROUNDS.reduce((s, r) => s + r.questions.length, 0);
  const doneQ = REFLECT_ROUNDS.slice(0, roundIdx).reduce((s, r) => s + r.questions.length, 0) + qIdx;

  useEffect(() => { if (phase === "round") taRef.current?.focus(); }, [phase, roundIdx, qIdx]);

  const nextQuestion = () => {
    const key = round.id;
    const updated = { ...answers, [key]: [...(answers[key] || []), input] };
    setAnswers(updated);
    setInput("");

    if (qIdx < round.questions.length - 1) {
      setQIdx(i => i + 1);
    } else if (roundIdx < REFLECT_ROUNDS.length - 1) {
      setRoundIdx(i => i + 1);
      setQIdx(0);
    } else {
      synthesize(updated);
    }
  };

  const synthesize = async (allAnswers) => {
    setLoading(true); setPhase("thinking"); setError("");
    try {
      const sys = `Bạn là AI Coach chuyên về ADHD. Phân tích câu trả lời phản tư để tổng hợp Core Identity (Bản sắc cốt lõi) của người dùng.

Trả lời CHÍNH XÁC theo format JSON sau, không thêm gì khác:
{
  "coreIdentity": "1 câu duy nhất mô tả họ là ai ở cốt lõi",
  "superpower": "Điểm mạnh ẩn của họ (1 câu)",
  "pattern": "Pattern (khuôn mẫu) tích cực lặp đi lặp lại trong câu trả lời",
  "northStarHint": "Gợi ý về North Star dựa trên những gì họ chia sẻ",
  "affirmation": "1 câu xác nhận ấm áp, cụ thể — không sáo rỗng"
}`;

      const content = `Tên: ${name}

QUÁ KHỨ:
${allAnswers.past.map((a, i) => `${i + 1}. ${a}`).join("\n")}

HIỆN TẠI:
${allAnswers.present.map((a, i) => `${i + 1}. ${a}`).join("\n")}

TƯƠNG LAI:
${allAnswers.future.map((a, i) => `${i + 1}. ${a}`).join("\n")}`;

      const raw = await askClaude(sys, [{ role: "user", content }], apiKey, 500);
      const json = JSON.parse(raw.replace(/```json?|```/g, "").trim());
      setResult(json);
      setPhase("result");
    } catch (e) {
      setError("Lỗi: " + e.message);
      setPhase("round");
    }
    setLoading(false);
  };

  const finish = () => {
    const updated = {
      ...profile,
      name,
      reflectAnswers: answers,
      coreIdentity: result.coreIdentity,
      superpower: result.superpower,
      reflectDone: true,
    };
    LS.set("adhd_profile", updated);
    onComplete(updated, result.northStarHint);
  };

  if (phase === "intro") return (
    <Screen center>
      <div className="fu" style={{ maxWidth: "360px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🪞</div>
        <h1 style={{ ...serif, fontSize: "32px", color: C.text, marginBottom: "12px", fontWeight: 700 }}>
          Phản Tư
        </h1>
        <p style={{ color: C.textMid, fontSize: "15px", lineHeight: 1.8, marginBottom: "8px" }}>
          <em style={{ color: C.amber }}>Reflect</em> — Bước đầu tiên không phải đặt mục tiêu.
        </p>
        <p style={{ color: C.textMid, fontSize: "15px", lineHeight: 1.8, marginBottom: "28px" }}>
          Là hiểu bạn đang đứng ở đâu, bạn là ai — và điều gì thật sự quan trọng với bạn.
        </p>

        <Card style={{ marginBottom: "24px", textAlign: "left" }}>
          {REFLECT_ROUNDS.map((r, i) => (
            <div key={r.id} style={{
              display: "flex", gap: "12px", alignItems: "flex-start",
              padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ color: r.color, fontSize: "18px", marginTop: "2px" }}>{r.icon}</span>
              <div>
                <p style={{ color: C.text, fontSize: "14px", fontWeight: 600 }}>Vòng {i + 1}: {r.title}</p>
                <p style={{ color: C.textMid, fontSize: "12px", marginTop: "2px", lineHeight: 1.5 }}>{r.intro}</p>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ marginBottom: "20px" }}>
          <Tag style={{ display: "block", marginBottom: "8px", textAlign: "left" }}>Bạn tên gì?</Tag>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && setPhase("round")}
            placeholder="Tên hoặc biệt danh..."
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
              borderRadius: "12px", padding: "13px 16px", color: C.text, fontSize: "15px",
            }} />
        </div>

        <Btn full onClick={() => setPhase("round")} disabled={!name.trim()} size="lg">
          Bắt đầu phản tư →
        </Btn>
        <p style={{ color: C.textDim, fontSize: "12px", marginTop: "12px" }}>
          6 câu hỏi · ~10 phút · không có câu trả lời sai
        </p>
      </div>
    </Screen>
  );

  if (phase === "round") return (
    <Screen scrollable>
      <div style={{ maxWidth: "480px", width: "100%", padding: "0 4px" }}>
        {/* Progress */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <Tag color={round.color}>Vòng {roundIdx + 1}: {round.title}</Tag>
            <Tag>{doneQ}/{totalQ}</Tag>
          </div>
          <ProgressBar value={doneQ} max={totalQ} color={round.color} />
        </div>

        <div key={`${roundIdx}-${qIdx}`} className="fu">
          {/* Round intro */}
          {qIdx === 0 && (
            <div style={{
              background: `${round.color}10`, border: `1px solid ${round.color}30`,
              borderRadius: "14px", padding: "16px", marginBottom: "20px",
            }}>
              <span style={{ fontSize: "24px" }}>{round.icon}</span>
              <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.7, marginTop: "8px" }}>{round.intro}</p>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <Tag style={{ marginBottom: "12px", display: "block" }}>Câu {doneQ + 1}</Tag>
            <h2 style={{ ...serif, color: C.text, fontSize: "clamp(17px,4.5vw,21px)", lineHeight: 1.6, fontWeight: 500 }}>
              {round.questions[qIdx].q}
            </h2>
          </div>

          <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder={round.questions[qIdx].ph} rows={5}
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
              borderRadius: "14px", padding: "16px", color: C.text, fontSize: "15px",
              lineHeight: 1.8, marginBottom: "16px",
            }} />

          {error && <p style={{ color: C.red, fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px" }}>
            {(roundIdx > 0 || qIdx > 0) && (
              <Btn v="ghost" onClick={() => {
                if (qIdx > 0) setQIdx(i => i - 1);
                else { setRoundIdx(i => i - 1); setQIdx(REFLECT_ROUNDS[roundIdx - 1].questions.length - 1); }
                setInput("");
              }} style={{ flex: 1 }}>← Lại</Btn>
            )}
            <Btn onClick={nextQuestion} disabled={!input.trim() || loading} style={{ flex: 2 }}>
              {doneQ + 1 >= totalQ ? "Hoàn thành ✓" : "Tiếp →"}
            </Btn>
          </div>

          <p style={{ color: C.textDim, fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
            Viết thật lòng — không có câu trả lời đúng hay sai
          </p>
        </div>
      </div>
    </Screen>
  );

  if (phase === "thinking") return (
    <Screen center>
      <Loading text="AI đang phân tích câu trả lời của bạn..." />
    </Screen>
  );

  if (phase === "result" && result) return (
    <Screen scrollable>
      <div style={{ maxWidth: "480px", width: "100%", padding: "0 4px" }}>
        <div className="fu" style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>✦</div>
          <h2 style={{ ...serif, color: C.text, fontSize: "26px", marginBottom: "6px" }}>Bản sắc cốt lõi</h2>
          <p style={{ color: C.textMid, fontSize: "13px" }}>
            <em>Core Identity</em> — tổng hợp từ phản tư của {name}
          </p>
        </div>

        {/* Core Identity */}
        <Card className="fu d1" glow style={{ marginBottom: "12px", border: `1px solid ${C.amberLo}` }}>
          <Tag color={C.amber} style={{ marginBottom: "10px", display: "block" }}>✦ Core Identity — Bản sắc cốt lõi</Tag>
          <p style={{ ...serif, color: C.amberHi, fontSize: "20px", lineHeight: 1.65, fontStyle: "italic" }}>
            "{result.coreIdentity}"
          </p>
        </Card>

        <div className="fu d2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <Card>
            <Tag style={{ marginBottom: "8px", display: "block" }}>Superpower</Tag>
            <p style={{ color: C.text, fontSize: "13px", lineHeight: 1.6 }}>{result.superpower}</p>
          </Card>
          <Card>
            <Tag style={{ marginBottom: "8px", display: "block" }}>Pattern</Tag>
            <p style={{ color: C.text, fontSize: "13px", lineHeight: 1.6 }}>{result.pattern}</p>
          </Card>
        </div>

        <Card className="fu d3" style={{ marginBottom: "12px", background: C.greenLo, border: `1px solid ${C.green}33` }}>
          <Tag color={C.green} style={{ marginBottom: "8px", display: "block" }}>Xác nhận</Tag>
          <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.75, ...serif, fontStyle: "italic" }}>
            "{result.affirmation}"
          </p>
        </Card>

        <Card className="fu d4" style={{ marginBottom: "24px" }}>
          <Tag style={{ marginBottom: "8px", display: "block" }}>North Star — gợi ý</Tag>
          <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.7 }}>{result.northStarHint}</p>
        </Card>

        <div className="fu d5">
          <Btn full onClick={finish} size="lg">
            Tiếp theo: Xác định hướng đi →
          </Btn>
        </div>
      </div>
    </Screen>
  );

  return null;
}

/* ══════════════════════════════════════════════════════════
   SCREEN 2 — COMPASS (Hướng đi)
══════════════════════════════════════════════════════════ */
function CompassScreen({ profile, apiKey, onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [northStar, setNorthStar] = useState(profile?.northStar || "");
  const [goal90, setGoal90] = useState(profile?.goal90 || "");
  const [weekFocus, setWeekFocus] = useState(profile?.weekFocus || "");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [doubt, setDoubt] = useState(false);
  const [doubtInput, setDoubtInput] = useState("");
  const [doubtReply, setDoubtReply] = useState("");

  const getAiSuggestion = async () => {
    setLoading(true);
    try {
      const sys = buildSystemPrompt(profile);
      const msg = `Dựa vào Core Identity "${profile.coreIdentity}" và gợi ý "${profile?.northStarHint || ""}", hãy đề xuất:
1. North Star (1 câu, cụ thể, có thể đo được sau 10 năm)
2. Mục tiêu 90 ngày (1 câu, cụ thể, có thể đạt được)
3. Focus tuần này (1 việc duy nhất)

Format: JSON với keys: northStar, goal90, weekFocus`;
      const raw = await askClaude(sys, [{ role: "user", content: msg }], apiKey, 400);
      const json = JSON.parse(raw.replace(/```json?|```/g, "").trim());
      setNorthStar(json.northStar || "");
      setGoal90(json.goal90 || "");
      setWeekFocus(json.weekFocus || "");
      setAiSuggestion("Đây là gợi ý dựa trên phản tư của bạn. Chỉnh sửa cho đúng với bạn nhất.");
    } catch (e) {
      setAiSuggestion("Không lấy được gợi ý — bạn có thể tự điền.");
    }
    setLoading(false);
    setPhase("edit");
  };

  const askAboutDoubt = async () => {
    setLoading(true);
    try {
      const sys = buildSystemPrompt({ ...profile, northStar, goal90 });
      const reply = await askClaude(sys, [{ role: "user", content: `Tôi không chắc về hướng này vì: ${doubtInput}\nHãy giúp tôi làm rõ.` }], apiKey, 300);
      setDoubtReply(reply);
    } catch (e) { setDoubtReply("Không kết nối được AI."); }
    setLoading(false);
    setDoubt(false);
  };

  const save = () => {
    const updated = { ...profile, northStar, goal90, weekFocus, compassDone: true };
    LS.set("adhd_profile", updated);
    LS.set("north_star", northStar);
    LS.set("goal_90", goal90);
    LS.set("week_focus", weekFocus);
    onComplete(updated);
  };

  if (phase === "intro") return (
    <Screen center>
      <div className="fu" style={{ maxWidth: "360px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🧭</div>
        <h1 style={{ ...serif, fontSize: "32px", color: C.text, marginBottom: "12px" }}>Compass</h1>
        <p style={{ color: C.textMid, fontSize: "15px", lineHeight: 1.8, marginBottom: "24px" }}>
          <em style={{ color: C.amber }}>Compass — La bàn</em><br />
          Từ Core Identity, AI giúp bạn xác định 3 tầng mục tiêu rõ ràng.
        </p>
        <Card style={{ textAlign: "left", marginBottom: "24px" }}>
          {[
            ["🌟", "North Star", "Tầm nhìn 10 năm — định hướng mọi quyết định"],
            ["⚡", "Sprint 90 ngày", "Mục tiêu cụ thể trong 90 ngày tới"],
            ["🎯", "Focus tuần này", "1 việc duy nhất quan trọng nhất tuần này"],
          ].map(([icon, title, desc], i) => (
            <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: "18px" }}>{icon}</span>
              <div>
                <p style={{ color: C.text, fontSize: "14px", fontWeight: 600 }}>{title}</p>
                <p style={{ color: C.textMid, fontSize: "12px", marginTop: "2px" }}>{desc}</p>
              </div>
            </div>
          ))}
        </Card>
        {loading ? <Loading text="AI đang xây Compass..." /> : (
          <Btn full onClick={getAiSuggestion} size="lg">AI gợi ý dựa trên phản tư →</Btn>
        )}
      </div>
    </Screen>
  );

  if (phase === "edit") return (
    <Screen scrollable>
      <div style={{ maxWidth: "480px", width: "100%" }}>
        <div className="fu" style={{ marginBottom: "24px" }}>
          <h2 style={{ ...serif, color: C.text, fontSize: "24px", marginBottom: "6px" }}>La bàn của {profile.name}</h2>
          {aiSuggestion && <p style={{ color: C.amberHi, fontSize: "13px", lineHeight: 1.6 }}>{aiSuggestion}</p>}
        </div>

        {[
          { key: "northStar", val: northStar, set: setNorthStar, label: "🌟 North Star (10 năm)", tag: "Tầm nhìn dài hạn", color: C.amber, ph: "Tôi muốn trở thành..." },
          { key: "goal90", val: goal90, set: setGoal90, label: "⚡ Sprint 90 ngày", tag: "Sprint = giai đoạn tập trung có mục tiêu rõ", color: C.blue, ph: "Trong 90 ngày tới tôi sẽ..." },
          { key: "weekFocus", val: weekFocus, set: setWeekFocus, label: "🎯 Focus tuần này", tag: "1 việc duy nhất", color: C.green, ph: "Tuần này tôi tập trung vào..." },
        ].map((item, i) => (
          <Card key={item.key} className={`fu d${i + 1}`} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <Tag color={item.color}>{item.label}</Tag>
            </div>
            <p style={{ color: C.textDim, fontSize: "11px", marginBottom: "8px" }}>{item.tag}</p>
            <textarea value={item.val} onChange={e => item.set(e.target.value)}
              placeholder={item.ph} rows={2}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "10px", padding: "12px 14px", color: C.text, fontSize: "14px", lineHeight: 1.7,
              }} />
          </Card>
        ))}

        {doubtReply && (
          <Card className="fu" style={{ marginBottom: "12px", background: C.blueLo, border: `1px solid ${C.blue}33` }}>
            <Tag color={C.blue} style={{ marginBottom: "8px", display: "block" }}>Coach giải đáp</Tag>
            <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.75 }}>{doubtReply}</p>
          </Card>
        )}

        <div className="fu d4" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Btn v="ghost" full onClick={() => setDoubt(true)}>
            🤔 Tôi không chắc hướng này đúng không
          </Btn>
          <Btn full onClick={save} disabled={!northStar.trim() || !goal90.trim()} size="lg">
            Lưu Compass →
          </Btn>
        </div>

        {doubt && (
          <div className="si" style={{ position: "fixed", inset: 0, background: "#0A090688", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <Card style={{ width: "100%", maxWidth: "480px" }}>
              <Tag style={{ marginBottom: "12px", display: "block" }}>Chia sẻ với Coach</Tag>
              <textarea value={doubtInput} onChange={e => setDoubtInput(e.target.value)}
                placeholder="Tôi không chắc vì..." rows={3}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.text, fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }} />
              <div style={{ display: "flex", gap: "10px" }}>
                <Btn v="ghost" onClick={() => setDoubt(false)} style={{ flex: 1 }}>Hủy</Btn>
                <Btn onClick={askAboutDoubt} disabled={!doubtInput.trim() || loading} style={{ flex: 2 }}>
                  {loading ? "Đang hỏi..." : "Hỏi Coach →"}
                </Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Screen>
  );

  return null;
}

/* ══════════════════════════════════════════════════════════
   SCREEN 3 — TODAY (Brain dump → AI lọc → 3 bước)
══════════════════════════════════════════════════════════ */
const EL = [
  { v: 1, e: "😴", label: "Cạn kiệt",   tip: "1 bước 5 phút là đủ hôm nay.",          color: C.red    },
  { v: 2, e: "😕", label: "Thấp",        tip: "Chọn việc nhỏ nhất có thể bắt đầu.",    color: "#AA6A3A" },
  { v: 3, e: "😐", label: "Bình thường", tip: "Tập trung vào 1 việc quan trọng nhất.", color: C.textMid},
  { v: 4, e: "🙂", label: "Tốt",         tip: "Tận dụng — làm việc khó ngay bây giờ.", color: C.blue   },
  { v: 5, e: "🔥", label: "Cao điểm",    tip: "Thời điểm vàng. Đừng lãng phí.",        color: C.amber  },
];

function TodayScreen({ profile, apiKey, onWin }) {
  const todayKey = new Date().toLocaleDateString("vi-VN");
  const [phase, setPhase] = useState(() => {
    if (LS.get("today_done_" + todayKey)) return "done";
    if (LS.get("today_steps_" + todayKey)) return "steps";
    if (LS.get("today_task_" + todayKey)) return "task";
    return "energy";
  });
  const [energy, setEnergy]   = useState(() => LS.get("today_energy_" + todayKey, 0));
  const [dump,   setDump]     = useState(() => LS.get("today_dump_"   + todayKey, ""));
  const [task,   setTask]     = useState(() => LS.get("today_task_"   + todayKey, ""));
  const [steps,  setSteps]    = useState(() => LS.get("today_steps_"  + todayKey, []));
  const [curStep,setCurStep]  = useState(() => LS.get("today_step_cur_" + todayKey, 0));
  const [loading, setLoading] = useState(false);
  const [aiExplain, setAiExplain] = useState("");
  const taRef = useRef();

  useEffect(() => {
    if (phase === "dump") taRef.current?.focus();
  }, [phase]);

  const selectEnergy = (v) => {
    setEnergy(v); LS.set("today_energy_" + todayKey, v);
    setPhase("dump");
  };

  const processdumps = async () => {
    if (!dump.trim()) return;
    setLoading(true);
    LS.set("today_dump_" + todayKey, dump);
    try {
      const sys = buildSystemPrompt(profile);
      const energyLabel = EL.find(e => e.v === energy)?.label || "bình thường";
      const msg = `Năng lượng hôm nay: ${energyLabel}
North Star: ${profile.northStar || ""}
Mục tiêu 90 ngày: ${profile.goal90 || ""}

Brain dump (mọi thứ đang trong đầu):
${dump}

Hãy:
1. Xác định 1 việc QUAN TRỌNG NHẤT cần làm hôm nay (phù hợp với năng lượng ${energyLabel})
2. Giải thích ngắn TẠI SAO đây là việc quan trọng nhất (1 câu)

Format JSON: { "task": "việc cần làm", "why": "tại sao quan trọng nhất" }`;

      const raw = await askClaude(sys, [{ role: "user", content: msg }], apiKey, 300);
      const json = JSON.parse(raw.replace(/```json?|```/g, "").trim());
      setTask(json.task); setAiExplain(json.why);
      LS.set("today_task_" + todayKey, json.task);
      setPhase("confirm");
    } catch (e) { setAiExplain("Lỗi: " + e.message); }
    setLoading(false);
  };

  const confirmTask = async (useTask) => {
    setLoading(true);
    try {
      const sys = buildSystemPrompt(profile);
      const energyLabel = EL.find(e => e.v === energy)?.label || "bình thường";
      const msg = `Việc cần làm hôm nay: "${useTask}"
Năng lượng: ${energyLabel}

Chia thành đúng 3 bước cực kỳ nhỏ và cụ thể, mỗi bước:
- Bắt đầu bằng động từ hành động
- Có thể hoàn thành trong < 15 phút
- Không cần điều kiện gì khác để bắt đầu

Format JSON: { "steps": ["bước 1", "bước 2", "bước 3"] }`;

      const raw = await askClaude(sys, [{ role: "user", content: msg }], apiKey, 300);
      const json = JSON.parse(raw.replace(/```json?|```/g, "").trim());
      setSteps(json.steps); setCurStep(0);
      LS.set("today_steps_" + todayKey, json.steps);
      LS.set("today_step_cur_" + todayKey, 0);
      setPhase("steps");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const doneStep = () => {
    const next = curStep + 1;
    if (next >= steps.length) {
      LS.set("today_done_" + todayKey, true);
      onWin({ date: todayKey, task, energy, steps });
      setPhase("done");
    } else {
      setCurStep(next);
      LS.set("today_step_cur_" + todayKey, next);
    }
  };

  const el = EL.find(e => e.v === energy);

  return (
    <Screen scrollable>
      {/* Header mini */}
      <div className="fu" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Tag color={C.amber} style={{ display: "block", marginBottom: "4px" }}>⚡ Hôm nay</Tag>
            <p style={{ color: C.textDim, fontSize: "12px", ...mono }}>{todayKey}</p>
          </div>
          {el && (
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "22px" }}>{el.e}</span>
              <p style={{ color: el.color, fontSize: "11px", marginTop: "2px" }}>{el.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* North Star mini */}
      {profile.northStar && (
        <div className="fu d1" style={{
          background: "#0C0A04", border: `1px solid ${C.amberLo}44`,
          borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
        }}>
          <Tag color={C.amberLo} style={{ marginBottom: "5px", display: "block" }}>✦ North Star</Tag>
          <p style={{ color: C.amber, fontSize: "13px", lineHeight: 1.65, ...serif, fontStyle: "italic",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            "{profile.northStar}"
          </p>
        </div>
      )}

      {/* PHASE: ENERGY */}
      {phase === "energy" && (
        <div className="fu d2">
          <Card>
            <Tag style={{ marginBottom: "14px", display: "block" }}>Bước 1 — Năng lượng hôm nay?</Tag>
            <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
              Não ADHD hoạt động khác nhau tùy theo mức năng lượng. Chọn thật lòng.
            </p>
            {EL.map(o => (
              <button key={o.v} onClick={() => selectEnergy(o.v)} style={{
                width: "100%", background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: "12px", padding: "13px 16px", marginBottom: "8px",
                display: "flex", alignItems: "center", gap: "14px", textAlign: "left",
              }}>
                <span style={{ fontSize: "22px", flexShrink: 0 }}>{o.e}</span>
                <div>
                  <p style={{ color: C.text, fontSize: "14px", fontWeight: 600 }}>{o.label}</p>
                  <p style={{ color: C.textMid, fontSize: "12px", marginTop: "1px" }}>{o.tip}</p>
                </div>
              </button>
            ))}
          </Card>
        </div>
      )}

      {/* PHASE: BRAIN DUMP */}
      {phase === "dump" && (
        <div key="dump" className="fu">
          <Card style={{ marginBottom: "14px", background: `${el?.color}08`, border: `1px solid ${el?.color}22` }}>
            <p style={{ color: el?.color, fontSize: "13px" }}>
              {el?.e} {el?.label} — {el?.tip}
            </p>
          </Card>
          <Card>
            <Tag style={{ marginBottom: "10px", display: "block" }}>Bước 2 — Brain Dump</Tag>
            <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.7, marginBottom: "14px" }}>
              <em style={{ color: C.textMid }}>Brain dump</em> = đổ hết mọi thứ đang trong đầu ra đây.
              Không lọc, không sắp xếp. Cả việc lớn lẫn nhỏ, cả lo lắng lẫn kế hoạch.
            </p>
            <textarea ref={taRef} value={dump} onChange={e => setDump(e.target.value)}
              placeholder={"Đổ hết ra đây...\n- Cần gọi lại cho khách hàng\n- Lo về bài viết chưa xong\n- Nhớ mua sữa\n- Cần đọc lại proposal\n- ..."}
              rows={7}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
                borderRadius: "12px", padding: "14px 16px", color: C.text, fontSize: "14px",
                lineHeight: 1.8, marginBottom: "14px",
              }} />
            {loading ? <Loading text="AI đang phân tích brain dump..." /> : (
              <Btn full onClick={processdumps} disabled={!dump.trim()} size="lg">
                AI lọc việc quan trọng nhất →
              </Btn>
            )}
          </Card>
        </div>
      )}

      {/* PHASE: CONFIRM TASK */}
      {phase === "confirm" && (
        <div key="confirm" className="fu">
          <Card style={{ marginBottom: "14px", border: `1px solid ${C.amberLo}` }}>
            <Tag color={C.amber} style={{ marginBottom: "10px", display: "block" }}>
              AI chọn việc quan trọng nhất
            </Tag>
            <p style={{ ...serif, color: C.text, fontSize: "18px", lineHeight: 1.65, marginBottom: "12px", fontWeight: 500 }}>
              {task}
            </p>
            {aiExplain && (
              <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.6,
                borderTop: `1px solid ${C.border}`, paddingTop: "12px", marginTop: "4px" }}>
                Tại sao: {aiExplain}
              </p>
            )}
          </Card>
          {loading ? <Loading text="Đang chia nhỏ công việc..." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Btn full onClick={() => confirmTask(task)} size="lg">
                Đúng — chia thành 3 bước nhỏ →
              </Btn>
              <Btn v="ghost" full onClick={() => setPhase("dump")}>
                ← Điều chỉnh lại
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* PHASE: STEPS */}
      {phase === "steps" && (
        <div key="steps" className="fu">
          <Card style={{ marginBottom: "14px" }}>
            <Tag style={{ marginBottom: "8px", display: "block" }}>Việc hôm nay</Tag>
            <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6 }}>{task}</p>
          </Card>

          <Tag style={{ marginBottom: "12px", display: "block" }}>3 bước nhỏ — mỗi bước &lt; 15 phút</Tag>

          {steps.map((s, i) => {
            const isDone = i < curStep;
            const isCurrent = i === curStep;
            return (
              <div key={i} className={`fu d${i + 1}`} style={{
                background: isDone ? C.greenLo : isCurrent ? C.cardHi : C.surface,
                border: `1.5px solid ${isDone ? C.green + "44" : isCurrent ? C.amberLo : C.border}`,
                borderRadius: "14px", padding: "16px", marginBottom: "10px",
                opacity: isDone ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                    background: isDone ? C.green : isCurrent ? C.amber : C.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isDone ? "14px" : "12px", fontWeight: 700, color: "#0A0906",
                    ...mono,
                    animation: isDone ? "checkPop .4s ease" : "none",
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      color: isDone ? C.green : isCurrent ? C.text : C.textMid,
                      fontSize: "15px", lineHeight: 1.65,
                      textDecoration: isDone ? "line-through" : "none",
                    }}>{s}</p>
                    {isCurrent && (
                      <p style={{ color: C.textDim, fontSize: "12px", marginTop: "6px" }}>
                        ← Đang làm · ≤ 15 phút
                      </p>
                    )}
                  </div>
                </div>
                {isCurrent && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${C.border}` }}>
                    <Btn full onClick={doneStep} v="green">
                      {i < steps.length - 1 ? `Xong bước ${i + 1} → bước tiếp` : "Hoàn thành tất cả ✓"}
                    </Btn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PHASE: DONE */}
      {phase === "done" && (
        <div key="done" className="fu" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "52px", marginBottom: "20px", animation: "checkPop .5s ease" }}>🏆</div>
          <Card glow style={{ marginBottom: "16px" }}>
            <p style={{ color: C.greenHi, fontSize: "16px", lineHeight: 1.65, ...serif, fontStyle: "italic" }}>
              "{task}"
            </p>
            <Divider />
            <p style={{ color: C.green, fontSize: "14px", lineHeight: 1.7 }}>
              Bạn đã hoàn thành. Đây là bằng chứng —<br />
              não ADHD của bạn <em>có thể</em> làm được.
            </p>
          </Card>
          <Btn v="ghost" full onClick={() => setPhase("energy")}>
            Làm thêm việc khác
          </Btn>
        </div>
      )}
    </Screen>
  );
}

/* ══════════════════════════════════════════════════════════
   SCREEN 4 — COACH (3 tình huống cụ thể)
══════════════════════════════════════════════════════════ */
const COACH_MODES = [
  {
    id: "distracted",
    icon: "🌀",
    title: "Tôi bị phân tâm",
    sub: "Đang làm rồi mất tập trung — cần reset",
    color: C.amber,
    bg: "#1A1408",
    border: C.amberLo,
  },
  {
    id: "overwhelmed",
    icon: "🌊",
    title: "Tôi bị overwhelmed",
    sub: "Quá nhiều thứ cùng lúc — tê liệt",
    color: C.blue,
    bg: C.blueLo,
    border: C.blue + "33",
  },
  {
    id: "lost",
    icon: "🔍",
    title: "Không biết đi đúng hướng không",
    sub: "Làm mà không chắc có ý nghĩa không",
    color: C.green,
    bg: C.greenLo,
    border: C.green + "33",
  },
];

const COACH_PROMPTS = {
  distracted: (context) => `Người dùng đang bị phân tâm giữa chừng. Việc đang làm: "${context}".
Hãy:
1. Xác nhận cảm giác — không phán xét
2. Hỏi 1 câu duy nhất để giúp họ nhớ lại việc đang làm
3. Đề xuất 1 kỹ thuật reset trong 2 phút`,

  overwhelmed: (context) => `Người dùng đang overwhelmed (quá tải — tê liệt không hành động được). Họ mô tả: "${context}".
Hãy:
1. Xác nhận — không thuyết giảng
2. Chia nhỏ thành 1 bước 5 phút ngay lập tức
3. Nói rõ: chỉ làm bước đó thôi, không cần nghĩ xa hơn`,

  lost: (context) => `Người dùng không chắc đang đi đúng hướng. Họ đang làm: "${context}".
North Star của họ: "${LS.get("north_star", "chưa xác định")}".
Hãy:
1. So sánh việc đang làm với North Star
2. Xác nhận nếu đúng hướng, hoặc gợi ý điều chỉnh nhỏ nếu lệch
3. Kết thúc bằng 1 câu xác nhận cụ thể`,
};

function CoachScreen({ profile, apiKey }) {
  const [mode, setMode] = useState(null);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const taRef = useRef();

  useEffect(() => { if (mode && !reply) taRef.current?.focus(); }, [mode]);

  const ask = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const promptFn = COACH_PROMPTS[mode];
      const sys = buildSystemPrompt(profile) + "\n\n" + promptFn(input);
      const r = await askClaude(sys, [{ role: "user", content: input }], apiKey, 350);
      setReply(r);
    } catch (e) { setReply("Lỗi kết nối AI: " + e.message); }
    setLoading(false);
  };

  const reset = () => { setMode(null); setInput(""); setReply(""); };

  const modeInfo = COACH_MODES.find(m => m.id === mode);

  return (
    <Screen scrollable>
      <div className="fu" style={{ marginBottom: "24px" }}>
        <h2 style={{ ...serif, color: C.text, fontSize: "24px", marginBottom: "6px" }}>AI Coach</h2>
        <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6 }}>
          Không phải chatbot. Đây là hệ thống dẫn quyết định<br />
          cho 3 tình huống bị kẹt phổ biến nhất.
        </p>
      </div>

      {!mode && (
        <>
          {COACH_MODES.map((m, i) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`fu d${i + 1}`}
              style={{
                width: "100%", background: m.bg, border: `1.5px solid ${m.border}`,
                borderRadius: "16px", padding: "20px", marginBottom: "10px",
                display: "flex", alignItems: "center", gap: "16px", textAlign: "left",
              }}>
              <span style={{ fontSize: "28px", flexShrink: 0 }}>{m.icon}</span>
              <div>
                <p style={{ color: C.text, fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>{m.title}</p>
                <p style={{ color: C.textMid, fontSize: "13px", lineHeight: 1.5 }}>{m.sub}</p>
              </div>
              <span style={{ color: C.textDim, marginLeft: "auto", fontSize: "20px" }}>›</span>
            </button>
          ))}

          <Divider />
          <div className="fu d4">
            {["Bạn không cần giải quyết mọi thứ hôm nay.", "Chỉ cần biết 1 bước tiếp theo.", "Làm ít nhưng đúng."].map((t, i) => (
              <p key={i} style={{ color: C.textDim, fontSize: "13px", textAlign: "center", lineHeight: 1.7 }}>— {t}</p>
            ))}
          </div>
        </>
      )}

      {mode && (
        <div key={mode} className="fu">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <button onClick={reset} style={{ background: "transparent", color: C.textMid, fontSize: "20px", padding: "4px 8px" }}>←</button>
            <h3 style={{ ...serif, color: C.text, fontSize: "20px" }}>{modeInfo?.title}</h3>
          </div>

          {!reply && !loading && (
            <Card style={{ marginBottom: "14px" }}>
              <Tag style={{ marginBottom: "12px", display: "block" }}>
                {mode === "distracted" ? "Bạn đang làm việc gì khi bị phân tâm?" :
                 mode === "overwhelmed" ? "Mô tả những thứ đang chồng chất trong đầu bạn:" :
                 "Bạn đang làm gì và điều gì khiến bạn nghi ngờ?"}
              </Tag>
              <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && input.trim()) { e.preventDefault(); ask(); } }}
                placeholder="Viết thật lòng — càng cụ thể càng tốt..."
                rows={4}
                style={{
                  width: "100%", background: C.surface, border: `1px solid ${C.borderHi}`,
                  borderRadius: "12px", padding: "14px 16px", color: C.text, fontSize: "15px",
                  lineHeight: 1.7, marginBottom: "14px",
                }} />
              <div style={{ display: "flex", gap: "10px" }}>
                <Btn v="ghost" onClick={reset} style={{ flex: 1 }}>Hủy</Btn>
                <Btn onClick={ask} disabled={!input.trim()} style={{ flex: 2 }}>
                  Hỏi Coach →
                </Btn>
              </div>
            </Card>
          )}

          {loading && <Loading text="Coach đang phân tích..." />}

          {reply && (
            <div key="reply" className="fu">
              <Card style={{ marginBottom: "14px", border: `1px solid ${modeInfo?.border}`, background: modeInfo?.bg }}>
                <Tag color={modeInfo?.color} style={{ marginBottom: "12px", display: "block" }}>
                  Coach trả lời
                </Tag>
                <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{reply}</p>
              </Card>
              <div style={{ display: "flex", gap: "10px" }}>
                <Btn v="ghost" onClick={reset} style={{ flex: 1 }}>Quay lại</Btn>
                <Btn onClick={() => { setInput(""); setReply(""); }} style={{ flex: 1 }}>
                  Hỏi lại
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}

/* ══════════════════════════════════════════════════════════
   SCREEN 5 — EVIDENCE (Nhật ký bằng chứng)
══════════════════════════════════════════════════════════ */
function EvidenceScreen({ wins, profile }) {
  const today   = new Date().toLocaleDateString("vi-VN");
  const todayW  = wins.filter(w => w.date === today);
  const pastW   = wins.filter(w => w.date !== today);
  const totalDays = new Set(wins.map(w => w.date)).size;

  return (
    <Screen scrollable>
      <div className="fu" style={{ marginBottom: "20px" }}>
        <h2 style={{ ...serif, color: C.text, fontSize: "24px", marginBottom: "6px" }}>Bằng chứng tiến bộ</h2>
        <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6 }}>
          Não ADHD hay quên đi những gì đã làm được.<br />
          Đây là bằng chứng để nhắc lại.
        </p>
      </div>

      {/* Stats */}
      <div className="fu d1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
        {[
          { n: wins.length, label: "Tổng wins", color: C.amber },
          { n: totalDays,   label: "Ngày có win", color: C.green },
          { n: wins.filter(w => {
            const d = new Date(); d.setDate(d.getDate() - 7);
            return new Date(w.date.split("/").reverse().join("-")) >= d;
          }).length, label: "7 ngày qua", color: C.blue },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{ ...mono, fontSize: "28px", color: s.color, fontWeight: 500, lineHeight: 1 }}>{s.n}</div>
            <Tag style={{ marginTop: "6px", fontSize: "9px" }}>{s.label}</Tag>
          </Card>
        ))}
      </div>

      {/* Core Identity reminder */}
      {profile.coreIdentity && (
        <Card className="fu d2" glow style={{ marginBottom: "16px", border: `1px solid ${C.amberLo}` }}>
          <Tag color={C.amberLo} style={{ marginBottom: "8px", display: "block" }}>✦ Core Identity của bạn</Tag>
          <p style={{ color: C.amberHi, fontSize: "15px", lineHeight: 1.7, ...serif, fontStyle: "italic" }}>
            "{profile.coreIdentity}"
          </p>
        </Card>
      )}

      {/* Wins */}
      {todayW.length > 0 && (
        <div className="fu d3">
          <Tag style={{ marginBottom: "10px", display: "block" }}>Hôm nay</Tag>
          {todayW.map((w, i) => <WinCard key={i} w={w} hi />)}
          <Divider />
        </div>
      )}

      {pastW.length > 0 && (
        <div className="fu d4">
          <Tag style={{ marginBottom: "10px", display: "block" }}>Lịch sử</Tag>
          {pastW.slice(0, 20).map((w, i) => <WinCard key={i} w={w} />)}
        </div>
      )}

      {wins.length === 0 && (
        <Card className="fu d3" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: C.textMid, fontSize: "15px", lineHeight: 1.7, marginBottom: "8px" }}>Chưa có win nào.</p>
          <p style={{ color: C.textDim, fontSize: "13px" }}>
            Hoàn thành việc trong tab Hôm nay → win tự động được ghi lại.
          </p>
        </Card>
      )}
    </Screen>
  );
}

function WinCard({ w, hi = false }) {
  const e = EL.find(x => x.v === w.energy);
  return (
    <div style={{
      background: hi ? C.greenLo : C.surface,
      border: `1px solid ${hi ? C.green + "33" : C.border}`,
      borderRadius: "14px", padding: "14px 16px", marginBottom: "8px",
    }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "16px" }}>{e?.e || "✅"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.6 }}>{w.task}</p>
          {w.steps && (
            <div style={{ marginTop: "8px" }}>
              {w.steps.map((s, i) => (
                <p key={i} style={{ color: C.textDim, fontSize: "12px", lineHeight: 1.5 }}>✓ {s}</p>
              ))}
            </div>
          )}
          <p style={{ color: C.textDim, fontSize: "11px", marginTop: "6px", ...mono }}>{w.date}</p>
        </div>
        <span style={{ color: C.green, fontSize: "14px" }}>✓</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SCREEN WRAPPERS
══════════════════════════════════════════════════════════ */
function Screen({ children, center = false, scrollable = false }) {
  return (
    <div style={{
      height: "calc(100dvh - 58px)", overflowY: scrollable ? "auto" : "hidden",
      display: "flex", flexDirection: center ? undefined : "column",
      alignItems: center ? "center" : undefined,
      justifyContent: center ? "center" : undefined,
      padding: "20px 16px", maxWidth: "480px", margin: "0 auto",
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "reflect",  icon: "🪞", label: "Phản Tư"   },
  { id: "compass",  icon: "🧭", label: "Hướng Đi"  },
  { id: "today",    icon: "⚡",  label: "Hôm Nay"   },
  { id: "coach",    icon: "🧠", label: "Coach"     },
  { id: "evidence", icon: "✦",  label: "Tiến Bộ"  },
];

function Nav({ active, set, profile }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: "480px",
      background: C.surface + "F8", backdropFilter: "blur(16px)",
      borderTop: `1px solid ${C.border}`,
      display: "flex", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 20,
    }}>
      {TABS.map(t => {
        const isActive = active === t.id;
        const isDone = (t.id === "reflect" && profile?.reflectDone) || (t.id === "compass" && profile?.compassDone);
        return (
          <button key={t.id} onClick={() => set(t.id)} style={{
            flex: 1, padding: "10px 2px 12px", background: "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
          }}>
            <span style={{ fontSize: "18px", opacity: isActive ? 1 : 0.3, transition: "all .2s", position: "relative" }}>
              {t.icon}
              {isDone && <span style={{ position: "absolute", top: "-2px", right: "-4px", fontSize: "8px" }}>✓</span>}
            </span>
            <span style={{
              color: isActive ? C.amber : C.textDim, fontSize: "9px", ...mono,
              letterSpacing: "0.5px", transition: "all .2s",
            }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [apiKey,  setApiKey]  = useState(() => LS.get("adhd_api_key", null));
  const [profile, setProfile] = useState(() => LS.get("adhd_profile", null));
  const [tab,     setTab]     = useState("reflect");
  const [wins,    setWins]    = useState(() => LS.get("adhd_wins", []));

  // Auto-navigate after onboarding steps
  const handleReflectDone = (updatedProfile, northStarHint) => {
    const p = { ...updatedProfile, northStarHint };
    setProfile(p); LS.set("adhd_profile", p);
    setTab("compass");
  };

  const handleCompassDone = (updatedProfile) => {
    setProfile(updatedProfile); LS.set("adhd_profile", updatedProfile);
    setTab("today");
  };

  const addWin = (win) => {
    const updated = [win, ...wins];
    setWins(updated); LS.set("adhd_wins", updated);
    // SUPABASE: await supabase.from('wins').insert({ ...win, user_id: uid })
  };

  if (!apiKey) return <><GS /><ApiKeyScreen onSave={setApiKey} /></>;

  return (
    <>
      <GS />

      {/* Header */}
      <header style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "480px", zIndex: 10,
        background: C.bg + "F0", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${C.amber}, ${C.amberLo})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
          }}>🧠</div>
          <span style={{ ...serif, color: C.text, fontSize: "16px", fontWeight: 600 }}>ADHD OS</span>
        </div>
        {profile?.name && (
          <span style={{ color: C.textDim, fontSize: "11px", ...mono }}>{profile.name}</span>
        )}
      </header>

      {/* Main content */}
      <div style={{ paddingTop: "56px" }}>
        {tab === "reflect"  && <ReflectScreen  profile={profile || {}} apiKey={apiKey} onComplete={handleReflectDone} />}
        {tab === "compass"  && <CompassScreen  profile={profile || {}} apiKey={apiKey} onComplete={handleCompassDone} />}
        {tab === "today"    && <TodayScreen    profile={profile || {}} apiKey={apiKey} onWin={addWin} />}
        {tab === "coach"    && <CoachScreen    profile={profile || {}} apiKey={apiKey} />}
        {tab === "evidence" && <EvidenceScreen wins={wins} profile={profile || {}} />}
      </div>

      <Nav active={tab} set={setTab} profile={profile} />
    </>
  );
}
