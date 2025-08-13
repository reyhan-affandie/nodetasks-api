/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldsType, JoinCollectionType, RequestValues, SortOrderType } from "@/types/types";
import { BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND } from "@/constants/http";
import createHttpError from "http-errors";
import { Request } from "express";
import { regexString } from "@/utils/regex";
import { cleanupUploadedFiles, escapeSearchString, hashPassword } from "@/utils/utlis";
import { getPrismaModel, PrismaModels } from "@/utils/prisma";

export const engineGet = async (Model: PrismaModels, fields: FieldsType, req: Request) => {
  try {
    const model = getPrismaModel(Model) as any;
    if (!model) {
      throw createHttpError(BAD_REQUEST, `Invalid module name.`);
    }
    let limit = Number(req.query.limit);
    if (isNaN(limit) || limit < 0) {
      limit = 10;
    }
    let page = Number(req.query.page);
    if (isNaN(page) || page < 0) {
      page = 1;
    }
    const startIndex = (page - 1) * limit;
    const search = req.query.search || "";
    if (Array.isArray(search) || typeof search === "object" || typeof search !== "string" || !regexString.test(search)) {
      throw createHttpError(BAD_REQUEST);
    }
    let sort = "updatedAt";

    const locales = ["en", "de", "nl", "id", "ph"];
    const transactionsSortKeys = ["id", "createdAt", "updatedAt", "client.name", "stage.name", "currency.name", ...locales.map((l) => `stage.name_${l}`)];
    const taskSortKeys = [
      "id",
      "createdAt",
      "updatedAt",
      "priority.name",
      "phase.name",
      ...locales.map((l) => `priority.name_${l}`),
      ...locales.map((l) => `phase.name_${l}`),
    ];

    if (req.query.sort) {
      sort = req.query.sort.toString();
      let validSort = false;
      if (Model === "transactions") {
        validSort = Object.keys(fields).includes(sort) || transactionsSortKeys.includes(sort);
      } else if (Model === "tasks") {
        validSort = Object.keys(fields).includes(sort) || taskSortKeys.includes(sort);
      } else {
        validSort = Object.keys(fields).includes(sort) || ["id", "createdAt", "updatedAt"].includes(sort);
      }
      if (!validSort || fields[sort]?.type === Boolean) {
        throw createHttpError(BAD_REQUEST, `Invalid sort field: '${sort}'`);
      }
    }

    const sortOrder: SortOrderType = {};
    const order: "asc" | "desc" = req.query.order === "asc" ? "asc" : "desc";
    let orderBy: any = sortOrder;

    if (Model === "transactions") {
      if (sort === "client.name") {
        orderBy = [{ client: { name: order } }, { transactionDate: "desc" }, { amount: "desc" }];
      } else if (sort === "currency.name") {
        orderBy = [{ currency: { name: order } }, { transactionDate: "desc" }, { amount: "desc" }];
      } else if (sort === "stage.name") {
        orderBy = [{ stage: { name: order } }, { transactionDate: "desc" }, { amount: "desc" }];
      } else if (sort.startsWith("stage.name_")) {
        const locale = sort.split("_")[1]; // en | de | nl | id | ph
        orderBy = [{ stage: { [`name_${locale}`]: order } }, { transactionDate: "desc" }, { amount: "desc" }];
      } else if (sort === "name") {
        orderBy = [{ name: order }, { transactionDate: "desc" }, { amount: "desc" }];
      } else {
        orderBy = { [sort]: order };
      }
    } else if (Model === "tasks") {
      if (sort.startsWith("priority.name")) {
        orderBy = [{ priorityId: "desc" }, { name: "asc" }, { phaseId: "asc" }];
      } else if (sort.startsWith("phase.name_")) {
        const locale = sort.split("_")[1]; // en | de | nl | id | ph
        orderBy = [{ stage: { [`name_${locale}`]: order } }, { transactionDate: "desc" }, { amount: "desc" }];
      } else if (sort === "name") {
        orderBy = [{ name: order }, { priorityId: "desc" }, { phaseId: "asc" }];
      } else {
        orderBy = { [sort]: order };
      }
    } else {
      orderBy = { [sort]: order };
    }

    const join: JoinCollectionType[] = [];
    const whereFK: RequestValues = {};
    let whereSearch: any = {};

    const checkSearch = Object.keys(fields).filter((key) => fields[key].search === true);

    if (checkSearch.length > 0 && search.trim() !== "") {
      whereSearch = { OR: [] };
      checkSearch.forEach((key) => {
        whereSearch.OR.push({
          [key]: { contains: escapeSearchString(search.toLocaleLowerCase()) },
        });
      });
    }

    const foreignKeys = Object.keys(fields).filter((key) => fields[key].fk === true);
    const include: Record<string, any> = {};

    foreignKeys.forEach((key) => {
      const hasQuery = req.query[key];

      if (hasQuery !== undefined) {
        if (fields[key].fkGet === true && hasQuery === "") {
          throw createHttpError(BAD_REQUEST, `Query parameter '${key}' is required.`);
        }

        if (!isNaN(Number(hasQuery))) {
          whereFK[key + "Id"] = Number(hasQuery);
          join.push({
            localField: key,
            queryValue: hasQuery,
          });
        } else {
          throw createHttpError(NOT_FOUND, `Data for '${key}' is empty or invalid.`);
        }
      }
      // ✅ Always include the relation (Prisma handles optional automatically)
      include[key] = true;
    });

    // helpers
    const getStr = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined);

    const RX_DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    const RX_DATE_HM = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[ T]([01]\d|2[0-3]):([0-5]\d)$/;

    // Returns either a local-day range [gte, lt) or an exact Date
    function parseFlexible(raw: string, label: string): { range?: { gte: Date; lt: Date }; exact?: Date } {
      if (RX_DATE_ONLY.test(raw)) {
        const [y, m, d] = raw.split("-").map(Number);
        const gte = new Date(y, m - 1, d, 0, 0, 0, 0);
        const lt = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        return { range: { gte, lt } };
      }
      const hm = RX_DATE_HM.exec(raw);
      if (hm) {
        const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
        const [hh, mm] = hm[0].slice(11).split(":").map(Number);
        return { exact: new Date(y, m - 1, d, hh, mm, 0, 0) };
      }
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) throw createHttpError(BAD_REQUEST, `Invalid ${label} format.`);
      return { exact: d };
    }

    // Merge logic: when both params exist, build { gte, lt|lte }
    function buildBetween(startRaw: string, endRaw: string, startLabel: string, endLabel: string) {
      const sp = parseFlexible(startRaw, startLabel);
      const ep = parseFlexible(endRaw, endLabel);

      const from = sp.range ? sp.range.gte : sp.exact!;
      // If end is date-only we got an exclusive upper bound (lt next day). If exact, use inclusive lte.
      const toLt = ep.range?.lt;
      const toLte = ep.exact;

      // sanity
      const upper = toLt ?? toLte!;
      if (from > upper) throw createHttpError(BAD_REQUEST, `Invalid range: ${startLabel} is after ${endLabel}.`);

      return {
        ...(toLt ? { gte: from, lt: toLt } : {}),
        ...(toLte ? { gte: from, lte: toLte } : {}),
      };
    }

    const whereDate: Record<string, any> = {};

    // Events and Schedules
    if (Model === "events" || Model === "schedules") {
      const startRaw = getStr(req.query.startDateTime);
      const endRaw = getStr(req.query.endDateTime);

      if (startRaw && endRaw) {
        // Between startDateTime and endDateTime
        whereDate.startDateTime = buildBetween(startRaw, endRaw, "startDateTime", "endDateTime");
      } else if (startRaw) {
        // Single param — whole day if date-only, or exact if datetime
        const p = parseFlexible(startRaw, "startDateTime");
        whereDate.startDateTime = p.range ?? { equals: p.exact };
      } else if (endRaw) {
        // Only end provided — interpret similarly
        const p = parseFlexible(endRaw, "endDateTime");
        whereDate.endDateTime = p.range ?? { equals: p.exact };
      }
    }

    // Tasks
    if (Model === "tasks") {
      const startRaw = getStr(req.query.start); // param name: start
      const endRaw = getStr(req.query.deadline); // param name: deadline

      if (startRaw && endRaw) {
        // Between start and deadline on the tasks.start field
        whereDate.start = buildBetween(startRaw, endRaw, "start", "deadline");
      } else if (startRaw) {
        const p = parseFlexible(startRaw, "start");
        whereDate.start = p.range ?? { equals: p.exact };
      } else if (endRaw) {
        const p = parseFlexible(endRaw, "deadline");
        // If you want to filter by tasks.deadline when only deadline is provided, change the field below
        whereDate.start = p.range ?? { lte: p.exact }; // or: whereDate.deadline = ...
      }
    }

    const whereConditions = [
      ...(Object.keys(whereFK).length > 0 ? [whereFK] : []),
      ...(Object.keys(whereSearch).length > 0 ? [whereSearch] : []),
      ...(Object.keys(whereDate).length > 0 ? [whereDate] : []),
    ];
    const whereQuery = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const total = await model.count({ where: whereQuery });
    const query: Record<string, any> = {
      where: whereQuery,
      orderBy,
      skip: startIndex,
      take: limit,
      include,
    };

    let data = await model.findMany(query);
    // Convert BigInt values to string for JSON safety
    data = data.map((item: any) => {
      const safeItem: any = { ...item };
      for (const key in safeItem) {
        if (typeof safeItem[key] === "bigint" || fields[key]?.type === BigInt) {
          safeItem[key] = safeItem[key]?.toString();
        }
      }
      return safeItem;
    });
    return {
      data,
      page,
      totalPages: Math.ceil(total / limit),
      totalData: total,
    };
  } catch (error) {
    if (createHttpError.isHttpError(error)) {
      throw error;
    }
    throw createHttpError(INTERNAL_SERVER_ERROR, "An error occurred while fetching data.");
  }
};

