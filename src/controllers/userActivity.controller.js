import { prisma } from "../config/db.js";
import { UAParser } from "ua-parser-js";


export const getActivities = async (req, res) => {
  try {
    const result = await prisma.userActivity.groupBy({
      by: ['page', 'browser'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    const summary = result.map(r => ({
      page: r.page,
      browser: r.browser,
      activity_count: r._count.id
    }));``

    const totalActivities = await prisma.userActivity.count();
    const  uniquePages = await prisma.userActivity.groupBy({
      by: ['page'],
    });
    const uniquePageCount = uniquePages.length; 
    const uniqueBrowsers = await prisma.userActivity.groupBy({
      by: ['browser'],
    });
    const uniqueBrowserCount = uniqueBrowsers.length; 

    res.status(200).json({
      status: "success",
      data: {summary, totalActivities, uniquePageCount, uniqueBrowserCount},
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch Messages",
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

    const browser = result.browser.name ? result.browser.name : "Unknown Browser";


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
