import { useState, useEffect, useRef, useCallback } from "react";
import { Analytics } from "@vercel/analytics/react";

// ── Constants & Data ──────────────────────────────────────────────
const SCHEMA_FIELDS = [
  { raw: "cf_variable_comp_plan_c", translated: "Variable Compensation Plan", type: "Compensation", risk: "high", confidence: 94 },
  { raw: "cf_ee_term_rsn_v2", translated: "Termination Reason", type: "Termination", risk: "high", confidence: 87 },
  { raw: "cf_perf_tier_mgr_ovr", translated: "Performance Tier (Manager Override)", type: "Performance", risk: "high", confidence: 91 },
  { raw: "cf_promo_elig_flag", translated: "Promotion Eligibility", type: "Career Action", risk: "medium", confidence: 88 },
  { raw: "cf_custom_field_55", translated: "Parking Spot Number", type: "General", risk: "none", confidence: 76 },
  { raw: "cf_equity_grant_v4", translated: "Stock Grant Schedule", type: "Compensation", risk: "high", confidence: 92 },
  { raw: "cf_ada_accom_type", translated: "ADA Accommodation Type", type: "Protected Status", risk: "medium", confidence: 83 },
  { raw: "cf_int_panel_comp", translated: "Interview Panel Composition", type: "Hiring", risk: "high", confidence: 89 },
];

const DEMO_STEPS = [
  { phase: "DISCOVER", label: "Scan Tenant Schema", description: "Argot connects to your Workday tenant and crawls every data source, field, and custom object. No manual configuration needed.", detail: "4,500+ fields across 16 data sources scanned in under 90 seconds", visual: "scan" },
  { phase: "DETECT", label: "Find Ghost Fields", description: "Workday silently omits fields your integration user can't see. Argot detects these invisible gaps by comparing your actual schema against the known standard.", detail: "23 ghost fields detected — fields your current tools don't know exist", visual: "detect" },
  { phase: "INFER", label: "Understand Meaning", description: "Custom fields like cf_variable_comp_plan_c have no documentation. Argot's semantic engine infers what each field actually means using pattern analysis and domain intelligence.", detail: "142 custom fields semantically resolved with 87% avg confidence", visual: "infer" },
  { phase: "TRANSLATE", label: "Natural Language Control", description: "Ask questions in plain English. Argot translates to valid WQL, validates against your actual schema, and flags any compliance risks before execution.", detail: '"Show me all employees whose variable comp changed last quarter"', visual: "translate" },
];

const BENTO_FEATURES = [
  { title: "Ghost Field Detection", description: "Workday's APIs silently omit fields when permissions are missing. You can't fix what you can't see. Argot maps expected vs. actual schema to reveal what's invisible.", icon: "\u{1F47B}", span: "wide" },
  { title: "9,500+ Rows of Domain Intelligence", description: "Field mappings, security permissions, WQL syntax, HCIM standards, and API structures — curated from enterprise documentation across industries.", icon: "\u{1F9E0}", span: "normal" },
  { title: "EU AI Act Compliant", description: "Human-in-the-loop gates on high-risk HR fields. Full audit trails. Bias detection on compensation, hiring, and termination decisions. Ready for August 2026.", icon: "\u{1F6E1}\uFE0F", span: "normal" },
  { title: "Natural Language \u2192 WQL", description: "Business users describe what they need in plain English. Argot generates validated WQL with full explainability — every translation shows its reasoning chain.", icon: "\u{1F4AC}", span: "wide" },
  { title: "Semantic Inference Engine", description: "When cf_custom_field_55 has no documentation, Argot infers meaning from naming patterns, value distributions, and cross-tenant intelligence.", icon: "\u{1F52E}", span: "normal" },
  { title: "Zero-Touch Deployment", description: "Read-only OAuth connection. No data leaves your tenant. No modifications to your Workday configuration. Scan, understand, control.", icon: "\u26A1", span: "normal" },
];

const PASSWORD = "argot2026";

