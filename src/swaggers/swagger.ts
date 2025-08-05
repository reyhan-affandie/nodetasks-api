/* eslint-disable @typescript-eslint/no-explicit-any */
import swaggerJsdoc from "swagger-jsdoc";
import { auth } from "@/swaggers/auth.docs";
import { phases } from "@/swaggers/phases.docs";
import { events } from "@/swaggers/events.docs";
import { schedules } from "@/swaggers/schedules.docs";
import { tasks } from "@/swaggers/tasks.docs";
import { taskhistories } from "@/swaggers/taskhistories.docs";
import { users } from "@/swaggers/users.docs";

import { APP_NAME, APP_ORIGIN } from "@/constants/env";

const docs = [auth, events, phases, schedules, tasks, taskhistories, users];
const tags: any[] = [];
const paths: Record<string, any> = {};
docs.forEach((doc) => {
  if (doc.tags) tags.push(...doc.tags);
  if (doc.paths) Object.assign(paths, doc.paths);
});
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: `${APP_NAME} API`,
      version: "1.0.0",
      description: `API documentation for ${APP_NAME}`,
    },
    components: auth.components,
    security: auth.security,
    tags: tags,
    paths: paths,
    servers: [
      {
        url: [APP_ORIGIN],
      },
    ],
  },
  customCss: ".swagger-ui textarea { min-height: 150px !important; }",
  apis: ["@/src/routes/*.ts"],
};
const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
