// Validates req.body against a zod schema, replacing the ad hoc
// `if (!field) return res.status(400)...` checks that used to be duplicated
// across every controller. On success, req.body is replaced with the parsed
// (type-coerced/defaulted) value.
module.exports = function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      return res.status(400).json({ error: message });
    }
    req.body = result.data;
    next();
  };
};