// ── Styles ────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
  :root {
    --bg-primary: #09090b; --bg-secondary: #0f0f12; --bg-tertiary: #16161a; --bg-card: #1a1a20;
    --border-subtle: rgba(255,255,255,0.06); --border-glow: rgba(120,160,255,0.15); --border-glow-hover: rgba(120,160,255,0.3);
    --text-primary: #f0f0f2; --text-secondary: #8b8b9e; --text-tertiary: #5a5a6e;
    --accent-blue: #5b8def; --accent-blue-dim: rgba(91,141,239,0.15); --accent-cyan: #4ecdc4;
    --accent-amber: #f0b429; --accent-red: #ef5b5b; --accent-green: #4ecdc4; --accent-purple: #9b8bef;
    --font-sans: 'Inter', -apple-system, sans-serif; --font-mono: 'JetBrains Mono', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body, #root { background: var(--bg-primary); color: var(--text-primary); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  .glow-border { border: 1px solid var(--border-subtle); transition: border-color 0.5s ease, box-shadow 0.5s ease; }
  .glow-border:hover { border-color: var(--border-glow-hover); box-shadow: 0 0 30px -10px rgba(91,141,239,0.15), inset 0 0 30px -15px rgba(91,141,239,0.05); }
  @keyframes flowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes scanLine { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes typewriter { from { width: 0; } to { width: 100%; } }
  @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
  .noise-overlay::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events: none; z-index: 9999; opacity: 0.4; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg-primary); } ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 3px; } ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

  /* ── Responsive Grid Classes ─────────────────────────────────── */
  .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border-subtle); border-radius: 14px; overflow: hidden; }
  .hiw-grid { display: grid; grid-template-columns: 340px 1fr; gap: 40px; }
  .bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border-subtle); border-radius: 16px; overflow: hidden; }
  .compliance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .footer-inner { display: flex; justify-content: space-between; align-items: center; }
  .nav-links { display: flex; align-items: center; gap: 32px; }
  .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
  .mobile-menu { display: none; }
  .schema-arrow-container { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .schema-fields-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }

  /* ── Tablet: <= 1024px ────────────────────────────────────────── */
  @media (max-width: 1024px) {
    .hero-grid { grid-template-columns: 1fr; gap: 40px; }
    .hiw-grid { grid-template-columns: 1fr; gap: 24px; }
    .bento-grid { grid-template-columns: repeat(2, 1fr); }
    .bento-grid > div { grid-column: span 1 !important; }
    .compliance-grid { grid-template-columns: 1fr; gap: 40px; }
  }

  /* ── Tablet: <= 768px ─────────────────────────────────────────── */
  @media (max-width: 768px) {
    .nav-links { display: none; }
    .nav-hamburger { display: flex; align-items: center; justify-content: center; }
    .mobile-menu {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200;
      background: rgba(9,9,11,0.97); backdrop-filter: blur(20px);
      flex-direction: column; align-items: center; justify-content: center; gap: 24px;
    }
    .mobile-menu.open { display: flex; }
    .mobile-menu a { color: var(--text-primary); text-decoration: none; font-size: 18px; font-weight: 600; letter-spacing: 0.01em; }
    .mobile-menu .mobile-close { position: absolute; top: 20px; right: 24px; background: none; border: none; color: var(--text-primary); font-size: 28px; cursor: pointer; }
    .stats-grid { grid-template-columns: 1fr; }
    .hero-grid h1 { font-size: 30px !important; }
    .hero-grid p { font-size: 15px !important; }
    .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
    .schema-fields-row { flex-direction: column; gap: 12px; }
    .schema-arrow-container svg { transform: rotate(90deg); }
  }

  /* ── Phone: <= 480px ──────────────────────────────────────────── */
  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; }
    .bento-grid { grid-template-columns: 1fr; }
    .hero-grid h1 { font-size: 30px !important; }
    section { padding: 60px 0 !important; }
  }
