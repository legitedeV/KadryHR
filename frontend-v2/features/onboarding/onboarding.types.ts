export type OnboardingStepId =
  | "schedule"
  | "availability"
  | "time-tracking"
  | "team-and-roles"
  | "help-and-consulting";

export type OnboardingTargetId =
  | "nav-schedule"
  | "nav-availability"
  | "nav-time-tracking"
  | "nav-employees"
  | "nav-help";

export type OnboardingActionType = "go-to-module" | "finish";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  targetId?: OnboardingTargetId;
  moduleRouteName?: string;
  primaryActionType?: OnboardingActionType;
}

export interface OnboardingTourConfig {
  id: "main-panel-tour";
  title: string;
  steps: OnboardingStep[];
}

export interface OnboardingState {
  completed: boolean;
  skipped: boolean;
  lastStepIndex?: number;
  completedAt?: string;
}
