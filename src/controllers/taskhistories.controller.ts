import { RequestHandler } from "express";
import { fields } from "@/models/taskhistories.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, NOT_FOUND, OK } from "@/constants/http";
import { engineGet } from "@/middleware/engine.middleware";
import { getPrismaModel } from "@/utils/prisma";

const Model = "taskhistories";
const model = getPrismaModel(Model);

// FK includes (for your schema):
const Parent1Singular = "task";
const Parent2Singular = "fromPhase";
const Parent3Singular = "toPhase";
const Parent4Singular = "changedBy";

// GET ALL
export const get: RequestHandler = async (req, res, next) => {
  try {
    const result = await engineGet(Model, fields, req);
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

// GET ONE
export const getOne: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = req.params.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      throw createHttpError(BAD_REQUEST, "Invalid module ID.");
    }

    // include all related FKs, follow your schema!
    const include: Record<string, boolean> = {};
    include[Parent1Singular] = true; // task
    include[Parent2Singular] = true; // fromPhase (nullable)
    include[Parent3Singular] = true; // toPhase
    include[Parent4Singular] = true; // changedBy

    const result = await model.findUnique({
      where: { id: idNumber },
      include,
    });
    if (!result) throw createHttpError(NOT_FOUND);
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};
