"use client";
import React, { useEffect, useRef } from "react";

const SAFE = {
  left: 140,
  top: 260,
  width: 260,
  height: 180
};

export default function CanvasEditor({ product }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js";
    script.onload = () => initCanvas();
    document.body.appendChild(script);

    return () => {
      fabricCanvasRef.current?.dispose();
    };
  }, [product]);

  const resolveImageURL = (img) => {
    if (!img) return null;
    if (typeof img === "object" && img.src) return img.src;
    if (img.startsWith("/_next/image")) {
      const real = new URL(img, window.location.origin).searchParams.get("url");
      return real || img;
    }
    return img;
  };

  const initCanvas = () => {
    if (!window.fabric) return;

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 900
    });

    fabricCanvasRef.current = canvas;
    loadShirt(canvas);
  };

  const loadShirt = (canvas) => {
    const shirtURL = resolveImageURL(product?.canvasImage);
    const illustrationURL = resolveImageURL(product?.illustrationImage);

    if (!shirtURL) return console.error("No shirt image provided");

    // Load shirt background
    window.fabric.Image.fromURL(
      shirtURL,
      (shirtImg) => {
        if (!shirtImg) return console.error("Shirt image failed to load");

        const scale = canvas.width / shirtImg.width;
        shirtImg.scale(scale);

        canvas.setBackgroundImage(
          shirtImg,
          () => {
            canvas.renderAll();

            // Load illustration inside SAFE area
            if (illustrationURL) {
              window.fabric.Image.fromURL(
                illustrationURL,
                (illuImg) => {
                  if (!illuImg) return console.error("Illustration failed");

                  // Fit illustration inside SAFE box
                  const scaleX = SAFE.width / illuImg.width;
                  const scaleY = SAFE.height / illuImg.height;
                  const scale = Math.min(scaleX, scaleY);
                  illuImg.scale(scale);

                  illuImg.set({
                    left: SAFE.left + (SAFE.width - illuImg.width * scale) / 2,
                    top: SAFE.top + (SAFE.height - illuImg.height * scale) / 2,
                    selectable: true,
                    hasBorders: true,
                    hasControls: true,
                    lockRotation: true
                  });

                  canvas.add(illuImg);
                  canvas.renderAll();
                  addWrappedText(canvas);
                },
                { crossOrigin: "anonymous" }
              );
            } else {
              addWrappedText(canvas);
            }
          },
          { originX: "left", originY: "top" }
        );
      },
      { crossOrigin: "anonymous" }
    );
  };

  const addWrappedText = (canvas) => {
    const text = new window.fabric.Textbox("Enter your text", {
      left: SAFE.left,
      top: SAFE.top,
      width: SAFE.width,
      height: SAFE.height,
      fontSize: 26,
      fill: "black",
      editable: true,
      textAlign: "center",
      splitByGrapheme: true
    });

    // Restrict text inside SAFE area
    text.on("moving", () => {
      if (text.left < SAFE.left) text.left = SAFE.left;
      if (text.top < SAFE.top) text.top = SAFE.top;
      if (text.left + text.width > SAFE.left + SAFE.width)
        text.left = SAFE.left + SAFE.width - text.width;
      if (text.top + text.height > SAFE.top + SAFE.height)
        text.top = SAFE.top + SAFE.height - text.height;
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  return (
    <div style={{ width: 600 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
