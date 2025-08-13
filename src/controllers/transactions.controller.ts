/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";
import { fields } from "@/models/transactions.model";
import createHttpError from "http-errors";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK, UNAUTHORIZED } from "@/constants/http";
import { engineGet, engineCreateUpdate } from "@/middleware/engine.middleware";
import { validations } from "@/utils/utlis";
import { getPrismaModel } from "@/utils/prisma";
import { checkIsAdmin, getAuthUser } from "@/middleware/auth.middleware";
import { v4 as uuidv4 } from "uuid";

const Model = "transactions";
const model = getPrismaModel(Model);

const Parent1 = "users";
const Parent1Singular = "user";
const parent1Model = getPrismaModel(Parent1);

const Parent2 = "clients";
const Parent2Singular = "client";
const parent2Model = getPrismaModel(Parent2);

const Parent3 = "stages";
const Parent3Singular = "stage";
const parent3Model = getPrismaModel(Parent3);

const Parent4 = "currencies";
const Parent4Singular = "currency";
const parent4Model = getPrismaModel(Parent4);

const Child = "transactionhistories";
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
    const idNumber = Number(req.params.id);
    if (!Number.isSafeInteger(idNumber)) throw createHttpError(BAD_REQUEST, "Invalid module ID.");

    const include: Record<string, boolean> = {};
    include[Parent1Singular] = true; // user
    include[Parent2Singular] = true; // client
    include[Parent3Singular] = true; // stage
    include[Parent4Singular] = true; // currency

    const result = await model.findUnique({ where: { id: idNumber }, include });
    if (!result) throw createHttpError(NOT_FOUND);
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

const validateAndConnectParent = async (m: any, key: string, value: any, label: string) => {
  const found = await m.findUnique({ where: { id: Number(value) } });
  if (!found) throw createHttpError(BAD_REQUEST, `Parent data not found: ${label}`);
  return { connect: { id: Number(value) } };
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const user = await getAuthUser(req);
    req.body[Parent1Singular] = user.id; // set logged-in user as transaction.user

    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);

    // parents
    requestValues[Parent1Singular] = await validateAndConnectParent(parent1Model, Parent1Singular, requestValues[Parent1Singular], Parent1);
    requestValues[Parent2Singular] = await validateAndConnectParent(parent2Model, Parent2Singular, requestValues[Parent2Singular], Parent2);
    requestValues[Parent3Singular] = await validateAndConnectParent(parent3Model, Parent3Singular, requestValues[Parent3Singular], Parent3);
    requestValues[Parent4Singular] = await validateAndConnectParent(parent4Model, Parent4Singular, requestValues[Parent4Singular], Parent4);

    const result = await model.create({ data: requestValues as any });

    // initial transactionhistory (to* required; from* null; changedBy optional)
    await childModel.create({
      data: {
        transaction: { connect: { id: result.id } },
        toClient: { connect: { id: result.clientId } },
        toStage: { connect: { id: result.stageId } },
        toCurrency: { connect: { id: result.currencyId } },
        changedBy: { connect: { id: user.id } },
        name: uuidv4(),
      },
    });

    res.status(CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = Number(req.body.id);
    const data = await model.findUnique({ where: { id } });
    if (!data) throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);

    // keep original user (author equivalent)
    req.body[Parent1Singular] = data.userId;

    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, true);

    // revalidate parents
    const checkUser = await parent1Model.findUnique({ where: { id: Number(requestValues[Parent1Singular]) } });
    const checkClient = await parent2Model.findUnique({ where: { id: Number(requestValues[Parent2Singular]) } });
    const checkStage = await parent3Model.findUnique({ where: { id: Number(requestValues[Parent3Singular]) } });
    const checkCurrency = await parent4Model.findUnique({ where: { id: Number(requestValues[Parent4Singular]) } });
    if (!checkUser || !checkClient || !checkStage || !checkCurrency) {
      throw createHttpError(BAD_REQUEST, `Parent data not found.`);
    }

    requestValues[Parent1Singular] = { connect: { id: Number(requestValues[Parent1Singular]) } };
    requestValues[Parent2Singular] = { connect: { id: Number(requestValues[Parent2Singular]) } };
    requestValues[Parent3Singular] = { connect: { id: Number(requestValues[Parent3Singular]) } };
    requestValues[Parent4Singular] = { connect: { id: Number(requestValues[Parent4Singular]) } };

    const result = await model.update({ data: requestValues as any, where: { id } });
    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Field-specific updaters that also write transactionhistories entries
 */
