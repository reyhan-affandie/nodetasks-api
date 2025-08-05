/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import { fields } from "@/models/events.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";

const Model = "events";
const model = getPrismaModel(Model);
const Parent = "users";
const ParentSingular = "user";
const parentModel = getPrismaModel(Parent);

const computeOverlap = (events: any[]) => {
  const overlaps = events.map((event, i) => {
    const currentStart = parseInt(event.startTime.split(":"[0])) || 0;
    const currentEnd = parseInt(event.endTime.split(":"[0])) || 0;
    let overlapCount = 1;
    let overlapOrder = 1;

    for (let j = 0; j < events.length; j++) {
      if (i === j) continue;
      const otherStart = parseInt(events[j].startTime.split(":"[0])) || 0;
      const otherEnd = parseInt(events[j].endTime.split(":"[0])) || 0;
      const isOverlap = !(currentEnd <= otherStart || currentStart >= otherEnd);
      if (isOverlap) overlapCount++;
      if (isOverlap && j < i) overlapOrder++;
    }
    return { ...event, overlapOrder, overlapCount };
  });
  return overlaps;
};

export const get: RequestHandler = async (req, res, next) => {
  try {
    const result = await engineGet(Model, fields, req);
    console.log("result", result);
    if (Array.isArray(result)) {
      const enriched = computeOverlap(result);
      res.status(OK).json(enriched);
    } else {
      res.status(OK).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const getOne: RequestHandler = async (req, res, next) => {
  if (!model) {
    return next(createHttpError(BAD_REQUEST, "Invalid model name."));
  }
  try {
    const id = req.params.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      return next(createHttpError(BAD_REQUEST, "Invalid module ID."));
    }
    const include: Record<string, boolean> = {};
    include[ParentSingular] = true;

    const result = await model.findUnique({
      where: { id: idNumber },
      include,
    });
    if (!result) {
      return next(createHttpError(NOT_FOUND));
    }
    const siblingEvents = await model.findMany({
      where: {
        userId: result.userId,
        dataDate: result.dataDate,
      },
    });
    const enriched = computeOverlap(siblingEvents).find((e) => e.id === result.id);
    res.status(OK).json(enriched);
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);
    const checkParent = await parentModel.findUnique({
      where: { id: Number(requestValues[ParentSingular]) },
    });
    if (!checkParent) {
      return next(createHttpError(NOT_FOUND, `Parent data not found: ${Parent}`));
    }
    if (requestValues[ParentSingular]) {
      requestValues[ParentSingular] = { connect: { id: Number(requestValues[ParentSingular]) } };
    }
    const result = await model.create({ data: requestValues as any });
    res.status(CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  if (!model) {
    return next(createHttpError(BAD_REQUEST, "Invalid model name."));
  }
  try {
    const id = req.body.id;
    const data = await model.findUnique({ where: { id: Number(id) } });
    if (!data) {
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);
    requestValues[ParentSingular] = { connect: { id: Number(requestValues[ParentSingular]) } };
    const result = await model.update({
      data: requestValues,
      where: { id: Number(id) },
    });
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const status: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }
  try {
    const id = req.body.id;
    const statusInput = req.body.status;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid status value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const del: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      return next(createHttpError(BAD_REQUEST, "Invalid module ID."));
    }
    const data = await model.findUnique({ where: { id: idNumber } });
    if (!data) {
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    const result = await model.delete({ where: { id: idNumber } });
    res.status(OK).json(result);
  } catch (error) {
    return next(error);
  }
};

export const bulkDel: RequestHandler = async (req, res, next) => {
  try {
    let ids = req.body.ids;
    if (typeof ids === "string") {
      ids = ids.split(",").map((id: string) => id.trim());
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(createHttpError(BAD_REQUEST, "Invalid IDs"));
    }
    const invalidIds = ids.filter((id) => !Number.isSafeInteger(Number(id)));
    if (invalidIds.length > 0) {
      return next(createHttpError(BAD_REQUEST, `Invalid IDs: ${invalidIds.join(", ")}`));
    }
    const validIds = ids.map((id) => Number(id));
    const existingRecords = await model.findMany({ where: { id: { in: validIds } } });
    if (existingRecords.length === 0) {
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    const parentIdSet = new Set(existingRecords.map((r) => r[ParentSingular]));
    if (parentIdSet.size > 1) {
      return next(createHttpError(BAD_REQUEST, `cannot bulk delete ${Model} with multiple ${ParentSingular} ids`));
    }
    await model.deleteMany({ where: { id: { in: validIds } } });
    res.status(OK).json(existingRecords);
  } catch (error) {
    return next(error);
  }
};
