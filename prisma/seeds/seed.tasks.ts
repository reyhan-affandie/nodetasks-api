import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const seedTasks = async ({ author, assignee }) => {
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

  // Get all priorities (Low, Medium, High) from DB
  const priorities = await prisma.priorities.findMany({
    where: { name: { in: ["Low", "Medium", "High"] } },
    orderBy: { id: "asc" },
  });

  if (!priorities || priorities.length < 3) {
    throw new Error("Please seed priorities table with at least: Low, Medium, High");
  }

  const phaseId = 1; // adjust if needed

  for (const task of sampleTasks) {
    const found = await prisma.tasks.findFirst({ where: { name: task.name } });
    if (!found) {
      const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];

      // Get the current date parts in local time
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate(); // This is the local day of the month

      // Create a new Date object representing the desired local date at 00:00:00
      // To ensure it's stored as the correct date in the DB (even if internally UTC)
      // we create it such that its UTC representation is also at the start of that day.
      // This often involves setting the time to 00:00:00 UTC.
      const start = new Date(Date.UTC(year, month, date, 0, 0, 0)); // Create a UTC date at 00:00:00 UTC for the desired local date

      const daysToAdd = Math.floor(Math.random() * 7) + 1;
      // Calculate deadline similarly, ensuring it's the correct date at 00:00:00 UTC
      const deadline = new Date(Date.UTC(year, month, date + daysToAdd, 0, 0, 0));

      const newTask = await prisma.tasks.create({
        data: {
          phaseId,
          priorityId: randomPriority.id,
          name: task.name,
          description: task.description,
          authorId: author.id,
          assigneeId: assignee.id,
          start: start,
          deadline: deadline,
        },
      });

      const changedById = Math.random() < 0.5 ? author.id : assignee.id;

      await prisma.taskhistories.create({
        data: {
          taskId: newTask.id,
          fromPhaseId: null,
          toPhaseId: phaseId,
          changedById,
          name: uuidv4(),
        },
      });

      console.log(
        `✅ Created Task: "${task.name}" | phaseId: ${phaseId}, priorityId: ${randomPriority.id} (${randomPriority.name}), start: ${start.toLocaleDateString()}, deadline: ${deadline.toLocaleDateString()}`,
      );
    } else {
      console.log(`⏭️ Skipped Task (exists): "${task.name}"`);
    }
  }
};
