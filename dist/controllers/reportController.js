"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCsv = exports.summary = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const reportService_1 = require("../services/reportService");
const summary = (0, asyncHandler_1.default)(async (req, res) => {
    const rangeParam = typeof req.query.range === "string" ? req.query.range : undefined;
    const range = rangeParam === "today" || rangeParam === "week" || rangeParam === "month" ? rangeParam : undefined;
    const data = await (0, reportService_1.getSummary)({
        range,
        startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
    });
    res.json({ success: true, data });
});
exports.summary = summary;
const exportCsv = (0, asyncHandler_1.default)(async (req, res) => {
    const csv = await (0, reportService_1.exportSummaryCsv)();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=report-summary.csv");
    res.status(200).send(csv);
});
exports.exportCsv = exportCsv;
