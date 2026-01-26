"use client";

import { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
  distance?: number;
  duration?: number;
  scale?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 20,
  duration = 1100,
  scale = 0.98,
}: RevealProps) {
  const style = {
    "--reveal-delay": `${delay}ms`,
    "--reveal-distance": `${distance}px`,
    "--reveal-duration": `${duration}ms`,
    "--reveal-scale": scale,
  } as React.CSSProperties;

  return (
    <div className={`reveal ${className ?? ""}`.trim()} style={style}>
      {children}
    </div>
  );
}
