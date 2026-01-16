import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandLogoStatic } from "./BrandLogoStatic";

test("renders full brand logo with wordmark", () => {
  const html = renderToStaticMarkup(
    <BrandLogoStatic size={48} variant="full" withPL ariaLabel="KadryHR" />,
  );

  assert(html.includes("Kadry"));
  assert(html.includes(".PL"));
  assert(html.includes("viewBox=\"0 0 320 96\""));
});

test("renders icon-only brand logo", () => {
  const html = renderToStaticMarkup(
    <BrandLogoStatic size={32} variant="icon" ariaLabel="KadryHR" />,
  );

  assert(html.includes("viewBox=\"0 0 72 72\""));
});
