"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentSchema = void 0;
const zod_1 = require("zod");
const createCommentSchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    isInternal: zod_1.z.boolean().optional().default(false),
});
exports.createCommentSchema = createCommentSchema;