export const engineGetInputValues = async (fields: FieldsType, req: Request): Promise<RequestValues> => {
  const requestValues: RequestValues = {};

  for (const [key, field] of Object.entries(fields)) {
    const value = req.body[key];

    if (field.isImage || field.isFile) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file.fieldname === key && file.path) {
            requestValues[key] = file.path;
            break;
          }
        }
      } else if (req.files && req.files[key] && req.files[key][0]) {
        requestValues[key] = req.files[key][0].path;
      }
    } else if (field.isHashed && value) {
      requestValues[key] = await hashPassword(value);
    } else {
      if (field.type === Boolean && typeof value === "string") {
        requestValues[key] = value.toLowerCase() === "true";
      } else if (field.type === Number) {
        if (value !== undefined && value !== "") {
          const numberValue = Number(value);
          if (!isNaN(numberValue)) {
            requestValues[key] = numberValue;
          }
        }
      } else if (field.type === BigInt) {
        if (value !== undefined && value !== "") {
          try {
            requestValues[key] = BigInt(value);
          } catch {
            // ignore invalid BigInt conversion
          }
        }
      } else if (field.type === Date) {
        if (value) {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            requestValues[key] = dateValue;
          }
        }
      } else {
        requestValues[key] = value;
      }
    }
  }
  return requestValues;
};

