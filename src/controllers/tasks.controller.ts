/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import { fields } from "@/models/tasks.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK, UNAUTHORIZED } from "@/constants/http";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { cleanupUploadedFiles, validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";
import { deleteFiles } from "@/utils/unlink";
import { checkIsAdmin, getAuthUser } from "@/middleware/auth.middleware";
import { v4 as uuidv4 } from "uuid";

const Model = "tasks";
const model = getPrismaModel(Model);

const Parent1 = "users";
const Parent1Singular = "author";
const parent1Model = getPrismaModel(Parent1);

const Parent2 = "users";
const Parent2Singular = "assignee";
const parent2Model = getPrismaModel(Parent2);

// Parent3 is priorities!
const Parent3 = "priorities";
const Parent3Singular = "priority";
const parent3Model = getPrismaModel(Parent3);

// Parent4 is phases!
const Parent4 = "phases";
const Parent4Singular = "phase";
const parent4Model = getPrismaModel(Parent4);

const Child = "taskhistories";
const childModel = getPrismaModel(Child);

export const get: RequestHandler = async (req, res, next) => {
  try {
    const result = await engineGet(Model, fields, req);
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOne: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = req.params.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      throw createHttpError(BAD_REQUEST, "Invalid module ID.");
    }
    const include: Record<string, boolean> = {};
    include[Parent1Singular] = true;
    include[Parent2Singular] = true;
    include[Parent3Singular] = true;
    include[Parent4Singular] = true;
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
    const user = await getAuthUser(req);
    req.body[Parent1Singular] = user.id;
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);

    requestValues[Parent1Singular] = await validateAndConnectParent(parent1Model, Parent1Singular, requestValues[Parent1Singular], Parent1);
    if (req.body[Parent2Singular]) {
      requestValues[Parent2Singular] = await validateAndConnectParent(parent2Model, Parent2Singular, requestValues[Parent2Singular], Parent2);
    }
    requestValues[Parent3Singular] = await validateAndConnectParent(parent3Model, Parent3Singular, requestValues[Parent3Singular], Parent3);
    requestValues[Parent4Singular] = await validateAndConnectParent(parent4Model, Parent4Singular, requestValues[Parent4Singular], Parent4);

    const result = await model.create({
      data: requestValues as any,
    });

    await childModel.create({
      data: {
        task: { connect: { id: result.id } },
        toPhase: { connect: { id: result.phaseId } },
        changedBy: { connect: { id: user.id } },
        name: uuidv4(),
      },
    });
    res.status(CREATED).json(result);
  } catch (error) {
    if (req.files) cleanupUploadedFiles(req);
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = req.body.id;
    const data = await model.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!data) {
      if (req.files) cleanupUploadedFiles(req);
      throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);
    }
    const filesToDelete: any = {};
    for (const key of Object.keys(fields)) {
      if (fields[key].isImage || fields[key].isFile) {
        const existingFile = data[key];
        const newFile = req.files[key];
        const patchValue = req.body[key];
        if (newFile && newFile !== existingFile) {
          filesToDelete[key] = existingFile;
        }
        if (!newFile && patchValue === "") {
          filesToDelete[key] = existingFile;
          req.body[key] = null;
        }
      }
    }
    if (Object.keys(filesToDelete).length > 0) {
      deleteFiles(filesToDelete, fields);
    }

    // Revalidate parents
    req.body[Parent1Singular] = data.authorId;

    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);
    const checkParent1 = await parent1Model.findUnique({ where: { id: Number(requestValues[Parent1Singular]) } });
    const checkParent3 = await parent3Model.findUnique({ where: { id: Number(requestValues[Parent3Singular]) } });
    const checkParent4 = await parent4Model.findUnique({ where: { id: Number(requestValues[Parent4Singular]) } });
    if (!checkParent1 || !checkParent3 || !checkParent4) {
      throw createHttpError(BAD_REQUEST, `Parent data not found.`);
    }
    requestValues[Parent1Singular] = { connect: { id: Number(requestValues[Parent1Singular]) } };
    if (req.body[Parent2Singular]) {
      requestValues[Parent2Singular] = await validateAndConnectParent(parent2Model, Parent2Singular, requestValues[Parent2Singular], Parent2);
    }
    requestValues[Parent3Singular] = await validateAndConnectParent(parent3Model, Parent3Singular, requestValues[Parent3Singular], Parent3);
    requestValues[Parent4Singular] = await validateAndConnectParent(parent4Model, Parent4Singular, requestValues[Parent4Singular], Parent4);
    const result = await model.update({
      data: requestValues as any,
      where: { id: Number(id) },
    });
    res.status(OK).json(result);
  } catch (error) {
    if (req.files) cleanupUploadedFiles(req);
    next(error);
  }
};

