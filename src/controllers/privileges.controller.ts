/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import { fields } from "@/models/privileges.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";
import { v4 as uuidv4 } from "uuid";

const Model = "privileges";
const model = getPrismaModel(Model);
const Parent = "roles";
const ParentSingular = "role";
const parentModel = getPrismaModel(Parent);
const Parent2 = "features";
const Parent2Singular = "feature";
const parent2Model = getPrismaModel(Parent2);

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
    const include: Record<string, boolean> = {};
    include[ParentSingular] = true;
    include[Parent2Singular] = true;

    const result = await model.findUnique({
      where: { id: Number(id) },
      include,
    });
    if (!result) {
      throw createHttpError(NOT_FOUND);
    }
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

const validateAndConnectParent = async (model: any, key: string, value: any, label: string) => {
  const found = await model.findUnique({ where: { id: Number(value) } });
  if (!found) throw createHttpError(BAD_REQUEST, `Parent data not found: ${label}`);
  return { connect: { id: Number(value) } };
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    req.body.name = uuidv4();
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);
    requestValues[ParentSingular] = await validateAndConnectParent(parentModel, ParentSingular, requestValues[ParentSingular], Parent);
    requestValues[Parent2Singular] = await validateAndConnectParent(parent2Model, Parent2Singular, requestValues[Parent2Singular], Parent2);
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
    req.body.name = data.name;
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);
    const checkParent1 = await parentModel.findUnique({ where: { id: Number(requestValues[ParentSingular]) } });
    const checkParent2 = await parent2Model.findUnique({ where: { id: Number(requestValues[Parent2Singular]) } });
    if (!checkParent1 || !checkParent2) {
      throw createHttpError(BAD_REQUEST, `Parent data not found.`);
    }
    requestValues[ParentSingular] = { connect: { id: Number(requestValues[ParentSingular]) } };
    requestValues[Parent2Singular] = { connect: { id: Number(requestValues[Parent2Singular]) } };
    const result = await model.update({
      data: requestValues as any,
      where: { id: Number(id) },
    });
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const privilegeCreate: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.privilegeCreate;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid privilege value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { privilegeCreate: status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const privilegeRead: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.privilegeRead;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid privilege value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { privilegeRead: status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const privilegeUpdate: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.privilegeUpdate;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid privilege value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { privilegeUpdate: status },
      where: { id: Number(id) },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const privilegeDelete: RequestHandler = async (req, res, next) => {
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }

  try {
    const id = req.body.id;
    const statusInput = req.body.privilegeDelete;

    const status = statusInput === true || statusInput === "true" ? true : statusInput === false || statusInput === "false" ? false : null;

    if (status === null) {
      throw createHttpError(BAD_REQUEST, "Invalid privilege value.");
    }

    const data = await model.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      throw createHttpError(NOT_FOUND, `${Model} not found.`);
    }

    const result = await model.update({
      data: { privilegeDelete: status },
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
    const allCount = await model.count({
      where: {
        id: idNumber,
      },
    });
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
