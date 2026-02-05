export type ScheduleContextMenuAction =
  | "add-shift"
  | "add-leave"
  | "edit-shift"
  | "delete-shift"
  | "request-swap";

export interface ScheduleContextMenuOption {
  id: ScheduleContextMenuAction;
  label: string;
  destructive?: boolean;
}

export function getScheduleContextMenuOptions(params: {
  canManage: boolean;
  hasShift: boolean;
  isOwnShift: boolean;
}): ScheduleContextMenuOption[] {
  const { canManage, hasShift, isOwnShift } = params;

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
    ];
  }

  if (hasShift && isOwnShift) {
    return [{ id: "request-swap", label: "Poproś o zamianę zmiany" }];
  }

  return [];
}
