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
import { OnboardingTourConfig } from "./onboarding.types";
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

type OnboardingProviderProps = {
  userId: string;
  children: ReactNode;
};

export function OnboardingProvider({ userId, children }: OnboardingProviderProps) {
  const tour = mainPanelTour;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenCompleted, setHasBeenCompleted] = useState(() => {
    if (typeof window === "undefined" || !userId) return false;
    try {
      const stored = window.localStorage.getItem(getStorageKey(userId, tour.id));
      if (!stored) return false;
      const parsed = JSON.parse(stored) as { completed?: boolean };
      return Boolean(parsed.completed);
    } catch {
      return false;
    }
  });
  const [hasBeenSkipped, setHasBeenSkipped] = useState(() => {
    if (typeof window === "undefined" || !userId) return false;
    try {
      const stored = window.localStorage.getItem(getStorageKey(userId, tour.id));
      if (!stored) return false;
      const parsed = JSON.parse(stored) as { skipped?: boolean };
      return Boolean(parsed.skipped);
    } catch {
      return false;
    }
  });
  const isReady = typeof window !== "undefined" && Boolean(userId);

  useEffect(() => {
    if (!userId) return;
    const storageKey = getStorageKey(userId, tour.id);
    const payload = JSON.stringify({
      completed: hasBeenCompleted,
      skipped: hasBeenSkipped,
    });
    window.localStorage.setItem(storageKey, payload);
  }, [hasBeenCompleted, hasBeenSkipped, tour.id, userId]);

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
