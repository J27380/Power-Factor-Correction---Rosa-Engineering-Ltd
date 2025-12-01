import React, { useState, useMemo, useEffect } from "react";

/* -------------------------------------------------------
   MathJax SVG renderer (waits for MathJax to load)
------------------------------------------------------- */
function MJ({ tex }) {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function renderWhenReady() {
      if (
        typeof window !== "undefined" &&
        window.MathJax &&
        typeof window.MathJax.tex2svg === "function"
      ) {
        try {
          const svg = window.MathJax.tex2svg(tex);
          if (!cancelled) setHtml(svg.outerHTML);
        } catch (err) {
          console.warn("MathJax render error:", err);
        }
      } else {
        setTimeout(renderWhenReady, 50);
      }
    }

    renderWhenReady();

    return () => {
      cancelled = true;
    };
  }, [tex]);

  if (html) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div style={{ opacity: 0.6, fontFamily: "monospace" }}>{tex}</div>
  );
}

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */
const FREQ = 50;
const OMEGA = 2 * Math.PI * FREQ;
const V_RMS = 230;
const V_PEAK = V_RMS * Math.sqrt(2);

/* -------------------------------------------------------
   Styling
------------------------------------------------------- */
const basePageStyle = {
  fontFamily:
    "'Segoe UI', Roboto, system-ui, -apple-system, 'Helvetica Neue', Arial",
  minHeight: "100vh",
  padding: 22,
  transition: "background 0.25s ease, color 0.25s ease",
};

