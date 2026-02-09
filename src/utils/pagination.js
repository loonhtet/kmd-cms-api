const paginate = async (model, req, options = {}) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const total = await model.count({ where: options.where });

  const data = await model.findMany({
    ...options,
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      count: data.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export default paginate;
