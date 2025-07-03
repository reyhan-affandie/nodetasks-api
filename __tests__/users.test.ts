import supertest from "supertest";
import app from "../src/app";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "../src/constants/http";
import {
  generateRandomEmail,
  createRequest,
  sendGetRequest,
  generateMockTokenRandom,
  sendUpdateRequest,
  generateRandomString,
  generateRandomNumber,
} from "../src/utils/jest.utils";
import { fields } from "../src/models/users.model";

const moduleName = "users";
const parentField = false;
const parentId = generateRandomNumber(2).toString();
const testTitle = moduleName.toUpperCase();
const invalidId = "123";
const randomId = generateRandomNumber(2);
const generateId = generateRandomNumber(2);
let mockToken: string = "";
const email = generateRandomEmail(20);
const name = generateRandomString(20, true);
beforeAll(() => {
  mockToken = generateMockTokenRandom(generateId, email, name, "", false);
});

describe(`${moduleName} Controller UNIT TESTS`, () => {
  it(`${testTitle} READ ${name} - ${OK}:OK`, async () => {
    await createRequest(fields, mockToken, moduleName, CREATED);
    const queryParams = new URLSearchParams({
      ...(parentField ? { [parentField]: parentId } : {}),
      page: "1",
      limit: "10",
      search: "valid",
      sort: "updatedAt",
      order: "desc",
    }).toString();
    await sendGetRequest(mockToken, `/api/${moduleName}?${queryParams}`, OK);
  });

  it(`${testTitle} READ ONE ${name} - ${OK}:OK`, async () => {
    const post = await createRequest(fields, mockToken, moduleName, CREATED);
    await sendGetRequest(mockToken, `/api/${moduleName}/${post.body.id}`, OK);
  });

  it(`${testTitle} READ ONE ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    await createRequest(fields, mockToken, moduleName, CREATED);
    await sendGetRequest(mockToken, `/api/${moduleName}/${invalidId}`, BAD_REQUEST);
  });

  it(`${testTitle} READ ONE ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    await createRequest(fields, mockToken, moduleName, CREATED);
    await supertest(app).get(`/api/${moduleName}/${randomId}`).set("Authorization", mockToken).expect(NOT_FOUND);
  });

  it(`${testTitle} UPDATE ${name} - ${OK}:OK`, async () => {
    const post = await createRequest(fields, mockToken, moduleName, CREATED);
    await sendUpdateRequest(fields, mockToken, moduleName, post.body.id, [], {}, OK);
  });

  it(`${testTitle} UPDATE ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    await createRequest(fields, mockToken, moduleName, CREATED);
    await sendUpdateRequest(fields, mockToken, moduleName, randomId, [], {}, NOT_FOUND);
  });
});
