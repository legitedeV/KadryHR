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
import { mainScheduleTour } from "./scheduleTour";
import { OnboardingTourConfig, OnboardingState, OnboardingTourId } from "./onboarding.types";
import { OnboardingOverlay } from "./OnboardingOverlay";

const STORAGE_PREFIX = "kadryhr:onboarding";

const TOURS: Record<OnboardingTourId, OnboardingTourConfig> = {
  [mainPanelTour.id]: mainPanelTour,
  [mainScheduleTour.id]: mainScheduleTour,
};

type OnboardingContextValue = {
  tour: OnboardingTourConfig;
  currentStepIndex: number;
  isOpen: boolean;
  hasBeenCompleted: boolean;
  hasBeenSkipped: boolean;
  hasScheduleTourCompleted: boolean;
  hasScheduleTourSkipped: boolean;
  isReady: boolean;
  startMainPanelTour: (options?: { reset?: boolean }) => void;
  startScheduleTour: (options?: { reset?: boolean }) => void;
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
  const [activeTourId, setActiveTourId] = useState<OnboardingTourId>(mainPanelTour.id);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [tourStates, setTourStates] = useState<Record<OnboardingTourId, OnboardingState>>(() => {
    return {
      [mainPanelTour.id]: getStoredState(userId, mainPanelTour.id) ?? {
        completed: false,
        skipped: false,
      },
      [mainScheduleTour.id]: getStoredState(userId, mainScheduleTour.id) ?? {
        completed: false,
        skipped: false,
      },
    };
  });
  const isReady = typeof window !== "undefined" && Boolean(userId);

  useEffect(() => {
    if (!userId) return;
    const activeTour = TOURS[activeTourId];
    const existingState = getStoredState(userId, activeTour.id);
    const state = tourStates[activeTourId];
    const payload: OnboardingState = {
      completed: state?.completed ?? false,
      skipped: state?.skipped ?? false,
      lastStepIndex: currentStepIndex,
      completedAt:
        state?.completed ? existingState?.completedAt ?? new Date().toISOString() : undefined,
    };
    window.localStorage.setItem(getStorageKey(userId, activeTour.id), JSON.stringify(payload));
  }, [activeTourId, currentStepIndex, tourStates, userId]);

  const startMainPanelTour = useCallback(
    (options?: { reset?: boolean }) => {
      if (!userId) return;
      setActiveTourId(mainPanelTour.id);
      if (options?.reset) {
        setTourStates((prev) => ({
          ...prev,
          [mainPanelTour.id]: { completed: false, skipped: false },
        }));
      }
      setCurrentStepIndex(0);
      setIsOpen(true);
    },
    [userId],
  );

  const startScheduleTour = useCallback(
    (options?: { reset?: boolean }) => {
      if (!userId) return;
      setActiveTourId(mainScheduleTour.id);
      if (options?.reset) {
        setTourStates((prev) => ({
          ...prev,
          [mainScheduleTour.id]: { completed: false, skipped: false },
        }));
      }
      setCurrentStepIndex(0);
      setIsOpen(true);
    },
    [userId],
  );

  const nextStep = useCallback(() => {
    const activeTour = TOURS[activeTourId];
    setCurrentStepIndex((prev) => Math.min(prev + 1, activeTour.steps.length - 1));
  }, [activeTourId]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const skipTour = useCallback(() => {
    setIsOpen(false);
    setTourStates((prev) => ({
      ...prev,
      [activeTourId]: {
        ...prev[activeTourId],
        skipped: true,
      },
    }));
  }, [activeTourId]);

  const finishTour = useCallback(() => {
    setIsOpen(false);
    setTourStates((prev) => ({
      ...prev,
      [activeTourId]: {
        ...prev[activeTourId],
        completed: true,
        skipped: false,
        completedAt: new Date().toISOString(),
      },
    }));
  }, [activeTourId]);

  const value = useMemo(
    () => ({
      tour: TOURS[activeTourId],
      currentStepIndex,
      isOpen,
      hasBeenCompleted: Boolean(tourStates[mainPanelTour.id]?.completed),
      hasBeenSkipped: Boolean(tourStates[mainPanelTour.id]?.skipped),
      hasScheduleTourCompleted: Boolean(tourStates[mainScheduleTour.id]?.completed),
      hasScheduleTourSkipped: Boolean(tourStates[mainScheduleTour.id]?.skipped),
      isReady,
      startMainPanelTour,
      startScheduleTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
    }),
    [
      activeTourId,
      currentStepIndex,
      isOpen,
      tourStates,
      isReady,
      startMainPanelTour,
      startScheduleTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingOverlay
        tour={value.tour}
        currentStepIndex={value.currentStepIndex}
        isOpen={value.isOpen}
        nextStep={value.nextStep}
        prevStep={value.prevStep}
        skipTour={value.skipTour}
        finishTour={value.finishTour}
      />
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
