import assert from "node:assert/strict";
import test from "node:test";
import { extractBreakMinutes, mergeNotesWithBreak } from "@/features/schedule-v2/schedule-utils";

test("mergeNotesWithBreak appends break minutes to notes", () => {
  const notes = "Zmiana poranna";
  const merged = mergeNotesWithBreak(notes, 30);
  assert(merged.includes("Zmiana poranna"));
  assert(merged.includes("Przerwa: 30 min"));
});

test("extractBreakMinutes reads break minutes from notes", () => {
  const notes = "Przerwa: 45 min\nDodatkowe info";
  assert.equal(extractBreakMinutes(notes), 45);
});