`;

// ── Password Gate ─────────────────────────────────────────────────
function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("argot_auth") === "1");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem("argot_auth", "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 1500);
    }
  };

  if (authed) return children;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: "#09090b", fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #09090b; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
      `}</style>
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 500, height: 500, background: "radial-gradient(ellipse at center, rgba(91,141,239,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #5b8def, #9b8bef)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "white", fontFamily: "'JetBrains Mono', monospace",
        }}>A</div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 600, letterSpacing: "0.05em", color: "#f0f0f2" }}>ARGOT</span>
        <span style={{
          fontSize: 11, fontWeight: 500, color: "#5b8def",
          background: "rgba(91,141,239,0.15)", padding: "2px 8px", borderRadius: 4,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
        }}>LAYER</span>
      </div>
      <form onSubmit={handleSubmit} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 320,
        animation: error ? "shake 0.4s ease-out" : "none",
      }}>
        <input
          type="password"
          placeholder="Enter password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          style={{
            width: "100%", padding: "13px 18px", borderRadius: 10,
            background: "#0f0f12", border: `1px solid ${error ? "rgba(239,91,91,0.4)" : "rgba(255,255,255,0.06)"}`,
            color: "#f0f0f2", fontSize: 14, fontFamily: "'Inter', sans-serif",
            outline: "none", transition: "border-color 0.3s",
          }}
          onFocus={(e) => { if (!error) e.target.style.borderColor = "rgba(120,160,255,0.3)"; }}
          onBlur={(e) => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.06)"; }}
        />
        <button type="submit" style={{
          width: "100%", padding: "13px", borderRadius: 10,
          background: "#f0f0f2", color: "#09090b", fontSize: 14, fontWeight: 600,
          border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={(e) => e.target.style.opacity = "0.85"}
          onMouseLeave={(e) => e.target.style.opacity = "1"}
        >Continue</button>
        {error && (
          <span style={{ fontSize: 13, color: "#ef5b5b", fontWeight: 500 }}>Incorrect password</span>
        )}
      </form>
      <p style={{ marginTop: 60, fontSize: 12, color: "#5a5a6e" }}>This site is password-protected.</p>
    </div>
  );
}

// ── Utility Components ────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, isVisible];
}

function Section({ children, id, className = "" }) {
  const [ref, visible] = useInView(0.08);
  return (
    <section ref={ref} id={id} className={className} style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: "opacity 0.8s ease, transform 0.8s ease", padding: "100px 0", position: "relative",
    }}>{children}</section>
  );
}

function Container({ children, style }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", ...style }}>{children}</div>;
}

