import asyncHandler from "../utils/asyncHandler";
import { exportSummaryCsv, getSummary } from "../services/reportService";

const summary = asyncHandler(async (req, res) => {
  const data = await getSummary();
  res.json({ success: true, data });
});

const exportCsv = asyncHandler(async (req, res) => {
  const csv = await exportSummaryCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=report-summary.csv");
  res.status(200).send(csv);
});

export { summary, exportCsv };
