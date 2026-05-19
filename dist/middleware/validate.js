"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (schema, source = "body") => (req, res, next) => {
    const parsed = schema.parse(req[source]);
    if (source === "body") {
        req[source] = parsed;
        next();
        return;
    }
    const target = req[source];
    if (target && typeof target === "object" && parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        next();
        return;
    }
    req[source] = parsed;
    next();
};
exports.default = validate;