export const engineCreateUpdate = async (Model: PrismaModels, fields: FieldsType, req: Request, isUpdate: boolean) => {
  const model = getPrismaModel(Model) as any;
  if (!model) {
    throw createHttpError(BAD_REQUEST, "Invalid model name.");
  }
  const errors: { status: number; message: string }[] = [];
  const fieldKeys: string[] = Object.keys(fields);
  const requestValues: RequestValues = {};

  if (isUpdate) {
    const id = req.body.id;
    const idNumber = Number(id);
    if (!Number.isSafeInteger(idNumber)) {
      if (req.files) cleanupUploadedFiles(req);

      throw createHttpError(BAD_REQUEST, `Invalid ${Model} ID.`);
    }
  }
  for (let i = 0; i < fieldKeys.length; i++) {
    if ((fields[fieldKeys[i]].isImage === true || fields[fieldKeys[i]].isFile === true) && req.files) {
      const files = req.files as Express.Multer.File[];
      if (files[0] && files[0].fieldname && files[0].filename && files[0].fieldname === fieldKeys[i] && files[0]?.filename) {
        requestValues[fieldKeys[i]] = files[0].filename;
      }
    } else {
      if (req.body[fieldKeys[i]] !== undefined && req.body[fieldKeys[i]] !== "") {
        if (isUpdate) {
          requestValues["id"] = Number(req.body.id);
        }
        requestValues[fieldKeys[i]] = req.body[fieldKeys[i]];
      }
    }
  }
  // Validate fields
  await Promise.all(
    Object.keys(fields).map(async (key) => {
      const field = fields[key];
      if (field.required === true && field.fk === true && !Number.isSafeInteger(Number(requestValues[key]))) {
        errors.push({
          status: BAD_REQUEST,
          message: `Invalid ${key} ID`,
        });
      }
      if (requestValues[key] && field.type !== Number) {
        if (key !== "id" && field.required === true && !field.isFile && !field.isImage) {
          if (field.type === Number && typeof requestValues[key] === "number") {
            const minNumber = field.minLength > 1 ? Math.pow(10, field.minLength - 1) : 0;
            const maxNumber = field.maxLength > 1 ? Math.pow(10, field.maxLength) - 1 : 9;

            if (requestValues[key] < minNumber || requestValues[key] > maxNumber) {
              errors.push({
                status: BAD_REQUEST,
                message: `Field ${key} must be a valid number between ${minNumber} and ${maxNumber}.`,
              });
            }
          } else {
            const valueString = String(requestValues[key]);
            const valueLength = valueString.length;

            // Validate length
            if (field.required && (valueLength < field.minLength || valueLength > field.maxLength)) {
              errors.push({
                status: BAD_REQUEST,
                message: `Field ${key} must be between ${field.minLength} and ${field.maxLength} characters.`,
              });
            }

            // Validate regex
            if (field.regex && !field.regex.test(valueString)) {
              if (key !== "message") {
                errors.push({
                  status: BAD_REQUEST,
                  message: `Field ${key} must match the pattern ${field.regex}.`,
                });
              }
            }
          }
        }
        if (field.unique === true) {
          const whereClause: Record<string, unknown> = {
            [key]: requestValues[key],
          };

          if (isUpdate) {
            whereClause.AND = [{ [key]: requestValues[key] }, { id: { not: requestValues["id"] } }];
          }
          const checkUnique = await model.findFirst({
            where: whereClause,
          });

          if (checkUnique) {
            errors.push({
              status: CONFLICT,
              message: `Field ${key} already exists`,
            });
          }
        }
      }
    }),
  );
  if (errors.length > 0) {
    if (req.files) cleanupUploadedFiles(req);
    const errorMessages = errors.map((error) => error.message).join(", ");
    const status = errors[0]?.status || BAD_REQUEST;
    throw createHttpError(status, `Validation failed: ${errorMessages}`);
  }
  return engineGetInputValues(fields, req);
};
