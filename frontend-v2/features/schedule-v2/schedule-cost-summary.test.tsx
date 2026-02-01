import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleCostSummaryBar } from "./ScheduleCostSummaryBar";

test("ScheduleCostSummaryBar renders totals", () => {
  const html = renderToStaticMarkup(
    <ScheduleCostSummaryBar
      summary={{
        range: { from: "2024-02-01", to: "2024-02-07" },
        totals: {
          hours: 120,
          cost: 4800,
          currency: "PLN",
          shiftsCount: 20,
          shiftsWithoutRate: 2,
          employeesWithoutRate: 1,
        },
        byDay: [{ date: "2024-02-01", hours: 16, cost: 640 }],
      }}
    />,
  );

  assert.ok(html.includes("Godziny"));
  assert.ok(html.includes("120.0 h"));
  assert.ok(html.includes("Koszt"));
});
