import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Palette, Type, Edit3 } from 'lucide-react';

const CanvasEditor = ({ product, onDesignChange, setPrintingImg }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(product?.fontSize || 28);
  const [fontColor, setFontColor] = useState(product?.fontColor || '#000000');
  const [activeBottomTab, setActiveBottomTab] = useState('size');

  const fontSizes = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];

  // -----------------------------------------------------------------
  //  Fabric init
  // -----------------------------------------------------------------
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
    script.async = true;
    script.onload = () => initializeCanvas();
    document.body.appendChild(script);

    return () => {
      fabricCanvasRef.current?.dispose();
      if (script.parentNode) document.body.removeChild(script);
    };
  }, []);

  const initializeCanvas = () => {
    if (!window.fabric || !canvasRef.current) return;

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 600,
      backgroundColor: '#f0f0f0',
    });
    fabricCanvasRef.current = canvas;

    // Load background
    if (product?.canvasImage) {
      window.fabric.Image.fromURL(
        product.canvasImage,
        (img) => {
          img.scaleToWidth(canvas.width);
          img.scaleToHeight(canvas.height);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          if (product?.illustrationImage) addIllustration();
          else addTextOnly();
        },
        { crossOrigin: 'anonymous' }
      );
    }

    // Double-click to edit
    canvas.on('mouse:dblclick', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'i-text') {
        obj.enterEditing();
        obj.selectAll();
        canvas.renderAll();
      }
    });

    // Export + Update Parent State (on every change)
    const exportDesign = () => {
      const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
      onDesignChange?.(dataURL);
    };

    // **UPDATE printText ON EVERY KEYSTROKE**
    canvas.on('text:changed', (e) => {
      const textObj = e.target;
      if (textObj && textObj.type === 'i-text') {
        setPrintingImg(prev => ({
          ...prev,
          printText: textObj.text,
          fontFamily: textObj.fontFamily,
          textColor: textObj.fill,
          fontSize: textObj.fontSize,
        }));
      }
      exportDesign();
    });

    canvas.on('text:editing:exited', exportDesign);

    setIsLoading(false);
  };

  // -----------------------------------------------------------------
  //  Add Illustration + Fixed Text (150px width)
  // -----------------------------------------------------------------
  const TEXT_WIDTH = 150;
  const TEXT_TOP_OFFSET = 30;

  const addIllustration = () => {
    if (!fabricCanvasRef.current || !product?.illustrationImage) return;
    const canvas = fabricCanvasRef.current;

    window.fabric.Image.fromURL(
      product.illustrationImage,
      (img) => {
        const maxW = canvas.width * 0.5;
        const maxH = canvas.height * 0.4;
        let scale = Math.min(maxW / img.width, maxH / img.height);
        if (product.illustrationSize === 'small') scale *= 0.7;
        if (product.illustrationSize === 'large') scale *= 1.3;

        img.scale(scale);
        const illusHeight = img.getScaledHeight();
        img.set({
        left: canvas.width / 2.2,
        top: canvas.height / 2 - 10,
          originX: 'center',
          originY: 'center',
          selectable: true,
        });
        canvas.add(img);
        addFixedText(illusHeight);
        canvas.renderAll();
        exportDesign();
      },
      { crossOrigin: 'anonymous' }
    );
  };

  const addTextOnly = () => {
    addFixedText(0);
  };

  const addFixedText = (illustrationHeight) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove old text
    const oldText = canvas.getObjects('i-text')[0];
    if (oldText) canvas.remove(oldText);

    const textTop = (canvas.height / 2 - 20) + (illustrationHeight / 2) + 30;;

    const text = new window.fabric.IText(product.presetText || 'Your Text', {
      left: canvas.width / 2.2,
      top: textTop,
      originX: 'center',
      originY: 'top',
      fontSize,
      fill: fontColor,
      fontFamily: product.fontFamily || 'Arial',
      width: TEXT_WIDTH,
      breakWords: true,
      textAlign: 'center',
      selectable: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      editable: true,
    });

    canvas.add(text);
    canvas.renderAll();
    exportDesign();

    // **Initialize parent state**
    setPrintingImg({
      printText: text.text,
      fontFamily: text.fontFamily,
      textColor: text.fill,
      fontSize: text.fontSize,
    });
  };

  // -----------------------------------------------------------------
  //  Controls – Update Canvas + Parent State
  // -----------------------------------------------------------------
  const updateFontSize = (size) => {
    setFontSize(size);
    const text = fabricCanvasRef.current?.getObjects('i-text')[0];
    if (text) {
      text.set({ fontSize: size });
      fabricCanvasRef.current.renderAll();
      exportDesign();
      setPrintingImg(prev => ({
        ...prev,
        fontSize: size,
      }));
    }
  };

  const updateColor = (color) => {
    setFontColor(color);
    const text = fabricCanvasRef.current?.getObjects('i-text')[0];
    if (text) {
      text.set({ fill: color });
      fabricCanvasRef.current.renderAll();
      exportDesign();
      setPrintingImg(prev => ({
        ...prev,
        textColor: color,
      }));
    }
  };

  const updateFontFamily = (family) => {
    const text = fabricCanvasRef.current?.getObjects('i-text')[0];
    if (text) {
      text.set({ fontFamily: family });
      fabricCanvasRef.current.renderAll();
      exportDesign();
      setPrintingImg(prev => ({
        ...prev,
        fontFamily: family,
      }));
    }
  };

  const startEditing = () => {
    const text = fabricCanvasRef.current?.getObjects('i-text')[0];
    if (text) {
      text.enterEditing();
      text.selectAll();
      fabricCanvasRef.current.renderAll();
    }
  };

  const exportDesign = () => {
    const dataURL = fabricCanvasRef.current?.toDataURL({ format: 'png', quality: 1 });
    onDesignChange?.(dataURL);
  };

  // -----------------------------------------------------------------
  //  UI – Edit Tab = Instant Cursor
  // -----------------------------------------------------------------
  return (
    <div style={{ position: 'relative' }}>
      {/* Canvas */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          backgroundColor: '#fff',
          position: 'relative',
        }}
      >
        <canvas ref={canvasRef} />
        {!isLoading && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              pointerEvents: 'none',
            }}
          >
            Double-click text to edit
          </div>
        )}
      </div>

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#666',
          }}
        >
          Loading editor...
        </div>
      )}

      {/* TOP STATIC PILL */}
      <div
        style={{
          marginTop: 20,
          background: '#FDF4E7',
          borderRadius: 30,
          padding: '4px',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {['Font 1', 'Font 2', 'Font 3', 'Font 4', 'Font 5'].map((label, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '10px 6px',
              textAlign: 'center',
              fontWeight: 500,
              fontSize: 14,
              color: '#666',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* BOTTOM CONTROLS */}
      <div
        style={{
          marginTop: 12,
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: '#f5f5f5',
            borderRadius: 30,
            padding: 4,
            marginBottom: 16,
          }}
        >
          {[
            { id: 'size', label: 'Font size', icon: Maximize2 },
            { id: 'color', label: 'Colour', icon: Palette },
            { id: 'fonts', label: 'Fonts', icon: Type },
            { id: 'edit', label: 'Edit', icon: Edit3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveBottomTab(tab.id);
                  if (tab.id === 'edit') {
                    startEditing();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: activeBottomTab === tab.id ? '#fff' : 'transparent',
                  color: activeBottomTab === tab.id ? '#000' : '#666',
                  borderRadius: 24,
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all .2s',
                  boxShadow: activeBottomTab === tab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* PANEL CONTENT */}
        <div style={{ minHeight: 130 }}>
          {activeBottomTab === 'size' && (
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#333', fontSize: 15 }}>Font Size</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                {fontSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateFontSize(s)}
                    style={{
                      padding: '10px 6px',
                      border: fontSize === s ? '2px solid #2196F3' : '1px solid #ddd',
                      background: fontSize === s ? '#2196F3' : '#fff',
                      color: fontSize === s ? '#fff' : '#333',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: fontSize === s ? 600 : 400,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeBottomTab === 'color' && (
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#333', fontSize: 15 }}>Colour</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateColor(c)}
                    style={{
                      width: 44,
                      height: 44,
                      background: c,
                      border: fontColor === c ? '3px solid #000' : '1px solid #ddd',
                      borderRadius: 8,
                    }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={fontColor}
                onChange={(e) => updateColor(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                }}
              />
            </div>
          )}

          {activeBottomTab === 'fonts' && (
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#333', fontSize: 15 }}>Fonts</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact', 'Comic Sans MS'].map((f) => (
                  <button
                    key={f}
                    onClick={() => updateFontFamily(f)}
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #ddd',
                      background: '#000',
                      color: '#fff',
                      borderRadius: 6,
                      fontFamily: f,
                      fontSize: 14,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeBottomTab === 'edit' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Edit3 size={44} style={{ color: '#999', marginBottom: 8 }} />
              <p style={{ color: '#666', margin: 0, fontSize: 15 }}>
                Editing mode active — type directly on the shirt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;