// ── Nav ───────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);
  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(9,9,11,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.3)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
        transition: "all 0.4s ease", padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-mono)" }}>A</div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-primary)" }}>ARGOT</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--accent-blue)", background: "var(--accent-blue-dim)", padding: "2px 7px", borderRadius: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>LAYER</span>
          </div>
          <div className="nav-links">
            {["How It Works", "Features", "Compliance"].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, "-")}`} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, fontWeight: 500, letterSpacing: "0.01em", transition: "color 0.3s" }}
                onMouseEnter={e => e.target.style.color = "var(--text-primary)"} onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}>{label}</a>
            ))}
            <a href="#early-access" style={{ background: "var(--text-primary)", color: "var(--bg-primary)", padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "opacity 0.3s" }}
              onMouseEnter={e => e.target.style.opacity = "0.85"} onMouseLeave={e => e.target.style.opacity = "1"}>Request Access</a>
          </div>
          <button className="nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">&#x2715;</button>
        {["How It Works", "Features", "Compliance"].map(label => (
          <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMenuOpen(false)}>{label}</a>
        ))}
        <a href="#early-access" onClick={() => setMenuOpen(false)} style={{ background: "var(--text-primary)", color: "var(--bg-primary)", padding: "12px 32px", borderRadius: 10, fontWeight: 700 }}>Request Access</a>
      </div>
    </>
  );
}

// ── Hero Schema Visualization ─────────────────────────────────────
function SchemaVisualization() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState("scanning");
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase("scanning");
      setTimeout(() => setPhase("resolving"), 800);
      setTimeout(() => setPhase("resolved"), 1600);
      setTimeout(() => setActiveIndex(prev => (prev + 1) % SCHEMA_FIELDS.length), 3200);
    }, 3600);
    return () => clearInterval(interval);
  }, []);
  const field = SCHEMA_FIELDS[activeIndex];
  const riskColor = field.risk === "high" ? "var(--accent-red)" : field.risk === "medium" ? "var(--accent-amber)" : "var(--accent-green)";
  return (
    <div className="glow-border" style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 1, overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef5b5b" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f0b429" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ecdc4" }} />
        <span style={{ marginLeft: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>argot — schema_scan — tenant_acme_corp</span>
      </div>
      <div style={{ padding: "28px 24px", minHeight: 220 }}>
        {phase === "scanning" && <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--accent-blue), transparent)", animation: "scanLine 0.8s ease-in-out", opacity: 0.6 }} />}
        <div className="schema-fields-row" style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: "14px 18px", background: phase === "scanning" ? "rgba(91,141,239,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${phase === "scanning" ? "rgba(91,141,239,0.2)" : "var(--border-subtle)"}`, borderRadius: 10, transition: "all 0.5s ease" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Raw Field</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--accent-blue)", fontWeight: 500 }}>{field.raw}</div>
          </div>
          <div className="schema-arrow-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <svg width="40" height="20" viewBox="0 0 40 20">
              <defs><linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={phase !== "scanning" ? 1 : 0.3} /><stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={phase === "resolved" ? 1 : 0.3} /></linearGradient></defs>
              <path d="M 2 10 L 30 10 M 26 5 L 32 10 L 26 15" fill="none" stroke="url(#arrowGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {phase === "resolving" && <circle cx="16" cy="10" r="2" fill="var(--accent-blue)"><animate attributeName="cx" from="4" to="32" dur="0.6s" repeatCount="indefinite" /><animate attributeName="opacity" from="1" to="0" dur="0.6s" repeatCount="indefinite" /></circle>}
            </svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: phase === "resolved" ? "var(--accent-cyan)" : "var(--text-tertiary)", letterSpacing: "0.1em", transition: "color 0.5s" }}>
              {phase === "scanning" ? "SCANNING" : phase === "resolving" ? "INFERRING" : "RESOLVED"}
            </span>
          </div>
          <div style={{ flex: 1, padding: "14px 18px", background: phase === "resolved" ? "rgba(78,205,196,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${phase === "resolved" ? "rgba(78,205,196,0.2)" : "var(--border-subtle)"}`, borderRadius: 10, transition: "all 0.5s ease", opacity: phase === "resolved" ? 1 : 0.4 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Business Term</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: phase === "resolved" ? "var(--text-primary)" : "var(--text-tertiary)", transition: "color 0.5s" }}>{field.translated}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: phase === "resolved" ? 1 : 0.2, transition: "opacity 0.5s ease 0.2s" }}>
          {[{ label: "Type", value: field.type }, { label: "Confidence", value: `${field.confidence}%` }, { label: "Bias Risk", value: field.risk.toUpperCase(), color: riskColor }].map(({ label, value, color }) => (
            <div key={label} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>{label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: color || "var(--text-primary)", fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 20 }}>
          {SCHEMA_FIELDS.map((_, i) => <div key={i} style={{ width: i === activeIndex ? 20 : 5, height: 5, borderRadius: 3, background: i === activeIndex ? "var(--accent-blue)" : "var(--border-subtle)", transition: "all 0.4s ease" }} />)}
        </div>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", paddingTop: 80 }}>
      <div style={{ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(ellipse at center, rgba(91,141,239,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <Container>
        <div className="hero-grid">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, border: "1px solid var(--border-glow)", marginBottom: 28, animation: "fadeInUp 0.6s ease-out" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 8px var(--accent-green)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Now accepting early access requests</span>
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 20, animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
              <span style={{ color: "var(--text-primary)" }}>Workday's AI doesn't know </span>
              <span style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% 200%", animation: "gradientShift 4s ease infinite" }}>your Workday.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: 480, marginBottom: 36, animation: "fadeInUp 0.6s ease-out 0.2s both" }}>
              Every enterprise customizes Workday differently. Illuminate trains cross-tenant on standard schemas —
              it can't see your custom fields, your ghost fields, your spaghetti architecture.
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}> Argot can.</span>
            </p>
            <div style={{ display: "flex", gap: 14, animation: "fadeInUp 0.6s ease-out 0.3s both" }}>
              <a href="#early-access" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--text-primary)", color: "var(--bg-primary)", padding: "12px 26px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "transform 0.2s, opacity 0.2s" }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.opacity = "0.9"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.opacity = "1"; }}>
                Request Early Access
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M 1 7 L 11 7 M 8 3 L 12 7 L 8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "12px 26px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "all 0.3s" }}
                onMouseEnter={e => { e.target.style.borderColor = "var(--border-glow-hover)"; e.target.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "var(--border-subtle)"; e.target.style.color = "var(--text-secondary)"; }}>
                See How It Works
              </a>
            </div>
          </div>
          <div style={{ animation: "fadeInUp 0.8s ease-out 0.3s both" }}><SchemaVisualization /></div>
        </div>
      </Container>
    </section>
  );
}

// ── Problem Statement ─────────────────────────────────────────────
function ProblemSection() {
  return (
    <Section id="problem">
      <Container>
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 60px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-blue)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>THE PROBLEM</span>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 18 }}>
            4,500 fields. Zero documentation.{" "}
            <span style={{ color: "var(--text-tertiary)" }}>Every tenant is different.</span>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            The Worker object alone contains 4,500+ fields across 9 relationship patterns.
            Your enterprise has added hundreds of custom fields that exist nowhere in Workday's standard model.
            Illuminate doesn't see them. Your consultants charge $250–400/hr to navigate them manually.
          </p>
        </div>
        <div className="stats-grid">
          {[
            { number: "4,500+", label: "Fields per Worker object", sub: "9 relationship patterns" },
            { number: "$250\u2013400", label: "Per hour", sub: "Big 4 Workday consultants" },
            { number: "0", label: "Illuminate custom field features", sub: "As of February 2026" },
            { number: "1.1B", label: "Rejected applications", sub: "Mobley v. Workday class action" },
          ].map(({ number, label, sub }) => (
            <div key={label} style={{ background: "var(--bg-secondary)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "var(--accent-blue)" }}>{number}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{sub}</span>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ── Interactive Demo ──────────────────────────────────────────────
function DemoVisual({ step, isActive }) {
  if (!isActive) return null;
  const shared = { width: "100%", minHeight: 200, borderRadius: 12, padding: 24, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: 12, animation: "fadeInUp 0.5s ease-out" };
  if (step.visual === "scan") {
    return (
      <div style={shared}>
        <div style={{ color: "var(--text-tertiary)", marginBottom: 16, fontSize: 10, letterSpacing: "0.08em" }}>$ argot scan --tenant acme_corp --mode discovery</div>
        {["DS_Worker_Core", "DS_Compensation", "DS_Talent_Mgmt", "DS_Recruiting", "DS_Benefits", "DS_Time_Track"].map((ds, i) => (
          <div key={ds} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, animation: `slideInRight 0.4s ease-out ${i * 0.15}s both` }}>
            <span style={{ color: "var(--accent-green)" }}>{"\u2713"}</span>
            <span style={{ color: "var(--text-secondary)" }}>{ds}</span>
            <span style={{ color: "var(--text-tertiary)", marginLeft: "auto" }}>{[387, 245, 312, 198, 276, 143][i]} fields</span>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "8px 12px", borderRadius: 6, background: "rgba(91,141,239,0.08)", border: "1px solid rgba(91,141,239,0.15)", color: "var(--accent-blue)", fontSize: 11 }}>
          {"\u26A1"} Scan complete: 16 data sources, 4,512 fields discovered in 87s
        </div>
      </div>
    );
  }
  if (step.visual === "detect") {
    return (
      <div style={shared}>
        <div style={{ color: "var(--text-tertiary)", marginBottom: 16, fontSize: 10, letterSpacing: "0.08em" }}>GHOST FIELD DETECTION — comparing expected vs actual schema</div>
        {[
          { field: "cf_equity_grant_v4", status: "GHOST", reason: "Field in HCIM but missing from API response" },
          { field: "cf_succession_tier", status: "GHOST", reason: "Domain security policy blocking ISU access" },
          { field: "cf_interview_score", status: "GHOST", reason: "Field exists in Extend but not exposed via WQL" },
        ].map((item, i) => (
          <div key={item.field} style={{ padding: "10px 14px", marginBottom: 8, borderRadius: 8, background: "rgba(239,91,91,0.04)", border: "1px solid rgba(239,91,91,0.12)", animation: `slideInRight 0.4s ease-out ${i * 0.2}s both` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "var(--accent-red)", fontSize: 11, fontWeight: 600 }}>{"\u{1F47B}"} {item.status}</span>
              <span style={{ color: "var(--accent-blue)" }}>{item.field}</span>
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{item.reason}</div>
          </div>
        ))}
      </div>
    );
  }
  if (step.visual === "infer") {
    return (
      <div style={shared}>
        <div style={{ color: "var(--text-tertiary)", marginBottom: 16, fontSize: 10, letterSpacing: "0.08em" }}>SEMANTIC INFERENCE — resolving undocumented custom fields</div>
        {[
          { raw: "cf_variable_comp_plan_c", result: "Variable Compensation Plan", method: "field_name + value_pattern", conf: 94 },
          { raw: "cf_custom_field_55", result: "Parking Spot Number", method: "value_pattern (alphanumeric codes)", conf: 76 },
          { raw: "cf_ee_term_rsn_v2", result: "Termination Reason", method: "field_name + domain_glossary", conf: 87 },
        ].map((item, i) => (
          <div key={item.raw} style={{ padding: "12px 14px", marginBottom: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", animation: `slideInRight 0.4s ease-out ${i * 0.2}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-tertiary)" }}>{item.raw}</span>
              <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>{item.conf}%</span>
            </div>
            <div style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: 4 }}>{"\u2192"} {item.result}</div>
            <div style={{ color: "var(--text-tertiary)", fontSize: 10 }}>Method: {item.method}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={shared}>
      <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
        <div style={{ color: "var(--text-tertiary)", fontSize: 10, marginBottom: 6, letterSpacing: "0.08em" }}>NATURAL LANGUAGE INPUT</div>
        <div style={{ color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 500 }}>"Show me all employees whose variable comp changed last quarter"</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: "block", margin: "0 auto 16px" }}><path d="M 10 2 L 10 14 M 6 10 L 10 15 L 14 10" stroke="var(--accent-blue)" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(91,141,239,0.06)", border: "1px solid rgba(91,141,239,0.15)" }}>
        <div style={{ color: "var(--accent-blue)", fontSize: 10, marginBottom: 6, letterSpacing: "0.08em" }}>GENERATED WQL</div>
        <div style={{ color: "var(--accent-cyan)", fontSize: 13 }}>SELECT cf_variable_comp_plan_c FROM DS_Compensation<br />WHERE effective_date &gt;= '2025-10-01'</div>
      </div>
      <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(239,91,91,0.06)", border: "1px solid rgba(239,91,91,0.12)", color: "var(--accent-amber)", fontSize: 11 }}>
        {"\u26A0\uFE0F"} HIGH BIAS RISK: Field relates to compensation. Human review recommended.
      </div>
    </div>
  );
}

function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveStep(prev => (prev + 1) % DEMO_STEPS.length), 6000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Section id="how-it-works">
      <Container>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 60px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-blue)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>HOW IT WORKS</span>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15 }}>Scan. Understand. Control.</h2>
        </div>
        <div className="hiw-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {DEMO_STEPS.map((step, i) => (
              <button key={step.phase} onClick={() => setActiveStep(i)} style={{
                background: i === activeStep ? "var(--bg-tertiary)" : "transparent",
                border: i === activeStep ? "1px solid var(--border-glow)" : "1px solid transparent",
                borderRadius: 12, padding: "18px 20px", textAlign: "left", cursor: "pointer", transition: "all 0.4s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: i === activeStep ? "var(--accent-blue)" : "var(--text-tertiary)", letterSpacing: "0.1em", transition: "color 0.4s" }}>{step.phase}</span>
                  {i === activeStep && <div style={{ height: 2, flex: 1, borderRadius: 1, background: "var(--border-subtle)", overflow: "hidden" }}><div style={{ height: "100%", background: "var(--accent-blue)", animation: "typewriter 6s linear", borderRadius: 1 }} /></div>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: i === activeStep ? "var(--text-primary)" : "var(--text-tertiary)", marginBottom: 4, transition: "color 0.4s" }}>{step.label}</div>
                {i === activeStep && <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, animation: "fadeInUp 0.4s ease-out" }}>{step.description}</div>}
              </button>
            ))}
          </div>
          <div>{DEMO_STEPS.map((step, i) => <DemoVisual key={step.phase} step={step} isActive={i === activeStep} />)}</div>
        </div>
      </Container>
    </Section>
  );
}

