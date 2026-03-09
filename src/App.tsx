import { useState, useRef, useEffect, useCallback } from 'react';

/* ─── FONTS & GLOBAL ─────────────────────────────── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0C0A08;overflow:hidden}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:#2A2520;border-radius:2px}
    textarea,input{outline:none;font-family:'DM Sans',sans-serif}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:.4;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px #F59E0B22}50%{box-shadow:0 0 40px #F59E0B44}}
    .fadeUp{animation:fadeUp .5s ease forwards}
    .btn-primary{background:linear-gradient(135deg,#F59E0B,#D97706);border:none;border-radius:12px;color:#0C0A08;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px #F59E0B44}
    .btn-ghost{background:transparent;border:1.5px solid #2A2520;border-radius:10px;color:#9CA3AF;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
    .btn-ghost:hover{border-color:#F59E0B55;color:#F59E0B}
    .card{background:#1A1714;border:1px solid #2A2520;border-radius:16px}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────── */
const ADHD_TYPES = [
  {
    id: 'inattentive',
    emoji: '🌊',
    label: 'Mất tập trung',
    desc: 'Hay quên · Khó tập trung · Dễ phân tán',
  },
  {
    id: 'hyperactive',
    emoji: '⚡',
    label: 'Tăng động',
    desc: 'Năng lượng cao · Khó ngồi yên · Bốc đồng',
  },
  {
    id: 'combined',
    emoji: '🌪️',
    label: 'Hỗn hợp',
    desc: 'Cả hai — phổ biến nhất ở người lớn',
  },
];
const STRUGGLES = [
  'Khởi động việc',
  'Duy trì tập trung',
  'Quản lý thời gian',
  'Hay quên',
  'Cảm xúc thất thường',
  'Procrastination',
  'Hay bị Overwhelmed',
  'Burn out',
  'Thiếu tự tin',
  'Khó duy trì thói quen',
];
const GOAL_LEVELS = [
  { key: 'yr10', label: '10 NĂM', icon: '🌟', desc: 'Ngôi sao Bắc Đẩu' },
  { key: 'yr5', label: '5 NĂM', icon: '🎯', desc: 'Cột mốc lớn' },
  { key: 'yr2', label: '2 NĂM', icon: '🚀', desc: 'Bước ngoặt' },
  { key: 'yr1', label: '1 NĂM', icon: '📅', desc: 'Mục tiêu năm' },
  { key: 'mo6', label: '6 THÁNG', icon: '🗓️', desc: 'Sprint lớn' },
  { key: 'mo3', label: '3 THÁNG', icon: '📌', desc: 'Sprint nhỏ' },
  { key: 'mo1', label: '1 THÁNG', icon: '⭐', desc: 'Tháng này' },
  { key: 'week', label: 'TUẦN NÀY', icon: '🔥', desc: 'Focus tuần' },
  { key: 'today', label: 'HÔM NAY', icon: '⚡', desc: '1 việc duy nhất' },
];
const COACH_MODES = [
  {
    id: 'focus',
    icon: '🎯',
    label: 'Focus',
    prompt: 'Hôm nay mình cần làm gì? Chỉ 1 việc thôi.',
  },
  {
    id: 'recharge',
    icon: '🔋',
    label: 'Tắt máy',
    prompt: 'Mình đang tắt máy và không muốn làm gì. Giúp mình.',
  },
  { id: 'content', icon: '✍️', label: 'Nội dung', prompt: 'bản thô: ' },
  {
    id: 'checkin',
    icon: '📊',
    label: 'Check-in',
    prompt: 'Check-in: Mình vừa hoàn thành [điền vào]. Cảm giác [điền vào].',
  },
];

