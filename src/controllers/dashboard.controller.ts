import { RequestHandler } from "express";
import { getPrismaModel } from "@/utils/prisma";
import { OK } from "@/constants/http";

const tasksModel = getPrismaModel("tasks");
const phasesModel = getPrismaModel("phases");

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    // 1. Get total task count
    const total = await tasksModel.count();

    // 2. Get all phases
    const phases = await phasesModel.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" }
    });

    // 3. Get count of tasks per phase (use groupBy if your ORM supports, else do manually)
    const phaseCounts: Record<string, number> = {};
    for (const phase of phases) {
      // For each phase, count how many tasks are in it
      const count = await tasksModel.count({ where: { phaseId: phase.id } });
      phaseCounts[phase.name] = count;
    }

    res.status(OK).json({
      total,
      phases: phaseCounts,
    });
  } catch (error) {
    return next(error);
  }
};
