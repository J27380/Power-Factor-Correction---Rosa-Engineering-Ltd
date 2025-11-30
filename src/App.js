import React, { useState, useMemo, useRef } from "react";
import { MathJax, MathJaxContext } from "react-mathjax-next";


// ------------------------
// Configuration & constants
// ------------------------
const FREQ = 50;
const OMEGA = 2 * Math.PI * FREQ;
const V_RMS = 230;
const V_PEAK = V_RMS * Math.sqrt(2);

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg"] },
};

// ------------------------
// Base presentational styles
// ------------------------
const basePageStyle = {
  fontFamily:
    "'Segoe UI', Roboto, system-ui, -apple-system, 'Helvetica Neue', Arial",
  minHeight: "100vh",
  padding: 22,
  transition: "background 0.25s ease, color 0.25s ease",
};

const headerShellStyle = {
  borderRadius: 12,
  padding: 14,
  marginBottom: 18,
  border: "1px solid #d7e2f0",
  boxShadow: "0 1px 5px rgba(15,23,42,0.04)",
  transition: "background 0.25s ease, border-color 0.25s ease",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: 0.2,
};

const subtitleStyle = {
  fontSize: 12,
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: 18,
  alignItems: "start",
};

const columnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const cardStyle = {
  borderRadius: 10,
  padding: 14,
  border: "1px solid #e1e8f1",
  boxShadow: "0 1px 4px rgba(15,23,42,0.03)",
  transition:
    "background 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
};