/* -------------------------------------------------------
   Rosa Logo (PNG switcher)
------------------------------------------------------- */
function RosaLogo({ size = 56, darkMode }) {
  const src = darkMode
    ? "/Rosa icon white.png"
    : "/Rosa icon blue.png";

  return (
    <img
      src={src}
      alt="Rosa Engineering"
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

/* -------------------------------------------------------
   Waveform SVG
------------------------------------------------------- */
function WaveformSVG({ t, v, i, p, darkMode }) {
  const width = 640;
  const height = 240;
  const margin = 16;

  const maxV = Math.max(...v.map(Math.abs), 1);
  const maxI = Math.max(...i.map(Math.abs), 1);
  const maxP = Math.max(...p.map(Math.abs), 1);

  const scaleX = (time) =>
    margin + (time / (1 / FREQ)) * (width - margin * 2);
  const zero = height / 2;

  const scaleV = (val) => zero - (val / maxV) * (height * 0.3);
  const scaleI = (val) => zero - (val / maxI) * (height * 0.22);
  const scaleP = (val) => zero - (val / maxP) * (height * 0.4);

  const buildPath = (arr, scaler) =>
    arr
      .map(
        (val, idx) =>
          `${idx === 0 ? "M" : "L"}${scaleX(t[idx])},${scaler(val)}`
      )
      .join(" ");

  const vPath = buildPath(v, scaleV);
  const iPath = buildPath(i, scaleI);
  const pPath = buildPath(p, scaleP);

  const polys = [];
  for (let idx = 1; idx < p.length; idx++) {
    const x1 = scaleX(t[idx - 1]);
    const x2 = scaleX(t[idx]);
    const y0 = scaleP(0);
    const y1 = scaleP(p[idx - 1]);
    const y2 = scaleP(p[idx]);
    const color =
      p[idx] >= 0
        ? "rgba(250,204,21,0.45)"
        : "rgba(239,68,68,0.20)";

    polys.push({
      points: `${x1},${y0} ${x2},${y0} ${x2},${y2} ${x1},${y1}`,
      color,
    });
  }

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <rect
        width={width}
        height={height}
        fill={darkMode ? "#0f172a" : "#ffffff"}
      />
      <line
        x1={margin}
        y1={zero}
        x2={width - margin}
        y2={zero}
        stroke={darkMode ? "#1e293b" : "#e6eef6"}
        strokeWidth={1}
      />

      {polys.map((poly, i) => (
        <polygon
          key={i}
          points={poly.points}
          fill={poly.color}
          stroke="none"
        />
      ))}

      <path
        d={vPath}
        fill="none"
        stroke={darkMode ? "#e2e8f0" : "#0f172a"}
        strokeWidth={2}
      />
      <path d={iPath} fill="none" stroke="#0b72a0" strokeWidth={2} />
      <path
        d={pPath}
        fill="none"
        stroke="#facc15"
        strokeWidth={1.25}
      />

      {/* Legend */}
      <g transform={`translate(${width - 200}, 12)`}>
        <rect
          x={0}
          y={0}
          rx={6}
          ry={6}
          width={182}
          height={58}
          fill={darkMode ? "#020617" : "#ffffff"}
          stroke={darkMode ? "#1e293b" : "#e6eef6"}
        />
        <line
          x1={10}
          y1={18}
          x2={30}
          y2={18}
          stroke={darkMode ? "#e2e8f0" : "#0f172a"}
          strokeWidth={2}
        />
        <text
          x={36}
          y={22}
          fontSize={12}
          fill={darkMode ? "#e2e8f0" : "#0f172a"}
        >
          Voltage
        </text>
        <line
          x1={10}
          y1={36}
          x2={30}
          y2={36}
          stroke="#0b72a0"
          strokeWidth={2}
        />
        <text
          x={36}
          y={40}
          fontSize={12}
          fill={darkMode ? "#e2e8f0" : "#0f172a"}
        >
          Current
        </text>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------
   Power Triangle SVG
------------------------------------------------------- */
function PowerTriangleSVG({ P, Q, S, darkMode }) {
  const size = 220;
  const pad = 14;
  const base = size - pad * 2;

  const absP = Math.abs(P);
  const absQ = Math.abs(Q);
  const absS = Math.max(Math.abs(S), 1e-9);

  const scale = base / absS;
  const adj = absP * scale;
  const opp = absQ * scale;

  const Ox = pad;
  const Oy = size - pad;
  const Ax = Ox + adj;
  const Ay = Oy;
  const Bx = Ax;
  const By = Oy - opp;

  return (
    <svg width={size} height={size}>
      <rect
        width={size}
        height={size}
        fill={darkMode ? "#0f172a" : "#ffffff"}
      />

      <line
        x1={Ox}
        y1={Oy}
        x2={Ax}
        y2={Ay}
        stroke={darkMode ? "#e2e8f0" : "#0f172a"}
        strokeWidth={2}
      />
      <line
        x1={Ax}
        y1={Ay}
        x2={Bx}
        y2={By}
        stroke="#0b72a0"
        strokeWidth={2}
      />
      <line
        x1={Ox}
        y1={Oy}
        x2={Bx}
        y2={By}
        stroke="#facc15"
        strokeWidth={2}
      />

      <rect
        x={Ax - 10}
        y={Ay - 10}
        width={10}
        height={10}
        fill={darkMode ? "#1e293b" : "#e6eef6"}
      />

      <text
        x={Ox + adj / 2 - 12}
        y={Oy - 6}
        fontSize={12}
        fill={darkMode ? "#e2e8f0" : "#0f172a"}
      >
        {`${absP.toFixed(1)} W`}
      </text>
      <text
        x={Ax + 6}
        y={By + opp / 2 + 4}
        fontSize={12}
        fill={darkMode ? "#e2e8f0" : "#0f172a"}
      >
        {`${absQ.toFixed(1)} VAR`}
      </text>
      <text
        x={Ox + (Bx - Ox) / 2 - 8}
        y={Oy + (By - Oy) / 2 - 6}
        fontSize={12}
        fill={darkMode ? "#e2e8f0" : "#0f172a"}
      >
        {`${absS.toFixed(1)} VA`}
      </text>
    </svg>
  );
}

/* -------------------------------------------------------
   Main App
------------------------------------------------------- */
export default function App() {
  const [R, setR] = useState(100);
  const [L_mH, setL_mH] = useState(200);
  const [Ccorr_uF, setCcorr_uF] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [showEq, setShowEq] = useState(false);

  /* Precompute time & voltage waveform */
  const { t, vWave } = useMemo(() => {
    const samples = 600;
    const tLocal = Array.from(
      { length: samples },
      (_, i) => (i / samples) * (1 / FREQ)
    );
    const vLocal = tLocal.map((tt) => V_PEAK * Math.sin(OMEGA * tt));
    return { t: tLocal, vWave: vLocal };
  }, []);

  /* Electrical calculation */
  const metrics = useMemo(() => {
    const L = L_mH / 1000;
    const XL = OMEGA * L;
    const C_F = Ccorr_uF * 1e-6;

    const denom = R * R + XL * XL || 1e-12;
    const Yload_re = R / denom;
    const Yload_im = -XL / denom;
    const Ycap_im = OMEGA * C_F;

    const Ytot_re = Yload_re;
    const Ytot_im = Yload_im + Ycap_im;

    const Ymag =
      Math.sqrt(Ytot_re * Ytot_re + Ytot_im * Ytot_im) || 1e-12;
    const Irms = V_RMS * Ymag;

    const Vrms = V_RMS;
    const apparentS = Vrms * Irms;
    const realP = apparentS * (Ytot_re / Ymag);
    const reactiveQ = apparentS * (Ytot_im / Ymag);

    return {
      Vrms,
      Irms,
      realP,
      reactiveQ,
      apparentS,
      Yload_re,
      Yload_im,
      Ycap_im,
      powerFactor: realP / (apparentS || 1e-12),
    };
  }, [R, L_mH, Ccorr_uF]);

  /* Waves */
  const phi = Math.atan2(metrics.reactiveQ, metrics.realP);
  const Ipeak = metrics.Irms * Math.sqrt(2);
  const iWave = t.map((tt) =>
    Ipeak * Math.sin(OMEGA * tt - phi)
  );
  const pWave = vWave.map((v, idx) => v * iWave[idx]);

  /* Auto PF correction */
  function computeRequiredC_forUnityPF() {
    const XL = OMEGA * (L_mH / 1000);
    const denom = R * R + XL * XL || 1e-12;
    const Yload_im = -XL / denom;
    const neededY = -Yload_im;
    const result = (neededY / OMEGA) * 1e6;
    return result < 0 || !isFinite(result) ? 0 : result;
  }

  const suggestedMaxC = Math.max(
    100,
    Math.min(20000, computeRequiredC_forUnityPF() * 1.2)
  );

  const fmt = (n, d = 3) => Number(n).toFixed(d);

  /* Theming */
  const pageStyle = {
    ...basePageStyle,
    background: darkMode ? "#0f172a" : "#ffffff",
    color: darkMode ? "#e2e8f0" : "#0f172a",
  };

  const cardThemed = {
    background: darkMode ? "#1e293b" : "#ffffff",
    border: darkMode ? "1px solid #334155" : "1px solid #e6eef6",
    borderRadius: 10,
    padding: 14,
    boxShadow: darkMode
      ? "0 1px 2px rgba(0,0,0,0.25)"
      : "0 1px 4px rgba(16,24,40,0.03)",
  };

  const panelTitleStyle = {
    margin: 0,
    fontSize: 14,
    color: darkMode ? "#38bdf8" : "#07445f",
  };

  const panelTitleUnderline = {
    borderBottom: `3px solid ${darkMode ? "#38bdf8" : "#0b72a0"}`,
    paddingBottom: 6,
  };

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <RosaLogo size={56} darkMode={darkMode} />

        <div>
          <div style={{ fontSize: 26, fontWeight: 300 }}>
            Rosa Engineering Ltd — Power Factor Correction
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Electrical Fundamentals • Training Tool
          </div>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: "#0b72a0",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </header>

      {/* GRID LAYOUT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(280px, 340px) minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* LOAD CONTROLS */}
          <div style={cardThemed}>
            <h3 style={panelTitleStyle}>
              <span style={panelTitleUnderline}>Load</span>
            </h3>

            <label style={{ fontSize: 13 }}>
              Resistance R (Ω): <strong>{R}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={500}
              value={R}
              onChange={(e) => setR(Number(e.target.value))}
              style={{ width: "100%" }}
            />

            <label style={{ fontSize: 13, marginTop: 8 }}>
              Inductance L (mH): <strong>{L_mH}</strong>
            </label>
            <input
              type="range"
              min={0}
              max={2000}
              value={L_mH}
              onChange={(e) => setL_mH(Number(e.target.value))}
              style={{ width: "100%" }}
            />

            <h4 style={{ marginTop: 10, marginBottom: 4, fontSize: 13 }}>
              Correction capacitor (shunt)
            </h4>

            <label style={{ fontSize: 13 }}>
              Ccorr (µF): <strong>{Ccorr_uF}</strong>
            </label>

            <input
              type="range"
              min={0}
              max={suggestedMaxC}
              step={0.1}
              value={Ccorr_uF}
              onChange={(e) => setCcorr_uF(Number(e.target.value))}
              style={{ width: "100%" }}
            />

            <button
              onClick={() =>
                setCcorr_uF(
                  Number(computeRequiredC_forUnityPF().toFixed(3))
                )
              }
              style={{
                marginTop: 8,
                background: "#0b72a0",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Auto-calc C for unity PF
            </button>
          </div>

          {/* METRICS */}
          <div style={cardThemed}>
            <h3 style={panelTitleStyle}>
              <span style={panelTitleUnderline}>Metrics</span>
            </h3>

            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div>
                Vrms: <strong>{fmt(metrics.Vrms, 2)} V</strong>
              </div>
              <div>
                Irms: <strong>{fmt(metrics.Irms, 3)} A</strong>
              </div>
              <div>
                Apparent S:{" "}
                <strong>{fmt(metrics.apparentS, 2)} VA</strong>
              </div>
              <div>
                Real P: <strong>{fmt(metrics.realP, 2)} W</strong>
              </div>
              <div>
                Reactive Q:{" "}
                <strong>{fmt(metrics.reactiveQ, 2)} VAR</strong>
              </div>
              <div>
                Power factor:{" "}
                <strong>{fmt(metrics.powerFactor, 3)}</strong>
              </div>
              <div>
                Admittance (load):{" "}
                <strong>
                  {fmt(metrics.Yload_re, 4)} + j
                  {fmt(metrics.Yload_im, 4)} S
                </strong>
              </div>
              <div>
                Capacitor admittance:{" "}
                <strong>j{fmt(metrics.Ycap_im, 6)} S</strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* WAVEFORMS */}
          <div style={cardThemed}>
            <h3 style={panelTitleStyle}>
              <span style={panelTitleUnderline}>Waveforms (50 Hz)</span>
            </h3>
            <WaveformSVG
              t={t}
              v={vWave}
              i={iWave}
              p={pWave}
              darkMode={darkMode}
            />
          </div>

          {/* POWER TRIANGLE */}
          <div style={cardThemed}>
            <h3 style={panelTitleStyle}>
              <span style={panelTitleUnderline}>AC Power Triangle</span>
            </h3>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <PowerTriangleSVG
                P={metrics.realP}
                Q={metrics.reactiveQ}
                S={metrics.apparentS}
                darkMode={darkMode}
              />

              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <div>
                  P: <strong>{fmt(metrics.realP, 2)} W</strong>
                </div>
                <div>
                  Q: <strong>{fmt(metrics.reactiveQ, 2)} VAR</strong>
                </div>
                <div>
                  S: <strong>{fmt(metrics.apparentS, 2)} VA</strong>
                </div>
                <div>
                  PF: <strong>{fmt(metrics.powerFactor, 3)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EQUATIONS */}
      <div
        style={{
          ...cardThemed,
          marginTop: 20,
          padding: "18px 22px",
          textAlign: "center",
        }}
      >
        <button
          onClick={() => setShowEq(!showEq)}
          style={{
            background: "#0b72a0",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {showEq ? "Hide key equations" : "Show key equations"}
        </button>

        {showEq && (
          <div
            style={{
              opacity: 1,
              transition: "opacity 0.25s ease",
            }}
          >
            <h3
              style={{
                ...panelTitleStyle,
                marginBottom: 12,
                color: darkMode ? "#bae6fd" : "#07445f",
              }}
            >
              <span
                style={{
                  ...panelTitleUnderline,
                  paddingBottom: 4,
                }}
              >
                Key Equations
              </span>
            </h3>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                margin: "0 auto",
                maxWidth: "900px",
                background: darkMode ? "#020617" : "#f8fafc",
                borderRadius: 8,
                padding: "18px 22px",
              }}
            >
              <MJ tex={`PF = \\frac{P}{|S|} = \\cos(\\varphi)`} />
              <MJ tex={`Z = R + jX`} />
              <MJ tex={`|Z| = \\sqrt{R^2 + X^2}`} />
              <MJ tex={`X_L = \\omega L`} />
              <MJ tex={`X_C = \\frac{1}{\\omega C}`} />
              <MJ tex={`S = P + jQ`} />
              <MJ tex={`|S| = V \\cdot I`} />
              <MJ tex={`Y = \\frac{1}{Z} = G + jB`} />
              <MJ tex={`\\mathrm{Im}(Y_{\\mathrm{total}}) = 0 \\Rightarrow \\omega C = -\\mathrm{Im}(Y_{\\mathrm{load}})`} />
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 22,
          fontSize: 12,
          opacity: 0.7,
          textAlign: "center",
        }}
      >
        Rosa Engineering Ltd © {new Date().getFullYear()} — Engineering
        Solutions
      </footer>
    </div>
  );
}
