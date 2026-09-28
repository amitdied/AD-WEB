'use client';

import React from 'react';

export function ParallaxBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-black" />

      {/* Cyber grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Crimson Ambient Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[140px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-red-950/15 rounded-full blur-[160px]" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-zinc-900/40 rounded-full blur-[140px]" />
    </div>
  );
}
