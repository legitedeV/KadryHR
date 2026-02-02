import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandLogoStatic } from "./BrandLogoStatic";

test("renders full brand logo with image source", () => {
  const html = renderToStaticMarkup(
    <BrandLogoStatic size={48} variant="full" withPL ariaLabel="KadryHR" />,
  );

  assert(html.includes("/brand/kadryhr-logo.png"));
  assert(html.includes('width="72"'));
  assert(html.includes('height="48"'));
});

test("renders icon-only brand logo", () => {
  const html = renderToStaticMarkup(
    <BrandLogoStatic size={32} variant="icon" ariaLabel="KadryHR" />,
  );

  assert(html.includes("/brand/kadryhr-logo-square.png"));
  assert(html.includes('width="32"'));
  assert(html.includes('height="32"'));
});
