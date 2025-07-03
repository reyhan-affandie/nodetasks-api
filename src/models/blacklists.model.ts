import { FieldsType } from "@/types/types";
import { regexString } from "@/utils/regex";

export const fields: FieldsType = {
  token: {
    type: String,
    fk: false,
    parent: "",
    fkGet: false,
    search: true,
    select: true,
    required: true,
    unique: true,
    minLength: 1,
    maxLength: 3000,
    regex: regexString,
    isHashed: false,
    isImage: false,
    isFile: false,
  },
};