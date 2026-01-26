"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { mainPanelTour } from "./mainPanelTour";
import { OnboardingTourConfig, OnboardingState } from "./onboarding.types";
import { OnboardingOverlay } from "./OnboardingOverlay";

const STORAGE_PREFIX = "kadryhr:onboarding";

type OnboardingContextValue = {
  tour: OnboardingTourConfig;
  currentStepIndex: number;
  isOpen: boolean;
  hasBeenCompleted: boolean;
  hasBeenSkipped: boolean;
  isReady: boolean;
  startMainPanelTour: (options?: { reset?: boolean }) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

function getStorageKey(userId: string, tourId: string) {
  return `${STORAGE_PREFIX}:${tourId}:${userId}`;
}

function getStoredState(userId: string, tourId: string): OnboardingState | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const stored = window.localStorage.getItem(getStorageKey(userId, tourId));
    if (!stored) return null;
    return JSON.parse(stored) as OnboardingState;
  } catch {
    return null;
  }
}

type OnboardingProviderProps = {
  userId: string;
  children: ReactNode;
};

export function OnboardingProvider({ userId, children }: OnboardingProviderProps) {
  const tour = mainPanelTour;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenCompleted, setHasBeenCompleted] = useState(() => {
    const stored = getStoredState(userId, tour.id);
    return Boolean(stored?.completed);
  });
  const [hasBeenSkipped, setHasBeenSkipped] = useState(() => {
    const stored = getStoredState(userId, tour.id);
    return Boolean(stored?.skipped);
  });
  const isReady = typeof window !== "undefined" && Boolean(userId);

  useEffect(() => {
    if (!userId) return;
    const storageKey = getStorageKey(userId, tour.id);
    const existingState = getStoredState(userId, tour.id);
    const payload: OnboardingState = {
      completed: hasBeenCompleted,
      skipped: hasBeenSkipped,
      lastStepIndex: existingState?.lastStepIndex ?? currentStepIndex,
      completedAt: hasBeenCompleted ? (existingState?.completedAt ?? new Date().toISOString()) : undefined,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [hasBeenCompleted, hasBeenSkipped, tour.id, userId, currentStepIndex]);

  const startMainPanelTour = useCallback(
    (options?: { reset?: boolean }) => {
      if (!userId) return;
      if (options?.reset) {
        setHasBeenCompleted(false);
        setHasBeenSkipped(false);
      }
      setCurrentStepIndex(0);
      setIsOpen(true);
    },
    [userId],
  );

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, tour.steps.length - 1));
  }, [tour.steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const skipTour = useCallback(() => {
    setIsOpen(false);
    setHasBeenSkipped(true);
  }, []);

  const finishTour = useCallback(() => {
    setIsOpen(false);
    setHasBeenCompleted(true);
  }, []);

  const value = useMemo(
    () => ({
      tour,
      currentStepIndex,
      isOpen,
      hasBeenCompleted,
      hasBeenSkipped,
      isReady,
      startMainPanelTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
    }),
    [
      tour,
      currentStepIndex,
      isOpen,
      hasBeenCompleted,
      hasBeenSkipped,
      isReady,
      startMainPanelTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingOverlay />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
