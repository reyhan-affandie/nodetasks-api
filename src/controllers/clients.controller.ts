/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import { fields } from "@/models/clients.model";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { cleanupUploadedFiles, validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";
import { deleteFiles } from "@/utils/unlink";

const Model = "clients";
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
  if (!model) return next(createHttpError(BAD_REQUEST, "Invalid model name."));
  try {
    const idNumber = Number(req.params.id);
    if (!Number.isSafeInteger(idNumber)) {
      return next(createHttpError(BAD_REQUEST, "Invalid module ID."));
    }
    const result = await model.findUnique({ where: { id: idNumber } });
    if (!result) return next(createHttpError(NOT_FOUND));
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);
    const result = await model.create({ data: requestValues as any });
    res.status(CREATED).json(result);
  } catch (error) {
    if (req.files) cleanupUploadedFiles(req);
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  if (!model) return next(createHttpError(BAD_REQUEST, "Invalid model name."));
  try {
    const id = Number(req.body.id);
    const data = await model.findUnique({ where: { id } });
    if (!data) {
      if (req.files) cleanupUploadedFiles(req);
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    const filesToDelete: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      if (fields[key].isImage || fields[key].isFile) {
        const existingFile = (data as any)[key];
        const newFile = (req.files as any)?.[key];
        const patchValue = (req.body as any)[key];
        if (newFile && newFile !== existingFile) filesToDelete[key] = existingFile;
        if (!newFile && patchValue === "") {
          filesToDelete[key] = existingFile;
          (req.body as any)[key] = null;
        }
      }
    }
    if (Object.keys(filesToDelete).length > 0) deleteFiles(filesToDelete, fields);
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);
    const result = await model.update({
      data: requestValues as any,
      where: { id },
    });
    res.status(OK).json(result);
  } catch (error) {
    if (req.files) cleanupUploadedFiles(req);
    next(error);
  }
};

export const del: RequestHandler = async (req, res, next) => {
  try {
    const idNumber = Number(req.body.id);
    if (!Number.isSafeInteger(idNumber)) {
      return next(createHttpError(BAD_REQUEST, "Invalid module ID."));
    }
    const data = await model.findUnique({ where: { id: idNumber } });
    if (!data) return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    const filesToDelete: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      if (fields[key].isImage || fields[key].isFile) {
        const existingFile = (data as any)[key];
        if (existingFile) filesToDelete[key] = existingFile;
      }
    }
    if (Object.keys(filesToDelete).length > 0) deleteFiles(filesToDelete, fields);
    const result = await model.delete({ where: { id: idNumber } });
    res.status(OK).json(result);
  } catch (error) {
    return next(error);
  }
};

export const bulkDel: RequestHandler = async (req, res, next) => {
  try {
    let ids = (req.body as any).ids;
    if (typeof ids === "string") {
      ids = ids.split(",").map((id: string) => id.trim());
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(createHttpError(BAD_REQUEST, "Invalid IDs"));
    }
    const invalidIds = ids.filter((id: any) => !Number.isSafeInteger(Number(id)));
    if (invalidIds.length > 0) {
      return next(createHttpError(BAD_REQUEST, `Invalid IDs: ${invalidIds.join(", ")}`));
    }
    const validIds = ids.map((id: any) => Number(id));
    const existingRecords = await model.findMany({
      where: { id: { in: validIds } },
    });
    if (existingRecords.length === 0) {
      return next(createHttpError(BAD_REQUEST, `${Model} Not Found.`));
    }
    for (const data of existingRecords) {
      const filesToDelete: Record<string, string> = {};
      for (const key of Object.keys(fields)) {
        if (fields[key].isImage || fields[key].isFile) {
          const existingFile = (data as any)[key];
          if (existingFile) filesToDelete[key] = existingFile;
        }
      }
      if (Object.keys(filesToDelete).length > 0) deleteFiles(filesToDelete, fields);
    }
    await model.deleteMany({ where: { id: { in: validIds } } });
    res.status(OK).json(existingRecords);
  } catch (error) {
    return next(error);
  }
};
