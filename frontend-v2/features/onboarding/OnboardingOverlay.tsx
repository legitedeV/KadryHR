"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "./OnboardingProvider";
import { OnboardingTargetId } from "./onboarding.types";
import { getNavItemById, PanelNavItemId } from "@/lib/panel-navigation";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type CardPosition = "right" | "left" | "bottom" | "top";

function getTargetElement(targetId: OnboardingTargetId): HTMLElement | null {
  return document.querySelector(`[data-onboarding-target="${targetId}"]`);
}

function getTargetRect(element: HTMLElement): TargetRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

function calculateCardPosition(rect: TargetRect): CardPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = 400;
  const cardHeight = 220;
  const margin = 16;

  // Check if there's space on the right
  if (rect.right + margin + cardWidth < viewportWidth) {
    return "right";
  }
  // Check if there's space on the left
  if (rect.left - margin - cardWidth > 0) {
    return "left";
  }
  // Check if there's space below
  if (rect.bottom + margin + cardHeight < viewportHeight) {
    return "bottom";
  }
  // Default to top
  return "top";
}

function getCardStyle(rect: TargetRect, position: CardPosition): React.CSSProperties {
  const margin = 16;

  switch (position) {
    case "right":
      return {
        position: "fixed",
        top: Math.max(margin, Math.min(rect.top, window.innerHeight - 240)),
        left: rect.right + margin,
      };
    case "left":
      return {
        position: "fixed",
        top: Math.max(margin, Math.min(rect.top, window.innerHeight - 240)),
        right: window.innerWidth - rect.left + margin,
      };
    case "bottom":
      return {
        position: "fixed",
        top: rect.bottom + margin,
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - 420)),
      };
    case "top":
    default:
      return {
        position: "fixed",
        bottom: window.innerHeight - rect.top + margin,
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - 420)),
      };
  }
}

export function OnboardingOverlay() {
  const router = useRouter();
  const {
    tour,
    currentStepIndex,
    isOpen,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
  } = useOnboarding();
  const titleId = useId();
  const descriptionId = useId();
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardPosition, setCardPosition] = useState<CardPosition>("right");

  const step = useMemo(() => tour.steps[currentStepIndex], [currentStepIndex, tour.steps]);
  const totalSteps = tour.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const hasTarget = Boolean(step.targetId);
  const hasModuleAction = step.primaryActionType === "go-to-module" && step.moduleRouteName;

  // Update target rect when step changes or when window resizes
  const updateTargetRect = useCallback(() => {
    if (!step.targetId) {
      setTargetRect(null);
      return;
    }
    const element = getTargetElement(step.targetId);
    if (element) {
      const rect = getTargetRect(element);
      setTargetRect(rect);
      setCardPosition(calculateCardPosition(rect));
    } else {
      setTargetRect(null);
    }
  }, [step.targetId]);

  // Subscribe to resize and scroll events
  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updateTargetRect]);

  // Initial rect calculation and updates when step changes
  useEffect(() => {
    if (!isOpen) return;
    // Use requestAnimationFrame to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      updateTargetRect();
    });
    // Also update after a short delay to catch any layout changes
    const timer = setTimeout(() => {
      requestAnimationFrame(updateTargetRect);
    }, 100);
    
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    previousActiveRef.current?.focus?.();
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipTour();
        return;
      }
      if (event.key === "Enter" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (isLastStep) {
          finishTour();
        } else {
          nextStep();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finishTour, isLastStep, isOpen, nextStep, skipTour]);

  const handleGoToModule = useCallback(() => {
    if (!step.moduleRouteName) return;
    const navItem = getNavItemById(step.moduleRouteName as PanelNavItemId);
    if (navItem) {
      router.push(navItem.href);
      // Update target rect after navigation using rAF for next frame
      setTimeout(() => {
        requestAnimationFrame(updateTargetRect);
      }, 300);
    }
  }, [step.moduleRouteName, router, updateTargetRect]);

  if (!isOpen) return null;

  // Render with spotlight (targeted) or centered (fallback)
  const renderWithSpotlight = hasTarget && targetRect;

  return (
    <>
      {/* Overlay background */}
      <div className="fixed inset-0 z-50 bg-black/60" aria-hidden="true" />

      {/* Spotlight highlight */}
      {renderWithSpotlight && (
        <div
          className="fixed z-50 pointer-events-none rounded-2xl ring-4 ring-brand-400/60 shadow-[0_0_30px_rgba(201,155,100,0.4)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            backgroundColor: "transparent",
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(201, 155, 100, 0.4)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tour card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`z-50 w-full max-w-md rounded-3xl border border-surface-800/70 bg-surface-900/95 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.55)] backdrop-blur ${
          renderWithSpotlight ? "" : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        }`}
        style={renderWithSpotlight ? getCardStyle(targetRect, cardPosition) : undefined}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
            KROK {currentStepIndex + 1}/{totalSteps}
          </span>
          {hasTarget && targetRect && (
            <span className="flex items-center gap-1.5 text-xs text-brand-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Zobacz w panelu
            </span>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <h2 id={titleId} className="text-xl font-semibold text-surface-50">
            {step.title}
          </h2>
          <p id={descriptionId} className="text-sm text-surface-300">
            {step.description}
          </p>
        </div>

        {/* Module navigation button */}
        {hasModuleAction && (
          <button
            type="button"
            onClick={handleGoToModule}
            className="mt-4 w-full rounded-2xl border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-100 transition hover:border-brand-400/70 hover:bg-brand-500/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Przejdź do modułu
          </button>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={isFirstStep}
            className="rounded-full border border-surface-800/70 px-4 py-2 text-xs font-semibold text-surface-300 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Wstecz
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={skipTour}
              className="rounded-full border border-surface-800/70 px-4 py-2 text-xs font-semibold text-surface-300 transition hover:text-surface-100"
            >
              Pomiń
            </button>
            {isLastStep ? (
              <button
                ref={primaryButtonRef}
                type="button"
                onClick={finishTour}
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/30"
              >
                Zakończ
              </button>
            ) : (
              <button
                ref={primaryButtonRef}
                type="button"
                onClick={nextStep}
                className="rounded-full bg-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-500/30"
              >
                Dalej
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
