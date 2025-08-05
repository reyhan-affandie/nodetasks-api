import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const seedTasks = async () => {
  const sampleTasks = [
    { name: "Setup project repository", description: "Initialize a new git repository and push the initial project structure." },
    { name: "Design database schema", description: "Plan out the tables, fields, and relationships for the application's data model." },
    { name: "Implement authentication", description: "Add user registration and login functionality, including password hashing." },
    { name: "Create landing page", description: "Build a responsive landing page with project highlights and a contact form." },
    { name: "Write unit tests", description: "Create automated tests to validate business logic and prevent regressions." },
    { name: "Configure CI/CD pipeline", description: "Set up continuous integration and deployment using Github Actions." },
    { name: "Draft API documentation", description: "Write OpenAPI specs and usage examples for all endpoints." },
    { name: "Review code for bugs", description: "Perform a code review to catch errors, bad patterns, and potential bugs." },
    { name: "Optimize performance", description: "Analyze bottlenecks and refactor code for better speed and resource usage." },
    { name: "Deploy to production", description: "Launch the completed application to the live production environment." },
  ];

  const users = await prisma.users.findMany();
  const priorities = await prisma.priorities.findMany({
    where: { name: { in: ["Low", "Medium", "High"] } },
    orderBy: { id: "asc" },
  });
  const phases = await prisma.phases.findMany();

  if (!priorities.length || !phases.length) {
    throw new Error("Priorities and phases must be seeded before running this task seed.");
  }

  for (const user of users) {
    for (let month = 7; month <= 9; month++) {
      const taskCount = Math.floor(Math.random() * 8) + 3; // 3 to 10

      for (let i = 0; i < taskCount; i++) {
        const task = sampleTasks[Math.floor(Math.random() * sampleTasks.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const phase = phases[Math.floor(Math.random() * phases.length)];

        const day = Math.floor(Math.random() * 28) + 1;
        const start = new Date(2025, month, day);
        const deadline = new Date(start);
        deadline.setDate(start.getDate() + Math.floor(Math.random() * 5) + 1);

        const created = await prisma.tasks.create({
          data: {
            name: task.name,
            description: task.description,
            priorityId: priority.id,
            phaseId: phase.id,
            authorId: user.id,
            assigneeId: user.id,
            start,
            deadline,
          },
        });

        await prisma.taskhistories.create({
          data: {
            taskId: created.id,
            fromPhaseId: null,
            toPhaseId: phase.id,
            changedById: user.id,
            name: uuidv4(),
          },
        });

        console.log(`✅ ${user.name} | ${task.name} | ${start.toDateString()} → ${deadline.toDateString()} | Phase: ${phase.name}`);
      }
    }
  }
};