export const priority: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = req.body.id;
    const priorityValue = req.body[Parent3Singular];
    if (!priorityValue) throw createHttpError(BAD_REQUEST, "Priority value required.");
    const data = await model.findUnique({ where: { id: Number(id) } });
    if (!data) throw createHttpError(NOT_FOUND, `${Model} not found.`);

    let priorityConnectObj: any = null;
    let newPriorityId: number;

    if (typeof priorityValue === "number" || /^\d+$/.test(priorityValue)) {
      priorityConnectObj = await validateAndConnectParent(parent3Model, Parent3Singular, priorityValue, Parent3);
      newPriorityId = Number(priorityValue);
    } else {
      const foundPriority = await parent3Model.findFirst({ where: { name: priorityValue } });
      if (!foundPriority) {
        throw createHttpError(BAD_REQUEST, `Priority not found: ${priorityValue}`);
      }
      priorityConnectObj = await validateAndConnectParent(parent3Model, Parent3Singular, foundPriority.id, Parent3);
      newPriorityId = foundPriority.id;
    }
    if (data.priorityId === newPriorityId) {
      throw createHttpError(BAD_REQUEST, "Priority is unchanged.");
    }
    const result = await model.update({
      data: {
        [Parent3Singular]: priorityConnectObj,
      },
      where: { id: Number(id) },
    });

    // Optionally: add a taskhistory entry for priority change if you want

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const phase: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = req.body.id;
    const phaseValue = req.body[Parent4Singular];
    if (!phaseValue) throw createHttpError(BAD_REQUEST, "Phase value required.");
    const data = await model.findUnique({ where: { id: Number(id) } });
    if (!data) throw createHttpError(NOT_FOUND, `${Model} not found.`);

    let phaseConnectObj: any = null;
    let newPhaseId: number;

    if (typeof phaseValue === "number" || /^\d+$/.test(phaseValue)) {
      phaseConnectObj = await validateAndConnectParent(parent4Model, Parent4Singular, phaseValue, Parent4);
      newPhaseId = Number(phaseValue);
    } else {
      const foundPhase = await parent4Model.findFirst({ where: { name: phaseValue } });
      if (!foundPhase) {
        throw createHttpError(BAD_REQUEST, `Phase not found: ${phaseValue}`);
      }
      phaseConnectObj = await validateAndConnectParent(parent4Model, Parent4Singular, foundPhase.id, Parent4);
      newPhaseId = foundPhase.id;
    }
    if (data.phaseId === newPhaseId) {
      throw createHttpError(BAD_REQUEST, "Phase is unchanged.");
    }
    const result = await model.update({
      data: {
        [Parent4Singular]: phaseConnectObj,
      },
      where: { id: Number(id) },
    });
    const changedById = req.user?.id || data.authorId;
    await childModel.create({
      data: {
        task: { connect: { id: result.id } },
        fromPhase: { connect: { id: data.phaseId } },
        toPhase: { connect: { id: newPhaseId } },
        changedBy: { connect: { id: changedById } },
        name: uuidv4(),
      },
    });
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const del: RequestHandler = async (req, res, next) => {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      throw createHttpError(UNAUTHORIZED, `You dont have rights to remove this ${Model}`);
    }
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
    const filesToDelete: any = {};
    for (const key of Object.keys(fields)) {
      if (fields[key].isImage || fields[key].isFile) {
        const existingFile = data[key];
        if (existingFile) {
          filesToDelete[key] = existingFile;
        }
      }
    }
    if (Object.keys(filesToDelete).length > 0) {
      deleteFiles(filesToDelete, fields);
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
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      throw createHttpError(UNAUTHORIZED, `You dont have rights to remove this ${Model}`);
    }
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
      where: { id: { in: validIds } },
    });
    if (existingRecords.length === 0) {
      throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);
    }
    for (const data of existingRecords) {
      const filesToDelete: any = {};
      for (const key of Object.keys(fields)) {
        if (fields[key].isImage || fields[key].isFile) {
          const existingFile = data[key];
          if (existingFile) {
            filesToDelete[key] = existingFile;
          }
        }
      }
      if (Object.keys(filesToDelete).length > 0) {
        deleteFiles(filesToDelete, fields);
      }
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
