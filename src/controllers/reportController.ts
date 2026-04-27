import asyncHandler from "../utils/asyncHandler";
import { exportSummaryCsv, getSummary } from "../services/reportService";

const summary = asyncHandler(async (req, res) => {
  const rangeParam = typeof req.query.range === "string" ? req.query.range : undefined;
  const range = rangeParam === "today" || rangeParam === "week" || rangeParam === "month" ? rangeParam : undefined;

  const data = await getSummary({
    range,
    startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
  });
  res.json({ success: true, data });
});

const exportCsv = asyncHandler(async (req, res) => {
  const csv = await exportSummaryCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=report-summary.csv");
  res.status(200).send(csv);
});

export { summary, exportCsv };
