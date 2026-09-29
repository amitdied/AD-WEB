"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    // Only enable on fine-pointer devices (desktop with mouse)
    if (typeof window === "undefined") return;
    const isFine = window.matchMedia("(pointer: fine)").matches;
    if (!isFine) return;

    setIsFinePointer(true);

    const styleEl = document.createElement("style");
    styleEl.id = "custom-cursor-joint-style";
    styleEl.textContent = `
      @media (pointer: fine) {
        body {
          cursor: none;
        }
        a, button, [role="button"], input, textarea, select, [contenteditable="true"], [contenteditable=""], label, summary, [tabindex]:not([tabindex="-1"]), .cursor-pointer {
          cursor: pointer !important;
        }
        input, textarea, [contenteditable="true"], [contenteditable=""] {
          cursor: text !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as Element | null;
      if (!target) {
        setIsInteractive(false);
        return;
      }

      const isClickableOrInput = Boolean(
        target.closest(
          'a, button, [role="button"], input, textarea, select, [contenteditable="true"], [contenteditable=""], label, summary, [tabindex]:not([tabindex="-1"]), .cursor-pointer'
        )
      );

      let isPointerCursor = false;
      try {
        const computed = window.getComputedStyle(target);
        if (computed.cursor === "pointer" || computed.cursor === "text") {
          isPointerCursor = true;
        }
      } catch {
        // ignore
      }

      setIsInteractive(isClickableOrInput || isPointerCursor);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

  if (!isFinePointer || !isVisible || isInteractive) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 99999,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: "transform",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cursor-joint.png"
        alt=""
        style={{
          display: "block",
          maxWidth: "44px",
          maxHeight: "44px",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}
