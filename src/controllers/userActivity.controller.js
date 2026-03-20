import { prisma } from "../config/db.js";
import { UAParser } from "ua-parser-js";

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getLeaderboardRows = async ({ skip = 0, take = 10 } = {}) => {
  return prisma.$queryRaw`
    SELECT
      ua."userId",
      u."name",
      ur."role",
      COUNT(*)::int AS "totalVisits"
    FROM "UserActivity" ua
    JOIN "User" u ON u."id" = ua."userId"
    LEFT JOIN "UserRole" ur ON ur."userId" = u."id"
    GROUP BY ua."userId", u."name", ur."role"
    ORDER BY COUNT(*) DESC, ua."userId" ASC
    OFFSET ${skip}
    LIMIT ${take}
  `;
};

const getActivityDetailRows = async ({ skip = 0, take = 10 } = {}) => {
  return prisma.$queryRaw`
    SELECT
      "page",
      "browser",
      COUNT(*)::int AS "activityCount"
    FROM "UserActivity"
    GROUP BY "page", "browser"
    ORDER BY COUNT(*) DESC, "page" ASC, "browser" ASC
    OFFSET ${skip}
    LIMIT ${take}
  `;
};

const fetchActivityStats = async () => {
  const [stats] = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS "totalActivities",
      COUNT(DISTINCT "page")::int AS "uniquePageCount",
      COUNT(DISTINCT "browser")::int AS "uniqueBrowserCount"
    FROM "UserActivity"
  `;

  return {
    totalActivities: stats?.totalActivities ?? 0,
    uniquePageCount: stats?.uniquePageCount ?? 0,
    uniqueBrowserCount: stats?.uniqueBrowserCount ?? 0,
  };
};

const getTotalActiveUsers = async () => {
  const [result] = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "userId")::int AS "total"
    FROM "UserActivity"
  `;

  return result?.total ?? 0;
};

const getTotalActivityDetails = async () => {
  const [result] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS "total"
    FROM (
      SELECT "page", "browser"
      FROM "UserActivity"
      GROUP BY "page", "browser"
    ) detail_groups
  `;

  return result?.total ?? 0;
};

const mapLeaderboardRows = (rows, skip = 0) => {
  return rows.map((row, index) => ({
    rank: skip + index + 1,
    userId: row.userId,
    name: row.name,
    role: row.role,
    totalVisits: row.totalVisits,
  }));
};

const mapDetailRows = (rows) => {
  return rows.map((row) => ({
    page: row.page,
    browser: row.browser,
    activityCount: row.activityCount,
  }));
};

const buildPagination = ({ page, limit, total, count }) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    total,
    count,
    page,
    limit,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
};

export const getActivities = async (req, res) => {
  try {
    const [stats, leaderboardRows, detailRows] = await Promise.all([
      fetchActivityStats(),
      getLeaderboardRows({ take: 10 }),
      getActivityDetailRows({ take: 10 }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        leaderboard: mapLeaderboardRows(leaderboardRows),
        details: mapDetailRows(detailRows),
        ...stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user activities",
      error: error.message,
    });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const stats = await fetchActivityStats();

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch activity stats",
      error: error.message,
    });
  }
};

export const getActivityLeaderboard = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [rows, total] = await Promise.all([
      getLeaderboardRows({ skip, take: limit }),
      getTotalActiveUsers(),
    ]);

    const data = mapLeaderboardRows(rows, skip);

    res.status(200).json({
      status: "success",
      data: {
        data,
        pagination: buildPagination({
          total,
          count: data.length,
          page,
          limit,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch activity leaderboard",
      error: error.message,
    });
  }
};

export const getActivityDetails = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [rows, total] = await Promise.all([
      getActivityDetailRows({ skip, take: limit }),
      getTotalActivityDetails(),
    ]);

    const data = mapDetailRows(rows);

    res.status(200).json({
      status: "success",
      data: {
        data,
        pagination: buildPagination({
          total,
          count: data.length,
          page,
          limit,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch activity details",
      error: error.message,
    });
  }
};

export const createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page } = req.body;
    const ua = req.headers["user-agent"];
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const browser = result.browser.name || "Unknown Browser";

    const created = await prisma.userActivity.create({
      data: {
        userId,
        page,
        browser,
      },
    });

    res.status(201).json({
      status: "success",
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
