export type ScheduleContextMenuAction =
  | "add-shift"
  | "add-leave"
  | "mark-day-off"
  | "edit-shift"
  | "delete-shift"
  | "request-swap"
  | "move-up"
  | "move-down";

export interface ScheduleContextMenuOption {
  id: ScheduleContextMenuAction;
  label: string;
  destructive?: boolean;
}

export function getScheduleContextMenuOptions(params: {
  canManage: boolean;
  hasShift: boolean;
  isOwnShift: boolean;
  isPublished: boolean;
}): ScheduleContextMenuOption[] {
  const { canManage, hasShift, isOwnShift, isPublished } = params;

  if (isPublished) {
    return [];
  }

  if (canManage) {
    if (hasShift) {
      return [
        { id: "edit-shift", label: "Edytuj zmianę" },
        { id: "delete-shift", label: "Usuń zmianę", destructive: true },
      ];
    }

    return [
      { id: "add-shift", label: "Dodaj zmianę" },
      { id: "add-leave", label: "Dodaj urlop" },
      { id: "mark-day-off", label: "Oznacz jako dzień wolny" },
    ];
  }

  if (hasShift && isOwnShift) {
    return [{ id: "request-swap", label: "Poproś o zamianę zmiany" }];
  }

  return [];
}