/* ─── SYSTEM PROMPT ──────────────────────────────── */
const buildPrompt = (
  p,
  g
) => `Bạn là ADHD OS Coach — người bạn đồng hành thông minh, ấm áp, thực tế. Cá nhân hóa hoàn toàn cho người dùng này.

NGƯỜI DÙNG: ${p.name || 'Bạn'} | ADHD: ${
  p.adhdType === 'inattentive'
    ? 'Mất tập trung'
    : p.adhdType === 'hyperactive'
    ? 'Tăng động'
    : 'Hỗn hợp'
} | Điểm yếu: ${(p.struggles || []).join(', ') || 'chưa rõ'}

TẦM NHÌN 10 NĂM: "${g.yr10 || 'chưa đặt'}"
MỤC TIÊU NĂM NAY: "${g.yr1 || 'chưa đặt'}"
TUẦN NÀY: "${g.week || 'chưa đặt'}"  
HÔM NAY: "${g.today || 'chưa đặt'}"

QUY TẮC:
- Luôn kết nối việc nhỏ hôm nay → tầm nhìn lớn (đây là điều ADHD hay mất)
- Tối đa 120 từ mỗi câu trừ khi được yêu cầu dài hơn
- Không thuyết giảng. Chỉ hành động cụ thể.
- Khi "tắt máy" → 1 câu WHY + 1 bước 5 phút
- Ăn mừng mọi tiến bộ dù nhỏ
- Giọng như người anh/bạn thân, không phải chuyên gia`;

/* ─── HELPERS ─────────────────────────────────────── */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const today = () => new Date().toLocaleDateString('vi-VN');

