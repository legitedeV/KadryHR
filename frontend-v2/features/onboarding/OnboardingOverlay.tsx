"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { useOnboarding } from "./OnboardingProvider";

export function OnboardingOverlay() {
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

  const step = useMemo(() => tour.steps[currentStepIndex], [currentStepIndex, tour.steps]);
  const totalSteps = tour.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipTour();
        return;
      }
      if (event.key === "Enter") {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-xl rounded-3xl border border-surface-800/70 bg-surface-900/95 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
            KROK {currentStepIndex + 1}/{totalSteps}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <h2 id={titleId} className="text-xl font-semibold text-surface-50">
            {step.title}
          </h2>
          <p id={descriptionId} className="text-sm text-surface-300">
            {step.description}
          </p>
        </div>
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
    </div>
  );
}
