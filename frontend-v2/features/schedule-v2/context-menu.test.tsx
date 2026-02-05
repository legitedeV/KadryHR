import assert from "node:assert/strict";
import test from "node:test";
import { getScheduleContextMenuOptions } from "@/features/schedule-v2/context-menu";

test("manager sees add options on empty cell", () => {
  const options = getScheduleContextMenuOptions({
    canManage: true,
    hasShift: false,
    isOwnShift: false,
  });
  assert.deepEqual(
    options.map((option) => option.id),
    ["add-shift", "add-leave", "mark-day-off"],
  );
});

test("manager sees edit/delete on filled cell", () => {
  const options = getScheduleContextMenuOptions({
    canManage: true,
    hasShift: true,
    isOwnShift: false,
  });
  assert.deepEqual(
    options.map((option) => option.id),
    ["edit-shift", "delete-shift"],
  );
});

test("employee sees swap request only on own shift", () => {
  const options = getScheduleContextMenuOptions({
    canManage: false,
    hasShift: true,
    isOwnShift: true,
  });
  assert.deepEqual(options.map((option) => option.id), ["request-swap"]);
});