/* ─── SETUP SCREEN ───────────────────────────────── */
function Setup({ onDone }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    adhdType: '',
    struggles: [],
    northStar: '',
    currentSelf: { health: 3, work: 3, relationships: 3, growth: 3 },
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleStruggle = (s) =>
    set(
      'struggles',
      form.struggles.includes(s)
        ? form.struggles.filter((x) => x !== s)
        : [...form.struggles, s]
    );

  const steps = [
    /* Step 0 — Welcome */
    <div
      key="0"
      className="fadeUp"
      style={{ textAlign: 'center', padding: '0 8px' }}
    >
      <div style={{ fontSize: '56px', marginBottom: '20px' }}>🧠</div>
      <h1
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 'clamp(28px,6vw,40px)',
          color: '#FEF9F0',
          fontWeight: 900,
          lineHeight: 1.2,
          marginBottom: '16px',
        }}
      >
        ADHD OS
      </h1>
      <p
        style={{
          color: '#9CA3AF',
          fontSize: '16px',
          lineHeight: 1.7,
          marginBottom: '12px',
        }}
      >
        Hệ thống cá nhân hóa đầu tiên
        <br />
        được thiết kế{' '}
        <em style={{ color: '#F59E0B' }}>dành riêng cho não ADHD.</em>
      </p>
      <p
        style={{
          color: '#6B7280',
          fontSize: '14px',
          lineHeight: 1.6,
          marginBottom: '36px',
        }}
      >
        Không phải app productivity thông thường.
        <br />
        Đây là hệ điều hành cho não bạn.
      </p>
      <button
        className="btn-primary"
        style={{ padding: '14px 40px', fontSize: '16px' }}
        onClick={() => setStep(1)}
      >
        Bắt đầu cá nhân hóa →
      </button>
      <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '16px' }}>
        ~3 phút · Hoàn toàn riêng tư
      </p>
    </div>,

    /* Step 1 — Name + ADHD Type */
    <div key="1" className="fadeUp" style={{ width: '100%' }}>
      <div
        style={{
          marginBottom: '8px',
          color: '#6B7280',
          fontSize: '12px',
          fontFamily: "'DM Mono',monospace",
          letterSpacing: '2px',
        }}
      >
        BƯỚC 1 / 3
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          color: '#FEF9F0',
          fontSize: 'clamp(22px,5vw,30px)',
          marginBottom: '6px',
        }}
      >
        Giới thiệu bản thân
      </h2>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '28px' }}>
        Để mình hiểu bạn hơn trước khi coaching.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            color: '#9CA3AF',
            fontSize: '13px',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Tên của bạn
        </label>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Gọi mình là..."
          style={{
            width: '100%',
            background: '#1A1714',
            border: '1px solid #2A2520',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#FEF9F0',
            fontSize: '15px',
          }}
        />
      </div>

      <label
        style={{
          color: '#9CA3AF',
          fontSize: '13px',
          display: 'block',
          marginBottom: '12px',
        }}
      >
        Loại ADHD của bạn
      </label>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '32px',
        }}
      >
        {ADHD_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => set('adhdType', t.id)}
            style={{
              background: form.adhdType === t.id ? '#1F1A12' : '#1A1714',
              border: `1.5px solid ${
                form.adhdType === t.id ? '#F59E0B' : '#2A2520'
              }`,
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'left',
              transition: 'all .2s',
            }}
          >
            <span style={{ fontSize: '26px' }}>{t.emoji}</span>
            <div>
              <div
                style={{
                  color: '#FEF9F0',
                  fontWeight: '600',
                  fontSize: '15px',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {t.label}
              </div>
              <div
                style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}
              >
                {t.desc}
              </div>
            </div>
            {form.adhdType === t.id && (
              <span
                style={{
                  marginLeft: 'auto',
                  color: '#F59E0B',
                  fontSize: '18px',
                }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      <label
        style={{
          color: '#9CA3AF',
          fontSize: '13px',
          display: 'block',
          marginBottom: '12px',
        }}
      >
        Bạn hay gặp khó khăn với...{' '}
        <span style={{ color: '#4B5563' }}>(chọn tất cả phù hợp)</span>
      </label>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '32px',
        }}
      >
        {STRUGGLES.map((s) => (
          <button
            key={s}
            onClick={() => toggleStruggle(s)}
            style={{
              background: form.struggles.includes(s)
                ? '#1F1A12'
                : 'transparent',
              border: `1px solid ${
                form.struggles.includes(s) ? '#F59E0B' : '#2A2520'
              }`,
              borderRadius: '20px',
              padding: '6px 14px',
              color: form.struggles.includes(s) ? '#F59E0B' : '#6B7280',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all .15s',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '15px' }}
        onClick={() => (form.name && form.adhdType ? setStep(2) : null)}
        disabled={!form.name || !form.adhdType}
      >
        Tiếp theo →
      </button>
    </div>,

    /* Step 2 — North Star */
    <div key="2" className="fadeUp" style={{ width: '100%' }}>
      <div
        style={{
          marginBottom: '8px',
          color: '#6B7280',
          fontSize: '12px',
          fontFamily: "'DM Mono',monospace",
          letterSpacing: '2px',
        }}
      >
        BƯỚC 2 / 3
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          color: '#FEF9F0',
          fontSize: 'clamp(22px,5vw,30px)',
          marginBottom: '6px',
        }}
      >
        Ngôi sao Bắc Đẩu ✦
      </h2>
      <p
        style={{
          color: '#6B7280',
          fontSize: '14px',
          lineHeight: 1.6,
          marginBottom: '28px',
        }}
      >
        Đây là <span style={{ color: '#F59E0B' }}>lý do sâu xa nhất</span> bạn
        làm mọi thứ.
        <br />
        Khi bị "tắt máy", câu này sẽ kéo bạn trở lại.
      </p>

      <div
        style={{
          background: '#110E0B',
          border: '1px solid #2A2520',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            fontSize: '60px',
            opacity: 0.05,
            lineHeight: 1,
          }}
        >
          ✦
        </div>
        <label
          style={{
            color: '#F59E0B',
            fontSize: '12px',
            fontFamily: "'DM Mono',monospace",
            letterSpacing: '1px',
            display: 'block',
            marginBottom: '10px',
          }}
        >
          10 NĂM NỮA, TÔI LÀ...
        </label>
        <textarea
          value={form.northStar}
          onChange={(e) => set('northStar', e.target.value)}
          placeholder="Mô tả cuộc sống lý tưởng của bạn trong 10 năm. Bạn đang làm gì? Sống như thế nào? Ai ở cạnh bạn? Bạn cảm thấy gì mỗi sáng thức dậy?"
          rows={5}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#FEF9F0',
            fontSize: '15px',
            lineHeight: 1.8,
            resize: 'none',
          }}
        />
      </div>

      <div
        style={{
          background: '#0F150E',
          border: '1px solid #1A2918',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '28px',
        }}
      >
        <p style={{ color: '#4B5563', fontSize: '12px', lineHeight: 1.6 }}>
          💡 <span style={{ color: '#6B7280' }}>Gợi ý:</span> Không cần hoàn
          hảo. Viết từ trái tim, không phải từ lý trí. Bạn có thể chỉnh sửa sau
          bất kỳ lúc nào.
        </p>
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '15px' }}
        onClick={() => (form.northStar.length > 10 ? setStep(3) : null)}
        disabled={form.northStar.length <= 10}
      >
        Tiếp theo →
      </button>
    </div>,

    /* Step 3 — Current Self */
    <div key="3" className="fadeUp" style={{ width: '100%' }}>
      <div
        style={{
          marginBottom: '8px',
          color: '#6B7280',
          fontSize: '12px',
          fontFamily: "'DM Mono',monospace",
          letterSpacing: '2px',
        }}
      >
        BƯỚC 3 / 3
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          color: '#FEF9F0',
          fontSize: 'clamp(22px,5vw,30px)',
          marginBottom: '6px',
        }}
      >
        Bạn hiện tại
      </h2>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '28px' }}>
        Tự đánh giá thành thật. Đây là điểm xuất phát.
      </p>

      {[
        { key: 'health', label: 'Sức khỏe & Thể chất', icon: '💪' },
        { key: 'work', label: 'Công việc & Sự nghiệp', icon: '💼' },
        { key: 'relationships', label: 'Các mối quan hệ', icon: '❤️' },
        { key: 'growth', label: 'Phát triển bản thân', icon: '🌱' },
      ].map(({ key, label, icon }) => (
        <div key={key} style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: '#D1D5DB', fontSize: '14px' }}>
              {icon} {label}
            </span>
            <span
              style={{
                color: '#F59E0B',
                fontFamily: "'DM Mono',monospace",
                fontSize: '14px',
              }}
            >
              {form.currentSelf[key]}/5
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() =>
                  set('currentSelf', { ...form.currentSelf, [key]: n })
                }
                style={{
                  flex: 1,
                  height: '36px',
                  border: `1.5px solid ${
                    form.currentSelf[key] >= n ? '#F59E0B' : '#2A2520'
                  }`,
                  borderRadius: '8px',
                  background:
                    form.currentSelf[key] >= n ? '#1F1A12' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            <span style={{ color: '#4B5563', fontSize: '11px' }}>Thấp</span>
            <span style={{ color: '#4B5563', fontSize: '11px' }}>Cao</span>
          </div>
        </div>
      ))}

      <button
        className="btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '15px',
          marginTop: '8px',
        }}
        onClick={() => onDone(form)}
      >
        Vào ADHD OS của tôi 🚀
      </button>
    </div>,
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0C0A08',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>{steps[step]}</div>
    </div>
  );
}

