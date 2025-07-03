import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "@/constants/http";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";
import { MulterError } from "multer";

export const errorHandler = (
  err: HttpError | MulterError | Error, // Handle HttpError, MulterError, and generic Error
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction, // Required for middleware signature
): void => {
  // Handle Multer-specific errors
  if ((err as MulterError).code === "LIMIT_FILE_SIZE") {
    res.status(BAD_REQUEST).json({ message: "File size too large" });
    return;
  }
  // Handle unsupported file type
  if (err.message === "Unsupported file type") {
    res.status(BAD_REQUEST).json({ message: err.message });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status || BAD_REQUEST).json({
      status: err.status || BAD_REQUEST,
      message: err.message,
    });
    return;
  }

  // Handle other generic errors
  res.status(INTERNAL_SERVER_ERROR).json({
    status: INTERNAL_SERVER_ERROR,
    message: err.message || "Internal Server Error",
  });
};
