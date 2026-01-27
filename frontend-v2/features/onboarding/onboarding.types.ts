export type OnboardingStepId =
  | "schedule"
  | "availability"
  | "time-tracking"
  | "team-and-roles"
  | "help-and-consulting"
  | "schedule-overview"
  | "schedule-add-shift"
  | "schedule-publish"
  | "schedule-summary";

export type OnboardingTargetId =
  | "nav-schedule"
  | "nav-availability"
  | "nav-time-tracking"
  | "nav-employees"
  | "nav-help"
  | "schedule-grid"
  | "schedule-add-shift"
  | "schedule-publish"
  | "schedule-summary";

export type OnboardingActionType = "go-to-module" | "finish";

export type OnboardingTourId = "main-panel-tour" | "schedule-v2-tour";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  targetId?: OnboardingTargetId;
  moduleRouteName?: string;
  primaryActionType?: OnboardingActionType;
}

export interface OnboardingTourConfig {
  id: OnboardingTourId;
  title: string;
  steps: OnboardingStep[];
}

export interface OnboardingState {
  completed: boolean;
  skipped: boolean;
  lastStepIndex?: number;
  completedAt?: string;
}
