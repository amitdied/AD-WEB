"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show custom cursor on devices that support hover / fine pointers
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 select-none"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: "transform",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cursor-joint.png"
        alt=""
        className="w-8 h-8 object-contain pointer-events-none"
      />
    </div>
  );
}

