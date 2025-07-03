/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldsType } from "@/types/types";
import fs from "fs";
import path from "path";

export const deleteFiles = (data: any, fields: FieldsType) => {
  for (const key of Object.keys(fields)) {
    if (data[key]) {
      const filePath = path.join(process.cwd(), data[key]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};

export async function deleteHlsFiles(hlsPath: string) {
  if (!hlsPath) return;
  const absPath = path.join(process.cwd(), hlsPath);
  const dir = path.dirname(absPath);
  const base = path.basename(absPath, ".m3u8");

  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir).forEach((file) => {
    if (file.startsWith(base)) {
      fs.unlinkSync(path.join(dir, file));
    }
  });
}
