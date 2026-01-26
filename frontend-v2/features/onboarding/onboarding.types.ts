export type OnboardingStepId =
  | "schedule"
  | "availability"
  | "time-tracking"
  | "team-and-roles"
  | "help-and-consulting";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
}

export interface OnboardingTourConfig {
  id: "main-panel-tour";
  title: string;
  steps: OnboardingStep[];
}