const panelTitleStyle = {
  margin: 0,
  fontSize: 13,
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const panelTitleUnderline = {
  borderBottom: "3px solid #0b72a0",
  paddingBottom: 4,
  display: "inline-block",
};

const labelRowStyle = {
  fontSize: 13,
  marginTop: 6,
};

const rangeTrackLabelStyle = {
  fontSize: 11,
  display: "flex",
  justifyContent: "space-between",
};

const metricLineStyle = {
  fontSize: 13,
  lineHeight: 1.45,
};

// ------------------------
// ROSA logo — traced polygon version
// ------------------------
function RosaLogo({ width = 56, height = 56 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1430 1091"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <polygon points="230,84 715,1059 978,531" fill="#0b72a0" />
      <polygon points="1214,65 731,315 1006,480" fill="#0b72a0" />
      <polygon points="142,44 2,599 667,1089" fill="#0b72a0" />
      <polygon points="1289,41 767,1083 1427,599" fill="#0b72a0" />
      <polygon points="208,0 669,277 1215,0" fill="#0b72a0" />
    </svg>
  );
}

// ------------------------
// Waveform SVG — axes, grid & shaded power
// ------------------------
function WaveformSVG({ t, v, i, p, svgRef, darkMode }) {
  const width = 640;
  const height = 240;
  const marginLeft = 40;
  const marginRight = 20;
  const marginTop = 18;
  const marginBottom = 28;

  const maxV = Math.max(...v.map(Math.abs), 1);
  const maxI = Math.max(...i.map(Math.abs), 1);
  const maxP = Math.max(...p.map(Math.abs), 1);

  const T = 1 / FREQ;

  const scaleX = (time) =>
    marginLeft + (time / T) * (width - marginLeft - marginRight);

  const zero = height / 2;
  const scaleV = (val) => zero - (val / maxV) * (height * 0.3);
  const scaleI = (val) => zero - (val / maxI) * (height * 0.22);
  const scaleP = (val) => zero - (val / maxP) * (height * 0.4);

  const buildPath = (arr, scaler) =>
    arr
      .map((val, idx) =>
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
    const points = `${x1},${y0} ${x2},${y0} ${x2},${y2} ${x1},${y1}`;
    polys.push({ points, color });
  }

  const gridTimes = [0, 0.25 * T, 0.5 * T, 0.75 * T, T];

  const bg = darkMode ? "#020617" : "#ffffff";
  const gridColor = darkMode ? "#1e293b" : "#e5edf5";
  const axisColor = darkMode ? "#475569" : "#e2e8f0";
  const timeAxisColor = darkMode ? "#475569" : "#cbd5e1";
  const textColor = darkMode ? "#cbd5f5" : "#64748b";

  const vColor = darkMode ? "#e5e7eb" : "#0f172a";
  const iColor = darkMode ? "#38bdf8" : "#0b72a0";
  const pColor = "#facc15";

  return (
    <svg ref={svgRef} width={width} height={height} style={{ display: "block" }}>
      <rect x={0} y={0} width={width} height={height} rx={8} fill={bg} />

      {gridTimes.map((tt, idx) => {
        const x = scaleX(tt);
        return (
          <line
            key={idx}
            x1={x}
            y1={marginTop}
            x2={x}
            y2={height - marginBottom}
            stroke={gridColor}
            strokeWidth={1}
            strokeDasharray={
              idx === 0 || idx === gridTimes.length - 1 ? "4 4" : "2 4"
            }
          />
        );
      })}

      <line
        x1={marginLeft}
        y1={scaleP(0)}
        x2={width - marginRight}
        y2={scaleP(0)}
        stroke={axisColor}
        strokeWidth={1}
      />

      {polys.map((poly, i) => (
        <polygon key={i} points={poly.points} fill={poly.color} stroke="none" />
      ))}

      <path d={vPath} fill="none" stroke={vColor} strokeWidth={2} />
      <path d={iPath} fill="none" stroke={iColor} strokeWidth={2} />
      <path d={pPath} fill="none" stroke={pColor} strokeWidth={1.25} />

      <line
        x1={marginLeft}
        y1={height - marginBottom}
        x2={width - marginRight}
        y2={height - marginBottom}
        stroke={timeAxisColor}
        strokeWidth={1}
      />
      <text
        x={(marginLeft + width - marginRight) / 2}
        y={height - 8}
        fontSize={11}
        textAnchor="middle"
        fill={textColor}
      >
        Time over one cycle (20 ms @ 50 Hz)
      </text>

      <g transform={`translate(${width - 220}, 14)`}>
        <rect
          width={205}
          height={64}
          rx={6}
          fill={bg}
          stroke={gridColor}
        />
        <line x1={10} y1={18} x2={30} y2={18} stroke={vColor} strokeWidth={2} />
        <text x={36} y={22} fontSize={12} fill={textColor}>
          Voltage v(t)
        </text>

        <line x1={10} y1={36} x2={30} y2={36} stroke={iColor} strokeWidth={2} />
        <text x={36} y={40} fontSize={12} fill={textColor}>
          Current i(t)
        </text>

        <line x1={10} y1={54} x2={30} y2={54} stroke={pColor} strokeWidth={1.5} />
        <text x={36} y={58} fontSize={12} fill={textColor}>
          Instantaneous power p(t)
        </text>
      </g>
    </svg>
  );
}

// ------------------------
// Power triangle SVG
// ------------------------
function PowerTriangleSVG({ P, Q, S, phiDeg, svgRef, darkMode }) {
  const size = 220;
  const pad = 18;
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

  const bg = darkMode ? "#020617" : "#ffffff";
  const pColor = darkMode ? "#e5e7eb" : "#0f172a";
  const qColor = darkMode ? "#38bdf8" : "#0b72a0";
  const sColor = "#facc15";
  const textMain = darkMode ? "#e5e7eb" : "#0f172a";
  const textSoft = darkMode ? "#94a3b8" : "#64748b";

  return (
    <svg ref={svgRef} width={size} height={size}>
      <rect width={size} height={size} rx={8} fill={bg} />

      <line x1={Ox} y1={Oy} x2={Ax} y2={Ay} stroke={pColor} strokeWidth={2} />
      <line x1={Ax} y1={Ay} x2={Bx} y2={By} stroke={qColor} strokeWidth={2} />
      <line x1={Ox} y1={Oy} x2={Bx} y2={By} stroke={sColor} strokeWidth={2} />

      <rect x={Ax - 10} y={Ay - 10} width={10} height={10} fill="#1e293b" />

      <text
        x={Ox + adj / 2}
        y={Oy - 6}
        fontSize={12}
        textAnchor="middle"
        fill={textMain}
      >
        {`${absP.toFixed(1)} W`}
      </text>
      <text x={Ax + 6} y={By + opp / 2} fontSize={12} fill={qColor}>
        {`${absQ.toFixed(1)} VAR`}
      </text>
      <text
        x={Ox + (Bx - Ox) / 2}
        y={Oy + (By - Oy) / 2 - 6}
        fontSize={12}
        fill={sColor}
      >
        {`${absS.toFixed(1)} VA`}
      </text>

      <text x={Ox + 6} y={Oy - 18} fontSize={11} fill={textSoft}>
        φ ≈ {phiDeg.toFixed(1)}°
      </text>
    </svg>
  );
}

// ------------------------
// Phasor diagram SVG — V reference, I at angle φ
// ------------------------
function PhasorSVG({ Vrms, Irms, phiDeg, svgRef, darkMode }) {
  const size = 260;
  const pad = 30;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - pad;

  const maxMag = Math.max(Vrms, Irms, 1);
  const vLen = (Vrms / maxMag) * radius;
  const iLen = (Irms / maxMag) * radius;

  // Take current angle as -phi (lagging positive φ => current lags voltage)
  const phiRad = (phiDeg * Math.PI) / 180;
  const iAngle = -phiRad;

  const vEnd = { x: cx + vLen, y: cy };
  const iEnd = {
    x: cx + iLen * Math.cos(iAngle),
    y: cy + iLen * Math.sin(iAngle),
  };

  const bg = darkMode ? "#020617" : "#ffffff";
  const axisColor = darkMode ? "#1f2937" : "#e5e7eb";
  const vColor = darkMode ? "#e5e7eb" : "#0f172a";
  const iColor = darkMode ? "#38bdf8" : "#0b72a0";
  const textColor = darkMode ? "#cbd5f5" : "#0f172a";
  const softText = darkMode ? "#94a3b8" : "#64748b";

  function arrow(g, from, to, color) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const headLen = 10;
    const x1 = to.x - headLen * Math.cos(angle - Math.PI / 6);
    const y1 = to.y - headLen * Math.sin(angle - Math.PI / 6);
    const x2 = to.x - headLen * Math.cos(angle + Math.PI / 6);
    const y2 = to.y - headLen * Math.sin(angle + Math.PI / 6);

    return (
      <g stroke={color} fill={color}>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={2} />
        <polygon points={`${to.x},${to.y} ${x1},${y1} ${x2},${y2}`} />
      </g>
    );
  }

  return (
    <svg ref={svgRef} width={size} height={size}>
      <rect width={size} height={size} rx={8} fill={bg} />

      {/* axes */}
      <line x1={cx} y1={pad} x2={cx} y2={size - pad} stroke={axisColor} />
      <line x1={pad} y1={cy} x2={size - pad} y2={cy} stroke={axisColor} />

      {/* arrows */}
      {arrow(
        null,
        { x: cx, y: cy },
        vEnd,
        vColor
      )}
      {arrow(
        null,
        { x: cx, y: cy },
        iEnd,
        iColor
      )}

      {/* labels */}
      <text
        x={vEnd.x + 6}
        y={vEnd.y - 4}
        fontSize={12}
        fill={vColor}
      >
        V
      </text>
      <text
        x={iEnd.x + 4}
        y={iEnd.y + 12}
        fontSize={12}
        fill={iColor}
      >
        I
      </text>

      <text
        x={cx}
        y={size - 8}
        fontSize={11}
        textAnchor="middle"
        fill={softText}
      >
        Phasor diagram (reference V, I at φ)
      </text>

      <text
        x={cx}
        y={18}
        fontSize={11}
        textAnchor="middle"
        fill={textColor}
      >
        φ ≈ {phiDeg.toFixed(1)}°
      </text>
    </svg>
  );
}