/* ─── API KEY MODAL ───────────────────────────────── */
function ApiModal({ onSave, onSkip }) {
  const [k, setK] = useState('');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0C0A08CC',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 999,
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '400px', padding: '28px' }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            color: '#FEF9F0',
            fontSize: '22px',
            marginBottom: '8px',
          }}
        >
          Kết nối AI Coach 🔑
        </h3>
        <p
          style={{
            color: '#6B7280',
            fontSize: '13px',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          Nhập Anthropic API Key để bật chức năng AI Coach.
          <br />
          Key được lưu trong trình duyệt, không gửi đi đâu khác.
        </p>
        <input
          value={k}
          onChange={(e) => setK(e.target.value)}
          type="password"
          placeholder="sk-ant-..."
          style={{
            width: '100%',
            background: '#110E0B',
            border: '1px solid #2A2520',
            borderRadius: '10px',
            padding: '12px',
            color: '#FEF9F0',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-ghost"
            style={{ flex: 1, padding: '11px' }}
            onClick={onSkip}
          >
            Dùng demo
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1, padding: '11px' }}
            onClick={() => k.startsWith('sk-') && onSave(k)}
          >
            Kết nối →
          </button>
        </div>
        <p
          style={{
            color: '#374151',
            fontSize: '11px',
            textAlign: 'center',
            marginTop: '12px',
          }}
        >
          Lấy key tại console.anthropic.com
        </p>
      </div>
    </div>
  );
}

