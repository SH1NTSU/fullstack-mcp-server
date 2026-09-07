import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import {
  createTodo,
  createTodoSchema,
  deleteTodo,
  getTodo,
  listTodos,
  todoIdSchema,
  updateTodo,
  updateTodoSchema,
} from "@/lib/todos";

function result(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function failure(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

type ToolResponse = ReturnType<typeof result> | ReturnType<typeof failure>;

async function runTool(
  operation: () => Promise<ToolResponse>,
): Promise<ToolResponse> {
  try {
    return await operation();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
    return failure(message);
  }
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "list_todos",
    {
      title: "Pobierz wszystkie todo",
      description: "zwraca tablice elementów todo",
      inputSchema: z.object({}),
    },
    () => {
      return runTool(async () => result(await listTodos()));
    },
  );
  server.registerTool(
    "create_todo",
    {
      title: "Utwórz todo",
      description: "Utwórz nowe todo",
      inputSchema: createTodoSchema,
    },
    async (input) => {
      return runTool(async () => result(await createTodo(input)));
    },
  );
});

export { handler as GET, handler as POST };
