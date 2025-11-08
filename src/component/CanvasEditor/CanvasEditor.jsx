"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import styles from "./canvas.module.scss";

const FONTS = [
  { id: "f1", name: "Arial", css: "Arial, sans-serif" },
  { id: "f2", name: "Times", css: "'Times New Roman', serif" },
  { id: "f3", name: "Comic", css: "'Comic Sans MS', cursive" },
  { id: "f4", name: "Impact", css: "Impact, fantasy" },
  { id: "f5", name: "Lobster", css: "'Lobster', cursive" },
];

export default function CanvasEditor({ shirtUrl, onDesignReady }) {
  const canvasRef = useRef(null);
  const editDivRef = useRef(null);
  const wrapperRef = useRef(null);

  const [shirtImg, setShirtImg] = useState(null);
  const [font, setFont] = useState(FONTS[0]);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(30);
  const [text, setText] = useState("Mini Knight.\nMega Might!");
  const [textX, setTextX] = useState(250);
  const [textY, setTextY] = useState(420);
  const [dragging, setDragging] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Load shirt
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = shirtUrl || "";
    img.onload = () => setShirtImg(img);
    img.onerror = () => setShirtImg(null);
  }, [shirtUrl]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 500, 600);

    if (shirtImg) {
      ctx.drawImage(shirtImg, 0, 0, 500, 600);
    } else {
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(0, 0, 500, 600);
    }

    if (!editing) {
      ctx.font = `${size}px ${font.css}`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lines = text.split("\n");
      const lineHeight = size * 1.2;
      lines.forEach((line, i) => {
        ctx.fillText(
          line,
          textX,
          textY + i * lineHeight - ((lines.length - 1) * lineHeight) / 2
        );
      });
    }
  }, [shirtImg, text, font, color, size, textX, textY, editing]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Start editing
  const startEdit = useCallback(() => {
    setEditing(true);
    setToolbarOpen(true);
    setCharCount(text.replace(/\n/g, "").length);

    if (wrapperRef.current) {
      wrapperRef.current.style.pointerEvents = "none";
    }

    setTimeout(() => {
      if (editDivRef.current) {
        editDivRef.current.textContent = text; // set plain text
        editDivRef.current.focus();

        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editDivRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  }, [text]);

  // Finish editing
  const finishEdit = useCallback(() => {
    if (editDivRef.current) {
      const raw = editDivRef.current.innerText.replace(/\n$/, "");
      const clean = raw.slice(0, 40);
      setText(clean);
      setCharCount(clean.replace(/\n/g, "").length);
    }
    setEditing(false);
    if (wrapperRef.current) {
      wrapperRef.current.style.pointerEvents = "auto";
    }
  }, []);

  // Character limit
  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finishEdit();
      return;
    }

    const current = editDivRef.current?.innerText || "";
    const withoutNewline = current.replace(/\n/g, "");
    if (withoutNewline.length >= 40 && e.key !== "Backspace" && e.key !== "Delete") {
      e.preventDefault();
    }
  };

  const handleEditInput = () => {
    if (editDivRef.current) {
      const withoutNewline = editDivRef.current.innerText.replace(/\n/g, "");
      setCharCount(withoutNewline.length);
    }
  };

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (Math.hypot(x - textX, y - textY) < 80) {
        setDragging(true);
      }
    };

    const onMouseMove = (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      setTextX(e.clientX - rect.left);
      setTextY(e.clientY - rect.top);
    };

    const onMouseUp = () => setDragging(false);

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const lines = text.split("\n");
      const lineHeight = size * 1.2;
      const totalH = lines.length * lineHeight;
      const textTop = textY - totalH / 2;
      const textBottom = textY + totalH / 2;
      const textLeft = textX - 200;
      const textRight = textX + 200;

      if (x > textLeft && x < textRight && y > textTop && y < textBottom) {
        setToolbarOpen(true);
      }
    };

    const onDblClick = () => {
      startEdit();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDblClick);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("dblclick", onDblClick);
    };
  }, [dragging, textX, textY, size, text, toolbarOpen, startEdit]);

  // Export
  const exportDesign = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/png") || "";
    onDesignReady?.(dataUrl);
  };

  return (
    <div className={styles.canvasSection}>
      <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={600}
          className={styles.canvas}
          style={{
            cursor: dragging ? "grabbing" : "grab",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        />

        {/* Inline Editor – NO dangerouslySetInnerHTML */}
        {editing && (
          <div
            ref={editDivRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={finishEdit}
            onKeyDown={handleEditKeyDown}
            onInput={handleEditInput}
            style={{
              position: "absolute",
              left: `${textX - 150}px`,
              top: `${textY - (size * 1.2 * (text.split("\n").length - 1)) / 2}px`,
              width: "300px",
              fontSize: `${size}px`,
              fontFamily: font.css,
              color,
              textAlign: "center",
              lineHeight: "1.2",
              background: "rgba(255,255,255,0.85)",
              border: "2px dashed #f9cc50",
              outline: "none",
              padding: "4px",
              cursor: "text",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "text",
            }}
          />
        )}
      </div>

      {/* Font Tabs */}
      <div className={styles.fontTabs}>
        {FONTS.map((f, i) => (
          <button
            key={f.id}
            className={`${styles.fontTab} ${font.id === f.id ? styles.active : ""}`}
            onClick={() => setFont(f)}
            style={{ fontFamily: f.css }}
          >
            Font {i + 1}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      {toolbarOpen && (
        <div className={styles.bottomToolbar}>
          <div className={styles.toolbarGroup}>
            <div className={styles.toolItem}>
              <span className={styles.icon}>A</span>
              <input
                type="range"
                min={10}
                max={120}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className={styles.sizeSlider}
              />
              <span className={styles.label}>{size}px</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.toolItem}>
              <span className={styles.icon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0a.5.5 0 0 1 .47.33L11.09 7H4.91L7.53.33A.5.5 0 0 1 8 0zM4.5 8h7a.5.5 0 0 1 .47.67L9.41 15H6.59L4.03 8.67A.5.5 0 0 1 4.5 8z" />
                </svg>
              </span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={styles.colorPicker}
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.toolItem}>
              <span className={styles.icon} style={{ fontSize: "22px" }}>f</span>
              <select
                value={font.id}
                onChange={(e) => {
                  const selected = FONTS.find((f) => f.id === e.target.value);
                  if (selected) setFont(selected);
                }}
                className={styles.fontSelect}
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id} style={{ fontFamily: f.css }}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.toolItem}>
              <span className={styles.label}>{charCount}/40</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.toolItem}>
              <span className={styles.icon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3zm10 10H3V4h10v8z" />
                  <path d="M5 5h2v2H5V5zm4 0h2v2H9V5zM5 9h2v2H5V9zm4 9h2v2H9V9z" />
                </svg>
              </span>
              <span className={styles.label}>Double-click to edit</span>
            </div>
          </div>

          <button className={styles.closeButton} onClick={() => setToolbarOpen(false)}>
            X
          </button>
        </div>
      )}
    </div>
  );
}