"use client";
import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Palette, Type, Edit3 } from "lucide-react";

const PLACEHOLDER = "Enter text here";
const MAX_CHARS = 40;
const TEXT_PADDING = 20; // padding inside canvas for text

const CanvasEditor = ({ product, onDesignChange, setPrintingImg }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(product?.fontSize || 28);
  const [fontColor, setFontColor] = useState(product?.fontColor || "#000000");
  const [activeBottomTab, setActiveBottomTab] = useState("size");
  const fontSizes = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];

  // -----------------------------------------------------------------
  // Load Fabric.js
  // -----------------------------------------------------------------
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js";
    script.async = true;
    script.onload = initializeCanvas;
    document.body.appendChild(script);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      fabricCanvasRef.current?.dispose();
      if (script.parentNode) document.body.removeChild(script);
    };
  }, []);

  // -----------------------------------------------------------------
  // Canvas Dimensions
  // -----------------------------------------------------------------
  const getCanvasDimensions = () => {
    if (typeof window === "undefined") return { width: 500, height: 600 };
    const width = Math.min(window.innerWidth * 0.9, 500);
    const height = width * 1.2;
    return { width, height };
  };

  // -----------------------------------------------------------------
  // Initialize Canvas
  // -----------------------------------------------------------------
  const initializeCanvas = () => {
    if (!window.fabric || !canvasRef.current) return;
    const { width, height } = getCanvasDimensions();

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#f0f0f0",
    });
    fabricCanvasRef.current = canvas;

    canvas.on("mouse:dblclick", (e) => {
      const obj = e.target;
      if (obj && obj.type === "i-text") {
        obj.enterEditing();
        obj.selectAll();
        canvas.renderAll();
      }
    });

    canvas.on("text:changed", (e) => handleTextChange(e.target));
    canvas.on("text:editing:exited", exportDesign);

    if (product?.canvasImage) {
      window.fabric.Image.fromURL(
        product.canvasImage,
        (img) => {
          img.scaleToWidth(canvas.width);
          img.scaleToHeight(canvas.height);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          product?.illustrationImage ? addIllustration() : addTextOnly();
        },
        { crossOrigin: "anonymous" }
      );
    } else addTextOnly();

    setIsLoading(false);
  };

  // -----------------------------------------------------------------
  // Handle text change
  // -----------------------------------------------------------------
  const handleTextChange = (textObj) => {
    if (!textObj || textObj.type !== "i-text") return;

    let text = textObj.text || "";
    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
    if (text.trim() === "") text = PLACEHOLDER;

    textObj.set("text", text);
    textObj.set({
      width: fabricCanvasRef.current.width - TEXT_PADDING * 2,
    });
    textObj.setCoords();
    fabricCanvasRef.current.renderAll();

    setPrintingImg?.((prev) => ({
      ...prev,
      printText: text === PLACEHOLDER ? "" : text,
      fontFamily: textObj.fontFamily,
      textColor: textObj.fill,
      fontSize: textObj.fontSize,
    }));

    exportDesign();
  };

  // -----------------------------------------------------------------
  // Resize Canvas
  // -----------------------------------------------------------------
  const resizeCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const { width, height } = getCanvasDimensions();
    const scaleX = width / canvas.getWidth();
    const scaleY = height / canvas.getHeight();

    canvas.getObjects().forEach((obj) => {
      obj.scaleX *= scaleX;
      obj.scaleY *= scaleY;
      obj.left *= scaleX;
      obj.top *= scaleY;
      obj.setCoords();
    });

    canvas.setDimensions({ width, height });
    canvas.renderAll();
  };

  // -----------------------------------------------------------------
  // Export Design
  // -----------------------------------------------------------------
  const exportDesign = () => {
    const dataURL = fabricCanvasRef.current?.toDataURL({ format: "png", quality: 1 });
    onDesignChange?.(dataURL);
  };

  // -----------------------------------------------------------------
  // Add illustration + text
  // -----------------------------------------------------------------
  const addIllustration = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !product?.illustrationImage) return;

    window.fabric.Image.fromURL(product.illustrationImage, (img) => {
      const maxW = canvas.width * 0.5;
      const maxH = canvas.height * 0.4;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      img.scale(scale);
      img.set({
        left: canvas.width / 2,
        top: canvas.height / 2 - 10,
        originX: "center",
        originY: "center",
        selectable: true,
      });
      canvas.add(img);
      addFixedText(img.getScaledHeight());
      canvas.renderAll();
      exportDesign();
    }, { crossOrigin: "anonymous" });
  };

  const addTextOnly = () => addFixedText(0);

  const addFixedText = (illustrationHeight) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const oldText = canvas.getObjects("i-text")[0];
    if (oldText) canvas.remove(oldText);

    const textTop = canvas.height / 2 + illustrationHeight / 2 - 20;
    const displayText = product?.presetText?.trim() || PLACEHOLDER;

    const text = new window.fabric.IText(displayText, {
      left: canvas.width / 2,
      top: textTop,
      originX: "center",
      originY: "top",
      width: canvas.width - TEXT_PADDING * 2,
      fontSize,
      fill: displayText === PLACEHOLDER ? "#999" : fontColor,
      fontFamily: product?.fontFamily || "Arial",
      fontStyle: displayText === PLACEHOLDER ? "italic" : "normal",
      textAlign: "center",
      selectable: false,
      editable: true,
    });

    canvas.add(text);
    canvas.renderAll();
    exportDesign();
  };

  // -----------------------------------------------------------------
  // Controls
  // -----------------------------------------------------------------
  const updateFontSize = (size) => {
    setFontSize(size);
    const text = fabricCanvasRef.current?.getObjects("i-text")[0];
    if (text) {
      text.set({ fontSize: size });
      text.setCoords();
      fabricCanvasRef.current.renderAll();
      exportDesign();
    }
  };

  const updateColor = (color) => {
    setFontColor(color);
    const text = fabricCanvasRef.current?.getObjects("i-text")[0];
    if (text && text.text !== PLACEHOLDER) {
      text.set({ fill: color });
      text.setCoords();
      fabricCanvasRef.current.renderAll();
      exportDesign();
    }
  };

  const updateFontFamily = (family) => {
    const text = fabricCanvasRef.current?.getObjects("i-text")[0];
    if (text) {
      text.set({ fontFamily: family });
      text.setCoords();
      fabricCanvasRef.current.renderAll();
      exportDesign();
    }
  };

  const startEditing = () => {
    const text = fabricCanvasRef.current?.getObjects("i-text")[0];
    if (text) {
      text.enterEditing();
      text.selectAll();
      fabricCanvasRef.current.renderAll();
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 550, margin: "0 auto" }}>
      <div style={{ width: "100%", background: "#fff", borderRadius: 12, overflow: "hidden", position: "relative", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto" }} />
        {!isLoading && (
          <p style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", color: "#fff", background: "rgba(0,0,0,0.6)", fontSize: 12, padding: "4px 10px", borderRadius: 12 }}>
            Double-click text to edit
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        {/* Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 8, background: "#f7f7f7", borderRadius: 30, padding: 4, marginBottom: 12 }}>
          {[{ id: "size", label: "Font size", icon: Maximize2 }, { id: "color", label: "Colour", icon: Palette }, { id: "fonts", label: "Fonts", icon: Type }, { id: "edit", label: "Edit", icon: Edit3 }].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => { setActiveBottomTab(tab.id); if (tab.id === "edit") startEditing(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", fontSize: 13, background: activeBottomTab === tab.id ? "#fff" : "transparent", color: activeBottomTab === tab.id ? "#000" : "#555", border: "none", borderRadius: 24, cursor: "pointer", boxShadow: activeBottomTab === tab.id ? "0 2px 4px rgba(0,0,0,0.15)" : "none" }}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Panel Content */}
        <div style={{ minHeight: 130 }}>
          {activeBottomTab === "size" && (
            <div>
              <h4 style={{ marginBottom: 10 }}>Font Size</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(50px, 1fr))", gap: 8 }}>
                {fontSizes.map(s => (
                  <button key={s} onClick={() => updateFontSize(s)} style={{ padding: "8px", background: fontSize === s ? "#2196F3" : "#fff", color: fontSize === s ? "#fff" : "#333", border: fontSize === s ? "2px solid #2196F3" : "1px solid #ddd", borderRadius: 6 }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {activeBottomTab === "color" && (
            <div>
              <h4 style={{ marginBottom: 10 }}>Colour</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                {["#000000","#ffffff","#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff","#00ffff"].map(c => (
                  <button key={c} onClick={() => updateColor(c)} style={{ width: 40, height: 40, background: c, border: fontColor === c ? "3px solid #000" : "1px solid #ddd", borderRadius: 8 }} />
                ))}
              </div>
              <input type="color" value={fontColor} onChange={(e) => updateColor(e.target.value)} style={{ width: "100%", height: 40, border: "1px solid #ddd", borderRadius: 6 }} />
            </div>
          )}

          {activeBottomTab === "fonts" && (
            <div>
              <h4 style={{ marginBottom: 10 }}>Fonts</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Arial","Georgia","Times New Roman","Courier New","Verdana","Impact","Comic Sans MS"].map(f => (
                  <button key={f} onClick={() => updateFontFamily(f)} style={{ padding: "8px 14px", border: "1px solid #ddd", background: "#000", color: "#fff", borderRadius: 6, fontFamily: f, fontSize: 14 }}>{f}</button>
                ))}
              </div>
            </div>
          )}

          {activeBottomTab === "edit" && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <Edit3 size={44} style={{ color: "#999", marginBottom: 8 }} />
              <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Editing mode active — type directly on the shirt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;