/* ─── DAILY SCREEN ───────────────────────────────── */
function DailyScreen({ profile, goals, setGoals, wins, setWins }) {
  const [energy, setEnergy] = useState(3);
  const [done, setDone] = useState(false);
  const energyLabels = ['😴', '😕', '😐', '🙂', '🔥'];
  const energyColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#F59E0B'];

  const markDone = () => {
    setDone(true);
    if (goals.today)
      setWins((w) => [
        { date: today(), text: goals.today, energy },
        ...w.slice(0, 29),
      ]);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px' }}>
      {/* North Star Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg,#1A1410,#1F1A0E)',
          border: '1px solid #2A2010',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            fontSize: '80px',
            opacity: 0.04,
          }}
        >
          ✦
        </div>
        <div
          style={{
            color: '#B45309',
            fontSize: '11px',
            fontFamily: "'DM Mono',monospace",
            letterSpacing: '1.5px',
            marginBottom: '6px',
          }}
        >
          NGÔI SAO BẮC ĐẨU
        </div>
        <p
          style={{
            color: '#D97706',
            fontSize: '13px',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          "
          {goals.yr10 ||
            'Chưa đặt tầm nhìn 10 năm — vào tab Mục tiêu để bắt đầu'}
          "
        </p>
      </div>

      {/* Energy Check */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div
          style={{
            color: '#6B7280',
            fontSize: '12px',
            fontFamily: "'DM Mono',monospace",
            letterSpacing: '1px',
            marginBottom: '12px',
          }}
        >
          NĂNG LƯỢNG HÔM NAY
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setEnergy(n)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                fontSize: '22px',
                cursor: 'pointer',
                background: energy === n ? '#1F1A12' : 'transparent',
                border: `2px solid ${
                  energy === n ? energyColors[n - 1] : '#2A2520'
                }`,
                transition: 'all .2s',
              }}
            >
              {energyLabels[n - 1]}
            </button>
          ))}
        </div>
        <p
          style={{
            color: energyColors[energy - 1],
            fontSize: '13px',
            textAlign: 'center',
            marginTop: '10px',
            fontWeight: '600',
          }}
        >
          {
            [
              'Cần nghỉ ngơi',
              'Khởi động chậm',
              'Bình thường',
              'Khá tốt',
              'Đỉnh cao!',
            ][energy - 1]
          }
        </p>
      </div>

      {/* Today's ONE THING */}
      <div
        style={{
          background: done ? '#0A1F0E' : '#110E0B',
          border: `1.5px solid ${done ? '#166534' : '#2A2520'}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          transition: 'all .4s',
          animation: 'glow 3s ease infinite',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              color: '#F59E0B',
              fontSize: '11px',
              fontFamily: "'DM Mono',monospace",
              letterSpacing: '1.5px',
            }}
          >
            ⚡ VIỆC DUY NHẤT HÔM NAY
          </div>
          {done && (
            <span style={{ color: '#22C55E', fontSize: '20px' }}>✓</span>
          )}
        </div>
        {done ? (
          <p
            style={{
              color: '#22C55E',
              fontSize: '18px',
              fontWeight: '600',
              fontFamily: "'Playfair Display',serif",
            }}
          >
            Đã hoàn thành! 🎉
          </p>
        ) : (
          <textarea
            value={goals.today || ''}
            onChange={(e) => setGoals((g) => ({ ...g, today: e.target.value }))}
            placeholder="Hôm nay, nếu chỉ làm được 1 việc — việc đó là gì?"
            rows={3}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#FEF9F0',
              fontSize: '16px',
              lineHeight: 1.7,
              resize: 'none',
              fontFamily: "'Playfair Display',serif",
            }}
          />
        )}
        {!done && goals.today && (
          <button
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              marginTop: '12px',
            }}
            onClick={markDone}
          >
            ✓ Đánh dấu hoàn thành
          </button>
        )}
      </div>

      {/* Wins today */}
      {wins.filter((w) => w.date === today()).length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div
            style={{
              color: '#6B7280',
              fontSize: '12px',
              fontFamily: "'DM Mono',monospace",
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            WINS HÔM NAY 🏆
          </div>
          {wins
            .filter((w) => w.date === today())
            .map((w, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #1E1B18',
                }}
              >
                <span>{['😴', '😕', '😐', '🙂', '🔥'][w.energy - 1]}</span>
                <span style={{ color: '#D1D5DB', fontSize: '14px' }}>
                  {w.text}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Connection to Big Goal */}
      {goals.today && goals.yr10 && (
        <div
          style={{
            background: '#0A100F',
            border: '1px solid #1A2520',
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div
            style={{
              color: '#4B5563',
              fontSize: '11px',
              fontFamily: "'DM Mono',monospace",
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            VIỆC NHỎ HÔM NAY → MỤC TIÊU LỚN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                flex: 1,
                background: '#111',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            >
              <p
                style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: 1.5 }}
              >
                "{goals.today}"
              </p>
            </div>
            <span style={{ color: '#374151', fontSize: '18px' }}>→</span>
            <div
              style={{
                flex: 1,
                background: '#111',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            >
              <p
                style={{ color: '#D97706', fontSize: '12px', lineHeight: 1.5 }}
              >
                "{goals.yr10.substring(0, 60)}..."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── GOALS SCREEN ───────────────────────────────── */
function GoalsScreen({ goals, setGoals }) {
  const [open, setOpen] = useState('today');
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px' }}>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          color: '#FEF9F0',
          fontSize: '24px',
          marginBottom: '6px',
        }}
      >
        Kim tự tháp mục tiêu
      </h2>
      <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>
        Tầm nhìn lớn · Hành động nhỏ · Chỉ focus vào HÔM NAY
      </p>
      {GOAL_LEVELS.map((lv, i) => (
        <div key={lv.key} style={{ marginBottom: '8px' }}>
          <button
            onClick={() => setOpen(open === lv.key ? null : lv.key)}
            style={{
              width: '100%',
              background: open === lv.key ? '#1A1714' : '#110E0B',
              border: `1px solid ${
                open === lv.key || lv.key === 'today' ? '#2A2520' : '#1A1714'
              }`,
              borderRadius: '12px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all .2s',
              opacity: lv.key === 'today' ? 1 : 0.7 + i * 0.04,
            }}
          >
            <span style={{ fontSize: '20px' }}>{lv.icon}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div
                style={{
                  color: '#9CA3AF',
                  fontSize: '10px',
                  fontFamily: "'DM Mono',monospace",
                  letterSpacing: '1.5px',
                }}
              >
                {lv.label}
              </div>
              {goals[lv.key] && (
                <div
                  style={{
                    color: '#FEF9F0',
                    fontSize: '13px',
                    marginTop: '2px',
                    lineHeight: 1.4,
                  }}
                >
                  {goals[lv.key].substring(0, 60)}
                  {goals[lv.key].length > 60 ? '...' : ''}
                </div>
              )}
              {!goals[lv.key] && (
                <div
                  style={{
                    color: '#374151',
                    fontSize: '12px',
                    marginTop: '2px',
                    fontStyle: 'italic',
                  }}
                >
                  {lv.desc} — chưa đặt
                </div>
              )}
            </div>
            <span style={{ color: '#374151', fontSize: '14px' }}>
              {open === lv.key ? '▲' : '▼'}
            </span>
          </button>
          {open === lv.key && (
            <div
              className="card"
              style={{
                padding: '16px',
                marginTop: '4px',
                borderRadius: '0 0 12px 12px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                value={goals[lv.key] || ''}
                onChange={(e) =>
                  setGoals((g) => ({ ...g, [lv.key]: e.target.value }))
                }
                placeholder={`${lv.label}: Mục tiêu của bạn là gì?`}
                rows={lv.key === 'yr10' ? 4 : 3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#FEF9F0',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  resize: 'none',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── COACH SCREEN ───────────────────────────────── */
function CoachScreen({ profile, goals, apiKey, showApiModal }) {
  const [msgs, setMsgs] = useState([
    {
      role: 'assistant',
      content: `Chào ${
        profile.name || 'bạn'
      }! 👋\n\nMình là AI Coach cá nhân của bạn — được cấu hình riêng cho não ADHD của bạn.\n\nChọn mode bên dưới hoặc nói thẳng điều bạn cần lúc này.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = async (override) => {
    const text = override || input;
    if (!text.trim() || loading) return;
    const newMsgs = [...msgs, { role: 'user', content: text }];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);
    if (taRef.current) taRef.current.style.height = '22px';

    if (!apiKey) {
      setTimeout(() => {
        setMsgs((p) => [
          ...p,
          {
            role: 'assistant',
            content: `[DEMO MODE]\n\nMình nhận được: "${text}"\n\nĐể nhận coaching AI thật sự, bấm nút 🔑 để nhập API Key.\n\nTrong demo này, mình vẫn có thể giúp bạn với:\n• Kế hoạch hôm nay\n• Mục tiêu tuần\n• Phân tích điểm mạnh/yếu`,
          },
        ]);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: buildPrompt(profile, goals),
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply =
        data.content?.map((b) => b.text || '').join('') ||
        data.error?.message ||
        'Lỗi không xác định.';
      setMsgs((p) => [...p, { role: 'assistant', content: reply }]);
    } catch {
      setMsgs((p) => [
        ...p,
        { role: 'assistant', content: 'Lỗi kết nối. Thử lại nhé!' },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mode Buttons */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1A1714',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {COACH_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() =>
              m.prompt.endsWith(': ') ? setInput(m.prompt) : send(m.prompt)
            }
            style={{
              background: '#1A1714',
              border: '1px solid #2A2520',
              borderRadius: '20px',
              padding: '7px 14px',
              color: '#9CA3AF',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans',sans-serif",
              flexShrink: 0,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F59E0B55';
              e.currentTarget.style.color = '#F59E0B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2A2520';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
        {!apiKey && (
          <button
            onClick={showApiModal}
            style={{
              background: '#1A1410',
              border: '1px solid #2A2010',
              borderRadius: '20px',
              padding: '7px 14px',
              color: '#D97706',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans',sans-serif",
              flexShrink: 0,
            }}
          >
            🔑 Kết nối AI
          </button>
        )}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '14px',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            {m.role === 'assistant' && (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#92400E,#D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                🧠
              </div>
            )}
            <div
              style={{
                maxWidth: '85%',
                background: m.role === 'user' ? '#1F1A12' : '#1A1714',
                border: `1px solid ${
                  m.role === 'user' ? '#2A2010' : '#2A2520'
                }`,
                borderRadius:
                  m.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                padding: '10px 14px',
              }}
            >
              <pre
                style={{
                  color: m.role === 'user' ? '#FCD34D' : '#D1D5DB',
                  fontSize: '13px',
                  fontFamily: "'DM Sans',sans-serif",
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content}
              </pre>
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#92400E,#D97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
              }}
            >
              🧠
            </div>
            <div
              style={{
                background: '#1A1714',
                border: '1px solid #2A2520',
                borderRadius: '16px 16px 16px 4px',
                padding: '12px 16px',
                display: 'flex',
                gap: '5px',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#D97706',
                    animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #1A1714',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: '#1A1714',
            border: '1px solid #2A2520',
            borderRadius: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
            padding: '10px 12px',
          }}
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height =
                Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            placeholder="Nói với coach của bạn..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#FEF9F0',
              fontSize: '14px',
              lineHeight: 1.6,
              minHeight: '22px',
              maxHeight: '100px',
              resize: 'none',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background:
                input.trim() && !loading
                  ? 'linear-gradient(135deg,#F59E0B,#D97706)'
                  : '#2A2520',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              color: '#0C0A08',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PROGRESS SCREEN ─────────────────────────────── */
function ProgressScreen({ profile, wins }) {
  const current = profile.currentSelf || {
    health: 0,
    work: 0,
    relationships: 0,
    growth: 0,
  };
  const areas = [
    { key: 'health', label: 'Sức khỏe', icon: '💪' },
    { key: 'work', label: 'Công việc', icon: '💼' },
    { key: 'relationships', label: 'Quan hệ', icon: '❤️' },
    { key: 'growth', label: 'Phát triển', icon: '🌱' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px' }}>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          color: '#FEF9F0',
          fontSize: '24px',
          marginBottom: '6px',
        }}
      >
        Bằng chứng tiến bộ
      </h2>
      <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>
        Não ADHD cần thấy bằng chứng để tin vào bản thân.
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: '32px',
              color: '#F59E0B',
              fontWeight: '700',
            }}
          >
            {wins.length}
          </div>
          <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>
            Wins tổng cộng
          </div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: '32px',
              color: '#22C55E',
              fontWeight: '700',
            }}
          >
            {new Set(wins.map((w) => w.date)).size}
          </div>
          <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>
            Ngày có win
          </div>
        </div>
      </div>

      {/* Current Self Radar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div
          style={{
            color: '#6B7280',
            fontSize: '12px',
            fontFamily: "'DM Mono',monospace",
            letterSpacing: '1px',
            marginBottom: '14px',
          }}
        >
          ĐIỂM XUẤT PHÁT
        </div>
        {areas.map((a) => (
          <div key={a.key} style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>
                {a.icon} {a.label}
              </span>
              <span
                style={{
                  color: '#F59E0B',
                  fontFamily: "'DM Mono',monospace",
                  fontSize: '13px',
                }}
              >
                {current[a.key] || 0}/5
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: '#2A2520',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(current[a.key] || 0) * 20}%`,
                  background: 'linear-gradient(90deg,#D97706,#F59E0B)',
                  borderRadius: '3px',
                  transition: 'width .5s',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Win Log */}
      <div>
        <div
          style={{
            color: '#6B7280',
            fontSize: '12px',
            fontFamily: "'DM Mono',monospace",
            letterSpacing: '1px',
            marginBottom: '12px',
          }}
        >
          NHẬT KÝ WINS 🏆
        </div>
        {wins.length === 0 ? (
          <div
            className="card"
            style={{ padding: '20px', textAlign: 'center' }}
          >
            <p style={{ color: '#374151', fontSize: '14px' }}>
              Chưa có win nào được ghi lại.
            </p>
            <p style={{ color: '#374151', fontSize: '13px', marginTop: '8px' }}>
              Hoàn thành việc "Hôm nay" đầu tiên để bắt đầu!
            </p>
          </div>
        ) : (
          wins.map((w, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '14px',
                marginBottom: '8px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {['😴', '😕', '😐', '🙂', '🔥'][w.energy - 1]}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: '#D1D5DB',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {w.text}
                </p>
                <p
                  style={{
                    color: '#374151',
                    fontSize: '11px',
                    marginTop: '4px',
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {w.date}
                </p>
              </div>
              <span style={{ color: '#22C55E', fontSize: '16px' }}>✓</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── MAIN APP ────────────────────────────────────── */
const TABS = [
  { id: 'daily', icon: '⚡', label: 'Hôm nay' },
  { id: 'goals', icon: '🎯', label: 'Mục tiêu' },
  { id: 'coach', icon: '🧠', label: 'Coach' },
  { id: 'progress', icon: '📈', label: 'Tiến bộ' },
];

export default function App() {
  const [setup, setSetup] = useState(false);
  const [profile, setProfile] = useState({});
  const [goals, setGoals] = useState({});
  const [wins, setWins] = useState([]);
  const [tab, setTab] = useState('daily');
  const [apiKey, setApiKey] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);

  const handleSetup = (form) => {
    setProfile({
      name: form.name,
      adhdType: form.adhdType,
      struggles: form.struggles,
      currentSelf: form.currentSelf,
      setupComplete: true,
    });
    setGoals({ yr10: form.northStar });
    setSetup(true);
    setShowApiModal(true);
  };

  if (!setup)
    return (
      <>
        <G />
        <Setup onDone={handleSetup} />
      </>
    );

  return (
    <div
      style={{
        height: '100dvh',
        background: '#0C0A08',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <G />
      {/* Header */}
      <div
        style={{
          background: '#0A0806',
          borderBottom: '1px solid #1A1714',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg,#D97706,#F59E0B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            🧠
          </div>
          <div>
            <div
              style={{
                color: '#FEF9F0',
                fontWeight: '700',
                fontSize: '14px',
                fontFamily: "'Playfair Display',serif",
              }}
            >
              ADHD OS
            </div>
            <div
              style={{
                color: '#4B5563',
                fontSize: '10px',
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {profile.adhdType === 'inattentive'
                ? '🌊'
                : "profile.adhdType==='hyperactive'"
                ? '⚡'
                : '🌪️'}{' '}
              {profile.name}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowApiModal(true)}
          style={{
            background: 'transparent',
            border: '1px solid #1A1714',
            borderRadius: '8px',
            padding: '6px 10px',
            color: apiKey ? '#22C55E' : '#6B7280',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: "'DM Mono',monospace",
          }}
        >
          {apiKey ? '● AI ON' : '🔑 Key'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'daily' && (
          <DailyScreen
            profile={profile}
            goals={goals}
            setGoals={setGoals}
            wins={wins}
            setWins={setWins}
          />
        )}
        {tab === 'goals' && <GoalsScreen goals={goals} setGoals={setGoals} />}
        {tab === 'coach' && (
          <CoachScreen
            profile={profile}
            goals={goals}
            apiKey={apiKey}
            showApiModal={() => setShowApiModal(true)}
          />
        )}
        {tab === 'progress' && <ProgressScreen profile={profile} wins={wins} />}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          background: '#0A0806',
          borderTop: '1px solid #1A1714',
          display: 'flex',
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 4px 12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: '20px', opacity: tab === t.id ? 1 : 0.4 }}>
              {t.icon}
            </span>
            <span
              style={{
                color: tab === t.id ? '#F59E0B' : '#374151',
                fontSize: '10px',
                fontFamily: "'DM Mono',monospace",
                fontWeight: tab === t.id ? '700' : '400',
                letterSpacing: '0.5px',
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {showApiModal && (
        <ApiModal
          onSave={(k) => {
            setApiKey(k);
            setShowApiModal(false);
          }}
          onSkip={() => setShowApiModal(false)}
        />
      )}
    </div>
  );
}
