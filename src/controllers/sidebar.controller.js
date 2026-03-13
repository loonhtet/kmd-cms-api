import { prisma } from "../config/db.js";

const getSidebar = async (req, res) => {
  try {
    const { role } = req.query;

    const whereClause = role ? { role } : {};

    const permissions = await prisma.sidebar.findMany({
      where: whereClause,
      select: { tab: true },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      status: "success",
      data: {
        role: role || null,
        tabs: permissions.map((p) => p.tab),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch sidebar permissions",
      error: error.message,
    });
  }
};

export { getSidebar };
