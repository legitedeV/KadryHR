import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar, buildAvatarFallback } from "./Avatar";

test("renders avatar image when source is provided", () => {
  const html = renderToStaticMarkup(
    <Avatar name="Anna Kowalska" src="https://example.com/avatar.jpg" />, // image rendered server-side
  );

  assert(html.includes("avatar.jpg"));
  assert(html.includes("Anna Kowalska"));
});

test("falls back to initials and deterministic color classes when no image", () => {
  const html = renderToStaticMarkup(<Avatar name="Sebastian Aluk" />);

  assert(html.includes("SA"));
  const fallback = buildAvatarFallback("Sebastian Aluk");
  assert(html.includes(fallback.colorClass.split(" ")[0]!));
});
