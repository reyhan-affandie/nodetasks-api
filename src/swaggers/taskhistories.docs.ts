const moduleName = "taskhistories";
const moduleSingular = "taskhistory";
const tags = moduleName.toUpperCase();

export const taskhistories = {
  tags: [
    {
      name: tags,
      description: "API",
    },
  ],
  paths: {
    [`/api/${moduleName}`]: {
      get: {
        tags: [tags],
        summary: `Read ${moduleName} List`,
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            schema: { type: "integer", example: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
          {
            name: "search",
            in: "query",
            description: "Search query string",
            schema: { type: "string" },
          },
          {
            name: "sort",
            in: "query",
            description: "Field to sort by",
            schema: { type: "string", example: "createdAt" },
          },
          {
            name: "order",
            in: "query",
            description: "Order of sorting",
            schema: { type: "string", enum: ["asc", "desc"], example: "desc" },
          },
        ],
        responses: {},
      },
    },
    [`/api/${moduleName}/{id}`]: {
      get: {
        tags: [tags],
        summary: `Read ${moduleSingular} details`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {},
      },
    },
  },
};
