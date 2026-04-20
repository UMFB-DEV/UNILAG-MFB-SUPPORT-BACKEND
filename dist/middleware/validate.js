"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (schema, source = "body") => (req, res, next) => {
    const parsed = schema.parse(req[source]);
    req[source] = parsed;
    next();
};
exports.default = validate;
