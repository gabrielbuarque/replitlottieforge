import React, { useState } from "react";
import { extractColorsFromLottie, replaceColorInLottie } from "@/lib/utils";

function isValidJson(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

const FullscreenEditor: React.FC = () => {
  const [input, setInput] = useState("");
  const [json, setJson] = useState<any>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<{ [old: string]: string }>({});

  // Detecta cores ao colar JSON
  const handleLoadJson = () => {
    if (!isValidJson(input)) return alert("JSON inválido");
    const parsed = JSON.parse(input);
    setJson(parsed);
    const foundColors = extractColorsFromLottie(parsed);
    setColors(foundColors);
    setColorMap(Object.fromEntries(foundColors.map(c => [c, c])));
  };

  // Atualiza cor individual
  const handleColorChange = (oldColor: string, newColor: string) => {
    setColorMap(prev => ({ ...prev, [oldColor]: newColor }));
    if (!json) return;
    let updated = json;
    // Aplica todas as trocas já feitas
    Object.entries({ ...colorMap, [oldColor]: newColor }).forEach(([from, to]) => {
      updated = replaceColorInLottie(updated, from, to);
    });
    setJson(updated);
  };

  // Exporta JSON editado
  const handleExport = () => {
    if (!json) return;
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited-lottie.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#18181b",
      color: "#fff",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }}>
      <div style={{ width: 600, maxWidth: "90vw", background: "#23232b", borderRadius: 16, padding: 32, boxShadow: "0 4px 32px #0008" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>Editor Manual de Cores Lottie</h1>
        {!json && (
          <>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Cole aqui o JSON do Lottie..."
              style={{ width: "100%", height: 180, borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 14, marginBottom: 16, resize: "none" }}
            />
            <button
              onClick={handleLoadJson}
              style={{ width: "100%", padding: 12, borderRadius: 8, background: "#06f", color: "#fff", fontWeight: 600, fontSize: 16, border: "none", cursor: "pointer" }}
            >Carregar JSON</button>
          </>
        )}
        {json && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Cores detectadas:</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {colors.map((color) => (
                  <div key={color} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: color, border: "2px solid #333", display: "inline-block" }} />
                    <input
                      type="color"
                      value={colorMap[color]}
                      onChange={e => handleColorChange(color, e.target.value.toUpperCase())}
                      style={{ width: 48, height: 32, border: "none", background: "none" }}
                    />
                    <span style={{ fontFamily: "monospace", fontSize: 15 }}>{color}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <button
                onClick={handleExport}
                style={{ flex: 1, padding: 12, borderRadius: 8, background: "#06f", color: "#fff", fontWeight: 600, fontSize: 16, border: "none", cursor: "pointer" }}
              >Exportar JSON Editado</button>
              <button
                onClick={() => { setJson(null); setInput(""); setColors([]); setColorMap({}); }}
                style={{ flex: 1, padding: 12, borderRadius: 8, background: "#333", color: "#fff", fontWeight: 600, fontSize: 16, border: "none", cursor: "pointer" }}
              >Novo JSON</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FullscreenEditor; 