import { ZodError } from "zod";

export const validate = (schema) => (req, res, next) => {
    try {
        const parsedData = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Replace or mutate data with validated parsed data
        if (parsedData.body) {
            req.body = parsedData.body;
        }
        if (parsedData.query) {
            Object.keys(req.query || {}).forEach(k => delete req.query[k]);
            Object.assign(req.query, parsedData.query);
        }
        if (parsedData.params) {
            Object.keys(req.params || {}).forEach(k => delete req.params[k]);
            Object.assign(req.params, parsedData.params);
        }

        next();
    } catch (err) {
        if (err instanceof ZodError) {
            const errorDetails = (err.issues || err.errors || []).map((e) => ({
                field: e.path.join("."),
                message: e.message,
            }));
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errorDetails,
            });
        }
        next(err);
    }
};