// ------------------------
// Main App
// ------------------------
export default function App() {
  const [R, setR] = useState(100);
  const [L_mH, setL_mH] = useState(200);
  const [Ccorr_uF, setCcorr_uF] = useState(0);
  const [showEq, setShowEq] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Refs for export
  const waveformRef = useRef(null);
  const triangleRef = useRef(null);
  const phasorRef = useRef(null);

  const metrics = useMemo(() => {
    const L = L_mH / 1000;
    const XL = OMEGA * L;
    const C_F = Ccorr_uF * 1e-6;

    const denom = R * R + XL * XL;
    const Yload_re = R / (denom || 1e-12);
    const Yload_im = -XL / (denom || 1e-12);
    const Ycap_im = OMEGA * C_F;

    const Ytot_re = Yload_re;
    const Ytot_im = Yload_im + Ycap_im;

    const Ymag = Math.sqrt(Ytot_re * Ytot_re + Ytot_im * Ytot_im) || 1e-12;
    const Irms = V_RMS * Ymag;

    const apparentS = V_RMS * Irms;
    const realP = apparentS * (Ytot_re / Ymag);
    const reactiveQ = apparentS * (Ytot_im / Ymag);

    const powerFactor = realP / (apparentS || 1e-12);
    const phi = Math.atan2(reactiveQ, realP || 1e-12);
    const phiDeg = (phi * 180) / Math.PI;
    const Zmag = Irms > 0 ? V_RMS / Irms : 0;

    let pfType = "unity";
    if (Math.abs(powerFactor) < 0.999) {
      pfType = reactiveQ < 0 ? "lagging (inductive)" : "leading (capacitive)";
    }

    return {
      Vrms: V_RMS,
      Irms,
      realP,
      reactiveQ,
      apparentS,
      Yload_re,
      Yload_im,
      Ycap_im,
      powerFactor,
      phiDeg,
      Zmag,
      pfType,
    };
  }, [R, L_mH, Ccorr_uF]);

  const samples = 600;
  const t = Array.from({ length: samples }, (_, i) => (i / samples) * (1 / FREQ));
  const vWave = t.map((tt) => V_PEAK * Math.sin(OMEGA * tt));
  const phiRad = (metrics.phiDeg * Math.PI) / 180;
  const Ipeak = metrics.Irms * Math.sqrt(2);
  const iWave = t.map((tt) => Ipeak * Math.sin(OMEGA * tt - phiRad));
  const pWave = vWave.map((v, idx) => v * iWave[idx]);

  function computeRequiredC_forUnityPF() {
    const L = L_mH / 1000;
    const XL = OMEGA * L;
    const denom = R * R + XL * XL || 1e-12;
    const Yload_im = -XL / denom;
    const neededY = -Yload_im;
    const result = (neededY / OMEGA) * 1e6;
    if (!isFinite(result) || result < 0) return 0;
    return result;
  }

  const unityC = computeRequiredC_forUnityPF();
  const suggestedMaxC = Math.max(
    100,
    Math.min(20000, Math.round((unityC || 100) * 1.5))
  );

  const fmt = (n, d = 3) => Number(n).toFixed(d);

  // Canvas export of SVGs → PNG
  function handleExportPNG() {
    if (
      !waveformRef.current ||
      !triangleRef.current ||
      !phasorRef.current
    ) {
      return;
    }

    const svgs = [waveformRef.current, triangleRef.current, phasorRef.current];

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = darkMode ? "#020617" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const positions = [
      { x: 20, y: 20, maxW: 860, maxH: 260 }, // waveform top
      { x: 20, y: 320, maxW: 420, maxH: 260 }, // triangle bottom-left
      { x: 460, y: 320, maxW: 420, maxH: 260 }, // phasor bottom-right
    ];

    let loaded = 0;

    svgs.forEach((svgEl, idx) => {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const img = new Image();

      img.onload = () => {
        const box = svgEl.getBoundingClientRect();
        const pos = positions[idx];
        const scale = Math.min(
          pos.maxW / (box.width || pos.maxW),
          pos.maxH / (box.height || pos.maxH)
        );
        const drawW = (box.width || pos.maxW) * scale;
        const drawH = (box.height || pos.maxH) * scale;
        ctx.drawImage(img, pos.x, pos.y, drawW, drawH);

        loaded += 1;
        if (loaded === svgs.length) {
          const link = document.createElement("a");
          link.download = "rosa_power_factor_training.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      };

      const encoded = window.btoa(
        unescape(encodeURIComponent(svgStr))
      );
      img.src = "data:image/svg+xml;base64," + encoded;
    });
  }

  const pageStyle = {
    ...basePageStyle,
    background: darkMode
      ? "radial-gradient(circle at top, #020617 0%, #020617 50%, #020617 100%)"
      : "linear-gradient(180deg,#f3f7fb 0%,#ffffff 120%)",
    color: darkMode ? "#e5e7eb" : "#0f172a",
  };

  const headerShellThemed = {
    ...headerShellStyle,
    background: darkMode ? "#020617" : "#ffffff",
    border: darkMode ? "1px solid #1f2937" : headerShellStyle.border,
  };

  const cardThemed = {
    ...cardStyle,
    background: darkMode ? "#020617" : "#ffffff",
    border: darkMode ? "1px solid #1f2937" : cardStyle.border,
    boxShadow: darkMode
      ? "0 1px 4px rgba(15,23,42,0.7)"
      : cardStyle.boxShadow,
  };

  const titleColor = darkMode ? "#e5e7eb" : "#0b3b57";
  const subtitleColor = darkMode ? "#9ca3af" : "#6b7280";
  const metricTextStyle = {
    ...metricLineStyle,
    color: darkMode ? "#e5e7eb" : "#0b2132",
  };
  const labelTrackColor = darkMode ? "#9ca3af" : "#667085";

  return (
    <div style={pageStyle}>
      {/* header */}
      <div style={headerShellThemed}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={headerStyle}>
            <RosaLogo width={56} height={56} />
            <div>
              <div style={{ ...titleStyle, color: titleColor }}>
                Rosa Engineering Ltd — Interactive Power Factor Correction
              </div>
              <div style={{ ...subtitleStyle, color: subtitleColor }}>
                Power Factor Correction • Electrical Fundamentals Training
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: darkMode ? "#1e293b" : "#0b72a0",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 12,
                transition: "background 0.2s ease",
              }}
            >
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
            <button
              onClick={handleExportPNG}
              style={{
                background: darkMode ? "#0f172a" : "#ffffff",
                color: darkMode ? "#e5e7eb" : "#0f172a",
                border: "1px solid #0b72a0",
                padding: "6px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Export PNG
            </button>
          </div>
        </div>
      </div>

      <div style={layoutStyle}>
        {/* Left column */}
        <div style={columnStyle}>
          {/* Load & correction */}
          <div style={cardThemed}>
            <h3
              style={{
                ...panelTitleStyle,
                color: darkMode ? "#bae6fd" : "#07445f",
              }}
            >
              <span style={panelTitleUnderline}>Load & correction</span>
            </h3>

            <div style={{ ...labelRowStyle, color: subtitleColor }}>
              Resistance R (Ω): <strong>{R}</strong>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              value={R}
              onChange={(e) => setR(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div
              style={{ ...rangeTrackLabelStyle, color: labelTrackColor }}
            >
              <span>1</span>
              <span>500</span>
            </div>

            <div
              style={{
                ...labelRowStyle,
                marginTop: 10,
                color: subtitleColor,
              }}
            >
              Inductance L (mH): <strong>{L_mH}</strong>
            </div>
            <input
              type="range"
              min={0}
              max={2000}
              value={L_mH}
              onChange={(e) => setL_mH(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div
              style={{ ...rangeTrackLabelStyle, color: labelTrackColor }}
            >
              <span>0</span>
              <span>2000</span>
            </div>

            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px dashed ${
                  darkMode ? "#1f2937" : "#e2e8f0"
                }`,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: darkMode ? "#e5e7eb" : "#0f172a",
                }}
              >
                Correction capacitor (shunt)
              </h4>
              <div style={{ ...labelRowStyle, color: subtitleColor }}>
                C<sub>corr</sub> (µF):{" "}
                <strong>{fmt(Ccorr_uF, 3)}</strong>
              </div>
              <input
                type="range"
                min={0}
                max={suggestedMaxC}
                step={0.1}
                value={Ccorr_uF}
                onChange={(e) => setCcorr_uF(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div
                style={{ ...rangeTrackLabelStyle, color: labelTrackColor }}
              >
                <span>0</span>
                <span>{suggestedMaxC}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() =>
                    setCcorr_uF(
                      Number(computeRequiredC_forUnityPF().toFixed(3))
                    )
                  }
                  style={{
                    background: "#0b72a0",
                    color: "#ffffff",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Auto-calc C for unity PF
                </button>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={cardThemed}>
            <h3
              style={{
                ...panelTitleStyle,
                color: darkMode ? "#bae6fd" : "#07445f",
              }}
            >
              <span style={panelTitleUnderline}>Metrics</span>
            </h3>
            <div style={metricTextStyle}>
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
                <strong>{fmt(metrics.powerFactor, 3)}</strong>{" "}
                <span style={{ color: labelTrackColor }}>
                  ({metrics.pfType})
                </span>
              </div>
              <div>
                PF angle φ: <strong>{fmt(metrics.phiDeg, 2)}°</strong>
              </div>
              <div>
                |Z|: <strong>{fmt(metrics.Zmag, 3)} Ω</strong>
              </div>
              <div>
                Y (load):{" "}
                <strong>
                  {fmt(metrics.Yload_re, 4)} + j
                  {fmt(metrics.Yload_im, 4)} S
                </strong>
              </div>
              <div>
                Y (cap):{" "}
                <strong>j{fmt(metrics.Ycap_im, 6)} S</strong>
              </div>
            </div>
          </div>

          <div style={cardThemed}>
            <small
              style={{
                fontSize: 11,
                color: labelTrackColor,
              }}
            >
              Note: educational tool — ideal sinusoidal steady-state assumptions
              used. Always follow standards and safety procedures for real
              installations.
            </small>
          </div>
        </div>

        {/* Right column */}
        <div style={columnStyle}>
          <div style={cardThemed}>
            <h3
              style={{
                ...panelTitleStyle,
                color: darkMode ? "#bae6fd" : "#07445f",
              }}
            >
              <span style={panelTitleUnderline}>Waveforms</span>
            </h3>
            <WaveformSVG
              t={t}
              v={vWave}
              i={iWave}
              p={pWave}
              svgRef={waveformRef}
              darkMode={darkMode}
            />
          </div>

          <div style={cardThemed}>
            <h3
              style={{
                ...panelTitleStyle,
                color: darkMode ? "#bae6fd" : "#07445f",
              }}
            >
              <span style={panelTitleUnderline}>AC power triangle</span>
            </h3>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <PowerTriangleSVG
                P={metrics.realP}
                Q={metrics.reactiveQ}
                S={metrics.apparentS}
                phiDeg={metrics.phiDeg}
                svgRef={triangleRef}
                darkMode={darkMode}
              />
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: darkMode ? "#e5e7eb" : "#0f172a",
                }}
              >
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
                  PF: <strong>{fmt(metrics.powerFactor, 3)}</strong>{" "}
                  <span style={{ color: labelTrackColor }}>
                    ({metrics.pfType})
                  </span>
                </div>
                <div>
                  φ: <strong>{fmt(metrics.phiDeg, 2)}°</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Phasor diagram */}
          <div style={cardThemed}>
            <h3
              style={{
                ...panelTitleStyle,
                color: darkMode ? "#bae6fd" : "#07445f",
              }}
            >
              <span style={panelTitleUnderline}>Phasor diagram</span>
            </h3>
            <PhasorSVG
              Vrms={metrics.Vrms}
              Irms={metrics.Irms}
              phiDeg={metrics.phiDeg}
              svgRef={phasorRef}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* FULL-WIDTH EQUATIONS SECTION */}
      <MathJaxContext version={3} config={mathJaxConfig}>
        <div
          style={{
            ...cardThemed,
            marginTop: 20,
            padding: "18px 22px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
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
          </div>

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
                  style={{ ...panelTitleUnderline, paddingBottom: 4 }}
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
                <MathJax>
                  {String.raw`
\[
PF=\frac{P}{|S|}=\cos(\varphi)
\]

\[
Z=R+jX \qquad\qquad |Z|=\sqrt{R^2+X^2}
\]

\[
X_L=\omega L \qquad\qquad X_C=\frac{1}{\omega C}
\]

\[
S=P+jQ \qquad\qquad |S|=V\cdot I
\]

\[
Y=\frac{1}{Z}=G+jB
\]

\[
\mathrm{Im}(Y_{\mathrm{total}})=0 \Rightarrow 
\omega C=-\mathrm{Im}(Y_{\mathrm{load}})
\]
                  `}
                </MathJax>
              </div>
            </div>
          )}
        </div>
      </MathJaxContext>

      <footer
        style={{
          marginTop: 18,
          color: subtitleColor,
          fontSize: 12,
          borderTop: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
          paddingTop: 8,
        }}
      >
        Rosa Engineering Ltd © {new Date().getFullYear()} — Engineering Solutions
      </footer>
    </div>
  );
}
