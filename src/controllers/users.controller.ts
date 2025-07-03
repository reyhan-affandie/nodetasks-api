/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import { fields } from "@/models/users.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { cleanupUploadedFiles, validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";
import { deleteFiles } from "@/utils/unlink";
import { checkIsAdmin, getAuthUser } from "@/middleware/auth.middleware";

const Model = "users";
const model = getPrismaModel(Model);
const Parent = "roles";
const ParentSingular = "role";
const parentModel = getPrismaModel(Parent);

export const get: RequestHandler = async (req, res, next) => {
  try {
    const isAdmin = await checkIsAdmin(req);
    const user = await getAuthUser(req);
    let result;
    if (!isAdmin) {
      result = await model.findUnique({
        where: { id: Number(user.id) },
      });
    } else {
      result = await engineGet(Model, fields, req);
    }
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOne: RequestHandler = async (req, res, next) => {
  if (!model) {
    return next(createHttpError(BAD_REQUEST, "Invalid model name."));
  }
  try {
    const isAdmin = await checkIsAdmin(req);
    const user = await getAuthUser(req);
    if (!isAdmin) {
      req.params.id = String(user.id);
    }
    const id = req.params.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      return next(createHttpError(BAD_REQUEST, "Invalid module ID."));
    }
    const include: Record<string, boolean> = {};
    include[ParentSingular] = true;

    const result = await model.findUnique({
      where: { id: Number(id) },
      include,
    });
    if (!result) {
      return next(createHttpError(NOT_FOUND));
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
    const checkParent = await parentModel.findUnique({
      where: {
        id: Number(requestValues[ParentSingular]),
      },
    });
    if (!checkParent) {
      return next(createHttpError(NOT_FOUND, `Parent data not found : ${Parent}`));
    }
    if (requestValues[ParentSingular]) {
      requestValues[ParentSingular] = { connect: { id: Number(requestValues[ParentSingular]) } };
    }
    const result = await model.create({
      data: requestValues as any,
    });
    res.status(CREATED).json(result);
  } catch (error) {
    if (req.files) cleanupUploadedFiles(req);
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  if (!model) {
    return next(createHttpError(BAD_REQUEST, "Invalid model name."));
  }
  try {
    const id = req.body.id;
    const data = await model.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!data) {
      if (req.files) cleanupUploadedFiles(req);
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
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
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);
    requestValues[ParentSingular] = { connect: { id: Number(requestValues[ParentSingular]) } };
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

export const del: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      return next(createHttpError(BAD_REQUEST, "Invalid module ID."));
    }
    const data = await model.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!data) {
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    const allCount = await model.count({
      where: {
        id: idNumber,
      },
    });
    if (allCount <= 1) {
      return next(createHttpError(BAD_REQUEST, `${Model} must be at least have 1 data.`));
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
    const existingRecords = await model.findMany({
      where: {
        id: { in: validIds },
      },
    });
    if (existingRecords.length === 0) {
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    const parentIdSet = new Set(existingRecords.map((r) => r[ParentSingular]));
    if (parentIdSet.size > 1) {
      return next(createHttpError(BAD_REQUEST, `cannot bulk delete ${Model} with multiple ${ParentSingular} ids`));
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
