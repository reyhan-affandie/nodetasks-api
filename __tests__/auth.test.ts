import supertest from "supertest";
import app from "../src/app";
import { CREATED, BAD_REQUEST, OK, UNAUTHORIZED, NOT_FOUND } from "../src/constants/http";
import { fields } from "../src/models/users.model";
import {
  register,
  loginRequest,
  generateMockTokenRandom,
  loginFlow,
  generateRandomEmail,
  verifyEmailFlow,
  registerFlow,
  sendGetRequest,
  generateRandomNumber,
} from "../src/utils/jest.utils";

const moduleName = "auth";
const testTitle = moduleName.toUpperCase();

describe(`${moduleName} Controller UNIT TESTS`, () => {
  const email = generateRandomEmail(20);
  const password = "Test@1234";
  const invalidEmail = "testinvalid@email.com";
  const invalidCredential = {
    email: email,
    password: "testPassword",
  };
  const invalidCredentialBoth = {
    email: "testinvalid@email.com",
    password: "testPassword",
  };
  const overridesData = {
    email,
    name: "test name",
    password,
    roleName: "CEO",
    companyName: "Test Company",
    companyBrand: "Test Brand",
  };
  const overridesEnum = [{ roleName: "CEO" }, { roleName: "President Director" }, { roleName: "Business Owner" }];
  const overridesUser = {
    password,
  };

  it(`${testTitle} REGISTER ${name} - ${CREATED}:CREATED`, async () => {
    for (const override of overridesEnum) {
      await register(fields, CREATED, ["photo", "citizenship", "visa"], {
        ...overridesData,
        roleName: override.roleName,
      });
    }
  });
  it(`${testTitle} REGISTER ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    await register(fields, BAD_REQUEST, ["email", "name"], {});
  });
  it(`${testTitle} SEND VERIFY EMAIL ${name} - ${OK}:OK`, async () => {
    const reg = await registerFlow(overridesData, overridesUser);
    await supertest(app).post(`/api/${moduleName}/email/verify`).send({ email: reg?.body?.email }).expect(OK);
  });

  it(`${testTitle} SEND VERIFY EMAIL ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    await registerFlow(overridesData, overridesUser);
    await supertest(app).post(`/api/${moduleName}/email/verify`).send().expect(BAD_REQUEST);
  });

  it(`${testTitle} SEND VERIFY EMAIL ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/email/verify`).send({ email: verifyEmail?.body?.email }).expect(NOT_FOUND);
  });

  it(`${testTitle} VERIFY EMAIL ${name} - ${OK}:OK`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
  });

  it(`${testTitle} VERIFY EMAIL ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const reg = await registerFlow(overridesData, overridesUser);
    await supertest(app).post(`/api/${moduleName}/email/verify`).send({ email: reg?.body?.email }).expect(OK);
    await supertest(app).patch(`/api/${moduleName}/email`).set("Authorization", "invalidtoken").expect(UNAUTHORIZED);
  });

  it(`${testTitle} VERIFY EMAIL ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    const reg = await registerFlow(overridesData, overridesUser);
    await supertest(app).post(`/api/${moduleName}/email/verify`).send({ email: reg?.body?.email }).expect(OK);
    const mockTokenShort2 = generateMockTokenRandom(reg?.body?.id, reg?.body?.email, reg?.body?.name, "", true);
    const res = await supertest(app).patch(`/api/${moduleName}/email`).set("Authorization", mockTokenShort2).expect(OK);
    await supertest(app).patch(`/api/${moduleName}/email`).set("Authorization", `Bearer ${res?.body?.token}`).expect(NOT_FOUND);
  });

  it(`${testTitle} LOGIN ${name} - ${OK}:OK`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
  });
  it(`${testTitle} LOGIN ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    const login = await loginRequest(moduleName, {}, BAD_REQUEST);
    expect(login.body.token).toBeUndefined();
    expect(login.body.status).toBe(BAD_REQUEST);
  });

  it(`${testTitle} LOGIN ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    const login = await loginRequest(moduleName, invalidCredential, UNAUTHORIZED);
    expect(login.body.token).toBeUndefined();
    expect(login.body.status).toBe(UNAUTHORIZED);
  });

  it(`${testTitle} LOGIN ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    const login = await loginRequest(moduleName, invalidCredentialBoth, UNAUTHORIZED);
    expect(login.body.token).toBeUndefined();
    expect(login.body.status).toBe(UNAUTHORIZED);
  });

  it(`${testTitle} SEND FORGOT PASSWORD EMAIL ${name} - ${OK}:OK`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: verifyEmail?.body?.email }).expect(OK);
  });

  it(`${testTitle} SEND FORGOT PASSWORD EMAIL ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).expect(BAD_REQUEST);
  });

  it(`${testTitle} SEND FORGOT PASSWORD EMAIL ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: invalidEmail }).expect(NOT_FOUND);
  });

  it(`${testTitle} FORGOT PASSWORD ${name} - ${OK}:OK`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: verifyEmail?.body?.email }).expect(OK);
    await supertest(app).patch(`/api/${moduleName}/password/forgot`).set("Authorization", `Bearer ${verifyEmail?.body?.token}`).send({ password }).expect(OK);
  });

  it(`${testTitle} FORGOT PASSWORD ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: verifyEmail?.body?.email }).expect(OK);
    await supertest(app).patch(`/api/${moduleName}/password/forgot`).set("Authorization", `Bearer ${verifyEmail?.body?.token}`).expect(BAD_REQUEST);
  });

  it(`${testTitle} FORGOT PASSWORD ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: verifyEmail?.body?.email }).expect(OK);
    const mockTokenShort2 = generateMockTokenRandom(generateRandomNumber(2), verifyEmail?.body?.email, verifyEmail?.body?.name, "", true);
    await supertest(app).patch(`/api/${moduleName}/password/forgot`).set("Authorization", mockTokenShort2).send({ password }).expect(NOT_FOUND);
  });

  it(`${testTitle} FORGOT PASSWORD ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: verifyEmail?.body?.email }).expect(OK);
    await supertest(app).patch(`/api/${moduleName}/password/forgot`).set("Authorization", `Bearer InvalidToken`).send({ password }).expect(UNAUTHORIZED);
  });

  it(`${testTitle} FORGOT PASSWORD ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const verifyEmail = await verifyEmailFlow(overridesData, overridesUser);
    expect(verifyEmail.body.token).toBeDefined();
    await supertest(app).post(`/api/${moduleName}/password/verify`).send({ email: verifyEmail?.body?.email }).expect(OK);
    await supertest(app).patch(`/api/${moduleName}/password/forgot`).set("Authorization", `Bearer ${verifyEmail?.body?.token}`).send({ password }).expect(OK);
    await supertest(app)
      .patch(`/api/${moduleName}/password/forgot`)
      .set("Authorization", `Bearer ${verifyEmail?.body?.token}`)
      .send({ password })
      .expect(UNAUTHORIZED);
  });

  it(`${testTitle} UPDATE PASSWORD ${name} - ${OK}:OK`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await supertest(app)
      .patch(`/api/${moduleName}/password/update`)
      .set("Authorization", `Bearer ${login?.body?.token}`)
      .send({
        email: login?.body?.email,
        oldPassword: password,
        password: "newPassword",
      })
      .expect(OK);
  });

  it(`${testTitle} UPDATE PASSWORD ${name} - ${BAD_REQUEST}:BAD_REQUEST`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await supertest(app).patch(`/api/${moduleName}/password/update`).set("Authorization", `Bearer ${login?.body?.token}`).expect(BAD_REQUEST);
  });

  it(`${testTitle} UPDATE PASSWORD ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await supertest(app)
      .patch(`/api/${moduleName}/password/update`)
      .set("Authorization", `Bearer ${login?.body?.token}`)
      .send({
        email: invalidEmail,
        oldPassword: password,
        password: "newPassword",
      })
      .expect(NOT_FOUND);
  });

  it(`${testTitle} UPDATE PASSWORD ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await supertest(app)
      .patch(`/api/${moduleName}/password/update`)
      .set("Authorization", `Bearer ${login?.body?.token}`)
      .send({
        email: login?.body?.email,
        oldPassword: "invalidOldPassword",
        password: "newPassword",
      })
      .expect(UNAUTHORIZED);
  });

  it(`${testTitle} GET AUTH USER ${name} - ${OK}:OK`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await sendGetRequest(`Bearer ${login?.body?.token}`, `/api/${moduleName}`, OK);
  });

  it(`${testTitle} GET AUTH USER ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await sendGetRequest(`Bearer InvalidToken`, `/api/${moduleName}`, UNAUTHORIZED);
  });

  it(`${testTitle} GET AUTH USER ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    const mockTokenShort2 = generateMockTokenRandom(generateRandomNumber(2), login?.body?.email, login?.body?.name, "", true);
    await sendGetRequest(mockTokenShort2, `/api/${moduleName}`, UNAUTHORIZED);
  });

  it(`${testTitle} REFRESH TOKEN ${name} - ${OK}:OK`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await sendGetRequest(`Bearer ${login?.body?.token}`, `/api/${moduleName}/refresh`, CREATED);
  });

  it(`${testTitle} REFRESH TOKEN ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await sendGetRequest(`Bearer InvalidToken`, `/api/${moduleName}/refresh`, UNAUTHORIZED);
  });

  it(`${testTitle} REFRESH TOKEN ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    const mockTokenShort2 = generateMockTokenRandom(generateRandomNumber(2), login?.body?.email, login?.body?.name, "", true);
    await sendGetRequest(mockTokenShort2, `/api/${moduleName}/refresh`, UNAUTHORIZED);
    await supertest(app).get(`/api/${moduleName}/refresh`).set("Authorization", mockTokenShort2).expect(UNAUTHORIZED);
  });

  it(`${testTitle} LOGOUT ${name} - ${OK}:OK`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await sendGetRequest(`Bearer ${login?.body?.token}`, `/api/${moduleName}/logout`, OK);
  });

  it(`${testTitle} LOGOUT ${name} - ${UNAUTHORIZED}:UNAUTHORIZED`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    await sendGetRequest(`Bearer InvalidToken`, `/api/${moduleName}/logout`, UNAUTHORIZED);
  });

  it(`${testTitle} LOGOUT ${name} - ${NOT_FOUND}:NOT_FOUND`, async () => {
    const login = await loginFlow(overridesData, overridesUser);
    expect(login.body.token).toBeDefined();
    const mockTokenShort2 = generateMockTokenRandom(generateRandomNumber(2), login?.body?.user?.email, login?.body?.user?.name, "", true);
    await sendGetRequest(mockTokenShort2, `/api/${moduleName}/logout`, NOT_FOUND);
  });
});
