const validateRequest = (schema) => (req, res, next) => {
     const result = schema.safeParse(req.body);

     if (!result.success) {
          const errorMesages = result.error.errors.map((err) => err.message);
          const error = errorMesages.join(", ");
          return res.status(400).json({ status: "error", message: error });
     }

     next();
};

export default validateRequest;
