"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { ScheduleContextMenuOption } from "./context-menu";

interface ScheduleContextMenuProps {
  open: boolean;
  position: { x: number; y: number } | null;
  options: ScheduleContextMenuOption[];
  onClose: () => void;
  onSelect: (optionId: ScheduleContextMenuOption["id"]) => void;
}

export function ScheduleContextMenu({
  open,
  position,
  options,
  onClose,
  onSelect,
}: ScheduleContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !position || !menuRef.current) return;
    const menuEl = menuRef.current;
    const rect = menuEl.getBoundingClientRect();
    const padding = 12;
    let nextX = position.x;
    let nextY = position.y;

    if (nextX + rect.width > window.innerWidth - padding) {
      nextX = Math.max(padding, window.innerWidth - rect.width - padding);
    }
    if (nextY + rect.height > window.innerHeight - padding) {
      nextY = Math.max(padding, window.innerHeight - rect.height - padding);
    }

    menuEl.style.left = `${nextX}px`;
    menuEl.style.top = `${nextY}px`;
  }, [open, options.length, position]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener("pointerdown", handlePointer, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointer, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const menuEl = menuRef.current;
    const focusable = menuEl.querySelectorAll<HTMLButtonElement>("button");
    focusable[0]?.focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    menuEl.addEventListener("keydown", handleTab);
    return () => menuEl.removeEventListener("keydown", handleTab);
  }, [open, options.length]);

  if (!open || !position || options.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[80] min-w-[200px] rounded-lg border border-surface-200 bg-white p-1 shadow-xl"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-orientation="vertical"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="menuitem"
          onClick={() => onSelect(option.id)}
          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${
            option.destructive ? "text-rose-500" : "text-surface-700"
          }`}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
