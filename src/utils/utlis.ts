import bcrypt from "bcryptjs";
import fs from "fs";
import { Request } from "express";
import createHttpError from "http-errors";
import { BAD_REQUEST } from "../constants/http";
import { FieldsType } from "../types/types";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const cleanupUploadedFiles = (req: Request): void => {
  try {
    if (!req.files) return;
    const filesArray: Express.Multer.File[] = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    filesArray.forEach((file) => {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error(`❌ Failed to remove uploaded file: ${file.path}`, err);
        }
      }
    });
  } catch (error) {
    console.error("❌ cleanupUploadedFiles error:", error);
  }
};

export const formatNumber = (num: number): number => (num % 1 === 0 ? Math.trunc(num) : parseFloat(num.toFixed(1)));

export const validations = (fields: FieldsType, req: Request) => {
  const requiredBodyFields = Object.keys(fields).filter((key) => fields[key].required && !fields[key].isFile && !fields[key].isImage);
  const requiredFileFields = Object.keys(fields).filter((key) => fields[key].required && (fields[key].isFile || fields[key].isImage));
  const missingBodyFields = requiredBodyFields.filter((field) => req.body[field] === undefined || req.body[field] === "");
  const missingFileFields = requiredFileFields.filter((field) => {
    if (!req.files) return true;
    if (Array.isArray(req.files)) {
      return !req.files.some((file) => file.fieldname === field);
    }
    const files = req.files as { [key: string]: Express.Multer.File[] };
    return !files[field] || files[field].length === 0;
  });
  if (missingBodyFields.length || missingFileFields.length) {
    if (req.files) cleanupUploadedFiles(req);

    const missingFieldsMessage = [...missingBodyFields, ...missingFileFields].join(", ");
    throw createHttpError(BAD_REQUEST, `Missing required fields: ${missingFieldsMessage}`);
  }
  return true;
};

export const escapeSearchString = (str: string) => {
  if (!str) return "";
  return str.replace(/[%_#]/g, "\\$&"); // Escapes %, _, and #
};