export const stage: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = Number(req.body.id);
    const stageValue = req.body[Parent3Singular];
    if (!stageValue) throw createHttpError(BAD_REQUEST, "Stage value required.");

    const data = await model.findUnique({ where: { id } });
    if (!data) throw createHttpError(NOT_FOUND, `${Model} not found.`);

    // accept id or name
    let newStageId: number;
    if (typeof stageValue === "number" || /^\d+$/.test(stageValue)) {
      const found = await parent3Model.findUnique({ where: { id: Number(stageValue) } });
      if (!found) throw createHttpError(BAD_REQUEST, `Stage not found: ${stageValue}`);
      newStageId = found.id;
    } else {
      const found = await parent3Model.findFirst({ where: { name: stageValue } });
      if (!found) throw createHttpError(BAD_REQUEST, `Stage not found: ${stageValue}`);
      newStageId = found.id;
    }
    if (data.stageId === newStageId) throw createHttpError(BAD_REQUEST, "Stage is unchanged.");

    const result = await model.update({
      data: { [Parent3Singular]: { connect: { id: newStageId } } },
      where: { id },
    });

    const changedById = req.user?.id || data.userId;
    await childModel.create({
      data: {
        transaction: { connect: { id: result.id } },
        fromStage: { connect: { id: data.stageId } },
        toStage: { connect: { id: newStageId } },
        toClient: { connect: { id: result.clientId } },
        toCurrency: { connect: { id: result.currencyId } },
        changedBy: { connect: { id: changedById } },
        name: uuidv4(),
      },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const client: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = Number(req.body.id);
    const clientValue = req.body[Parent2Singular];
    if (!clientValue) throw createHttpError(BAD_REQUEST, "Client value required.");

    const data = await model.findUnique({ where: { id } });
    if (!data) throw createHttpError(NOT_FOUND, `${Model} not found.`);

    let newClientId: number;
    if (typeof clientValue === "number" || /^\d+$/.test(clientValue)) {
      const found = await parent2Model.findUnique({ where: { id: Number(clientValue) } });
      if (!found) throw createHttpError(BAD_REQUEST, `Client not found: ${clientValue}`);
      newClientId = found.id;
    } else {
      const found = await parent2Model.findFirst({ where: { name: clientValue } });
      if (!found) throw createHttpError(BAD_REQUEST, `Client not found: ${clientValue}`);
      newClientId = found.id;
    }
    if (data.clientId === newClientId) throw createHttpError(BAD_REQUEST, "Client is unchanged.");

    const result = await model.update({
      data: { [Parent2Singular]: { connect: { id: newClientId } } },
      where: { id },
    });

    const changedById = req.user?.id || data.userId;
    await childModel.create({
      data: {
        transaction: { connect: { id: result.id } },
        fromClient: { connect: { id: data.clientId } },
        toClient: { connect: { id: newClientId } },
        toStage: { connect: { id: result.stageId } },
        toCurrency: { connect: { id: result.currencyId } },
        changedBy: { connect: { id: changedById } },
        name: uuidv4(),
      },
    });

    res.status(OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const currency: RequestHandler = async (req, res, next) => {
  if (!model) throw createHttpError(BAD_REQUEST, "Invalid model name.");
  try {
    const id = Number(req.body.id);
    const currencyValue = req.body[Parent4Singular];
    if (!currencyValue) throw createHttpError(BAD_REQUEST, "Currency value required.");

    const data = await model.findUnique({ where: { id } });
    if (!data) throw createHttpError(NOT_FOUND, `${Model} not found.`);

    let newCurrencyId: number;
    if (typeof currencyValue === "number" || /^\d+$/.test(currencyValue)) {
      const found = await parent4Model.findUnique({ where: { id: Number(currencyValue) } });
      if (!found) throw createHttpError(BAD_REQUEST, `Currency not found: ${currencyValue}`);
      newCurrencyId = found.id;
    } else {
      const found = await parent4Model.findFirst({ where: { name: currencyValue } });
      if (!found) throw createHttpError(BAD_REQUEST, `Currency not found: ${currencyValue}`);
      newCurrencyId = found.id;
    }
    if (data.currencyId === newCurrencyId) throw createHttpError(BAD_REQUEST, "Currency is unchanged.");

    const result = await model.update({
      data: { [Parent4Singular]: { connect: { id: newCurrencyId } } },
      where: { id },
    });

    const changedById = req.user?.id || data.userId;
    await childModel.create({
      data: {
        transaction: { connect: { id: result.id } },
        fromCurrency: { connect: { id: data.currencyId } },
        toCurrency: { connect: { id: newCurrencyId } },
        toStage: { connect: { id: result.stageId } },
        toClient: { connect: { id: result.clientId } },
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
    if (!isAdmin) throw createHttpError(UNAUTHORIZED, `You dont have rights to remove this ${Model}`);

    const idNumber = Number(req.body.id);
    if (!Number.isSafeInteger(idNumber)) throw createHttpError(BAD_REQUEST, "Invalid module ID.");

    const data = await model.findUnique({ where: { id: idNumber } });
    if (!data) throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);

    const allCount = await model.count({ where: { id: idNumber } });
    if (allCount <= 1) throw createHttpError(BAD_REQUEST, `${Model} must be at least have 1 data.`);

    const result = await model.delete({ where: { id: idNumber } });
    res.status(OK).json(result);
  } catch (error) {
    return next(error);
  }
};

export const bulkDel: RequestHandler = async (req, res, next) => {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) throw createHttpError(UNAUTHORIZED, `You dont have rights to remove this ${Model}`);

    let ids = req.body.ids;
    if (typeof ids === "string") ids = ids.split(",").map((id: string) => id.trim());
    if (!Array.isArray(ids) || ids.length === 0) throw createHttpError(BAD_REQUEST, "Invalid IDs");

    const invalidIds = ids.filter((id) => !Number.isSafeInteger(Number(id)));
    if (invalidIds.length > 0) throw createHttpError(BAD_REQUEST, `Invalid IDs: ${invalidIds.join(", ")}`);

    const validIds = ids.map((id) => Number(id));
    const existingRecords = await model.findMany({ where: { id: { in: validIds } } });
    if (existingRecords.length === 0) throw createHttpError(BAD_REQUEST, `${Model} Not Found.`);

    await model.deleteMany({ where: { id: { in: validIds } } });
    res.status(OK).json(existingRecords);
  } catch (error) {
    return next(error);
  }
};
