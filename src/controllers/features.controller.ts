/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import { fields } from "@/models/features.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";

const Model = "features";
const model = getPrismaModel(Model);

export const get: RequestHandler = async (req, res, next) => {
  try {
    const result = await engineGet(Model, fields, req);
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOne: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }
  try {
    const id = req.params.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      throw createHttpError(BAD_REQUEST, "Invalid module ID.");
    }
    const result = await model.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!result) {
      throw createHttpError(NOT_FOUND);
    }
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);
    const result = await model.create({
      data: requestValues as any,
    });
    res.status(CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }
  try {
    const id = req.body.id;
    const data = await model.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!data) {
      throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);
    }
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);
    const result = await model.update({
      data: requestValues as any,
      where: { id: Number(id) },
    });
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const featureCreate: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.featureCreate;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid feature value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { featureCreate: status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const featureRead: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.featureRead;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid feature value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { featureRead: status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const featureUpdate: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.featureUpdate;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid feature value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { featureUpdate: status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const featureDelete: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.featureDelete;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid feature value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { featureDelete: status },
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
      throw createHttpError(BAD_REQUEST, "Invalid module ID.");
    }
    const data = await model.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!data) {
      throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);
    }

    const allCount = await model.count();
    if (allCount <= 1) {
      throw createHttpError(BAD_REQUEST, `${Model} must be at least have 1 data.`);
    }
    const result = await model.delete({
      where: { id: Number(id) },
    });
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
      throw createHttpError(BAD_REQUEST, "Invalid IDs");
    }
    const invalidIds = ids.filter((id) => !Number.isSafeInteger(Number(id)));
    if (invalidIds.length > 0) {
      throw createHttpError(BAD_REQUEST, `Invalid IDs: ${invalidIds.join(", ")}`);
    }
    const validIds = ids.map((id) => Number(id));
    const existingRecords = await model.findMany({
      where: {
        id: { in: validIds },
      },
    });
    if (existingRecords.length === 0) {
      throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);
    }
    await model.deleteMany({
      where: {
        id: { in: validIds },
      },
    });
    res.status(OK).json(existingRecords);
  } catch (error) {
    return next(error);
  }
};