// ── Bento Features ────────────────────────────────────────────────
function BentoFeatures() {
  return (
    <Section id="features">
      <Container>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 60px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-blue)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>CAPABILITIES</span>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15 }}>Intelligence your Workday doesn't have.</h2>
        </div>
        <div className="bento-grid">
          {BENTO_FEATURES.map((feature) => (
            <div key={feature.title} className="glow-border" style={{
              gridColumn: feature.span === "wide" ? "span 2" : "span 1",
              background: "var(--bg-secondary)", padding: "32px 28px",
              display: "flex", flexDirection: "column", gap: 12, border: "none", transition: "background 0.4s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}>
              <span style={{ fontSize: 28 }}>{feature.icon}</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{feature.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)" }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ── Compliance ────────────────────────────────────────────────────
function ComplianceSection() {
  return (
    <Section id="compliance">
      <Container>
        <div className="compliance-grid">
          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-blue)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>COMPLIANCE</span>
            <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 18 }}>
              EU AI Act ready. <span style={{ color: "var(--text-tertiary)" }}>From day one.</span>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 28 }}>
              The EU AI Act classifies HR AI as high-risk, with full obligations taking effect August 2026.
              Argot builds compliance into the architecture — not as an afterthought, but as a core design principle.
            </p>
            {[
              { title: "Bias Detection", desc: "Every field classified by risk level: compensation, hiring, termination, performance. Automated flags before any data modification." },
              { title: "Human-in-the-Loop", desc: "High-risk operations with low confidence are blocked until a human reviewer approves with documented justification." },
              { title: "Full Audit Trail", desc: "Every translation, every action, every decision logged with timestamp, identity, and complete reasoning chain." },
              { title: "Explainability", desc: "Every NL\u2192WQL translation shows its full reasoning — which fields matched, why, what alternatives were considered." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2, background: "var(--accent-blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M 2 6 L 5 9 L 10 3" stroke="var(--accent-blue)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="glow-border" style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: 28, overflow: "hidden" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginBottom: 20, letterSpacing: "0.08em" }}>COMPLIANCE DASHBOARD — REAL-TIME MONITORING</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "High Risk Fields", count: 23, color: "var(--accent-red)" },
                { label: "HITL Pending", count: 2, color: "var(--accent-amber)" },
                { label: "Audit Entries", count: "1,247", color: "var(--accent-green)" },
              ].map(item => (
                <div key={item.label} style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: item.color }}>{item.count}</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginBottom: 10, letterSpacing: "0.06em" }}>RECENT AUDIT LOG</div>
            {[
              { time: "14:32:07", user: "j.chen", action: "translate", field: "cf_salary_band", result: "success", risk: "\u26A0 HIGH" },
              { time: "14:31:45", user: "s.patel", action: "hitl_approval", field: "cf_term_reason", result: "approved", risk: "\u2713 CLEARED" },
              { time: "14:30:22", user: "m.jones", action: "simulate", field: "cf_promo_elig", result: "success", risk: "\u2014 MEDIUM" },
            ].map(entry => (
              <div key={entry.time} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", marginBottom: 4, borderRadius: 6, background: "rgba(255,255,255,0.015)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <span style={{ color: "var(--text-tertiary)", width: 60 }}>{entry.time}</span>
                <span style={{ color: "var(--accent-blue)", width: 55 }}>{entry.user}</span>
                <span style={{ color: "var(--text-secondary)", flex: 1 }}>{entry.action}</span>
                <span style={{ color: entry.risk.includes("HIGH") ? "var(--accent-red)" : entry.risk.includes("MEDIUM") ? "var(--accent-amber)" : "var(--accent-green)", fontSize: 10, fontWeight: 600 }}>{entry.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── Early Access ──────────────────────────────────────────────────
function EarlyAccess() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!email || !company) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://formspree.io/f/xgolyzay", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, company, role }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.errors?.[0]?.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [email, company, role]);
  return (
    <Section id="early-access">
      <Container>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-blue)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>EARLY ACCESS</span>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16 }}>Join the first wave.</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 40 }}>
            We're onboarding a small group of design partners — enterprises running customized Workday tenants
            who want AI that actually understands their configuration.
          </p>
          {submitted ? (
            <div style={{ padding: "28px 32px", borderRadius: 14, background: "rgba(78,205,196,0.06)", border: "1px solid rgba(78,205,196,0.2)", animation: "fadeInUp 0.5s ease-out" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{"\u2713"}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>You're on the list.</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>We'll reach out within 48 hours to discuss your Workday environment.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, margin: "0 auto" }}>
              {[
                { placeholder: "Work email", value: email, onChange: setEmail, type: "email", name: "email" },
                { placeholder: "Company", value: company, onChange: setCompany, type: "text", name: "company" },
                { placeholder: "Role (optional)", value: role, onChange: setRole, type: "text", name: "role" },
              ].map(field => (
                <input key={field.placeholder} type={field.type} name={field.name} placeholder={field.placeholder} value={field.value}
                  onChange={e => field.onChange(e.target.value)} required={field.name !== "role"}
                  style={{ width: "100%", padding: "13px 18px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", transition: "border-color 0.3s" }}
                  onFocus={e => e.target.style.borderColor = "var(--border-glow-hover)"}
                  onBlur={e => e.target.style.borderColor = "var(--border-subtle)"} />
              ))}
              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,91,91,0.08)", border: "1px solid rgba(239,91,91,0.2)", color: "var(--accent-red)", fontSize: 13, textAlign: "left" }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 10, background: loading ? "var(--text-tertiary)" : "var(--text-primary)", color: "var(--bg-primary)", fontSize: 14, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s, transform 0.2s", fontFamily: "var(--font-sans)", opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!loading) { e.target.style.opacity = "0.9"; e.target.style.transform = "translateY(-1px)"; } }}
                onMouseLeave={e => { e.target.style.opacity = loading ? "0.7" : "1"; e.target.style.transform = "translateY(0)"; }}>
                {loading ? "Submitting\u2026" : "Request Early Access"}
              </button>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Read-only connection. No data leaves your tenant. SOC 2 Type II in progress.</p>
            </form>
          )}
        </div>
      </Container>
    </Section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "40px 24px", borderTop: "1px solid var(--border-subtle)" }}>
      <Container><div className="footer-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", fontFamily: "var(--font-mono)" }}>A</div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>ARGOT LAYER</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{"\u00A9"} 2026 Argot Layer. The semantic translation layer for Workday HCM.</div>
      </div></Container>
    </footer>
  );
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <PasswordGate>
      <div className="noise-overlay">
        <style>{css}</style>
        <Nav />
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <BentoFeatures />
        <ComplianceSection />
        <EarlyAccess />
        <Footer />
        <Analytics />
      </div>
    </PasswordGate>
  );
}
