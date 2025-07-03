import { ParsedQs } from "qs";
import { PrismaClient } from "@prisma/client";

export interface PrismaModel {
  [key: string]: keyof PrismaClient;
}

export interface AuthRequest {
  id: number;
  email: string;
  name: string;
  phone: string;
  photo: string;
  token?: string;
}

export interface FieldDefinition {
  type: StringConstructor | NumberConstructor | BigIntConstructor | BooleanConstructor | DateConstructor;
  fk: boolean;
  ref?: string;
  parent: string;
  fkGet: boolean;
  search: boolean;
  select: boolean;
  required: boolean;
  unique: boolean;
  minLength?: number;
  maxLength?: number;
  regex?: RegExp;
  isHashed: boolean;
  isImage: boolean;
  isFile: boolean;
}

export interface FieldsType {
  [key: string]: FieldDefinition;
}

export interface RequestValues {
  [key: string]: string | number | bigint | boolean | Date | { connect: { id: number } };
}

export interface SortOrderType {
  [key: string]: "asc" | "desc";
}

export interface ErrorDetections {
  status: number;
  statusText: string;
}

export interface CollectionType {
  collection: string;
  parentUnset: string;
  child?: JoinCollectionType;
}

export interface JoinCollectionType {
  localField: string;
  queryValue: string | ParsedQs | (string | ParsedQs)[] | undefined;
}

export type FieldType = Record<string, FieldDefinition>;

export interface CreateDataFromFieldsParams {
  fields: FieldType;
  undefinedFields?: string[];
  overrides?: Record<string, unknown>;
}

export type UserWithRole = FieldType & {
  role: {
    privileges: Array<{
      privilegeCreate: boolean;
      privilegeRead: boolean;
      privilegeUpdate: boolean;
      privilegeDelete: boolean;
      feature: { name: string };
    }>;
  };
};
