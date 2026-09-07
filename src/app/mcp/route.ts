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
  server.registerTool(
    "get_todo",
    {
      title: "Pobierz todo",
      description: "Zwraca pojedyncze todo na podstawie identyfikatora",
      inputSchema: z.object({ id: todoIdSchema }),
    },
    async ({ id }) => {
      return runTool(async () => {
        const todo = await getTodo(id);
        if (!todo) {
          return failure(`Nie znaleziono todo o id ${id}.`);
        }
        return result(todo);
      });
    },
  );
  server.registerTool(
    "update_todo",
    {
      title: "Zaktualizuj todo",
      description: "Aktualizuje tytuł i/lub status ukończenia todo",
      inputSchema: z.object({ id: todoIdSchema }).and(updateTodoSchema),
    },
    async ({ id, ...changes }) => {
      return runTool(async () => {
        const todo = await updateTodo(id, changes);
        if (!todo) {
          return failure(`Nie znaleziono todo o id ${id}.`);
        }
        return result(todo);
      });
    },
  );
  server.registerTool(
    "delete_todo",
    {
      title: "Usuń todo",
      description: "Usuwa todo na podstawie identyfikatora",
      inputSchema: z.object({ id: todoIdSchema }),
    },
    async ({ id }) => {
      return runTool(async () => {
        const deleted = await deleteTodo(id);
        if (!deleted) {
          return failure(`Nie znaleziono todo o id ${id}.`);
        }
        return result({ id, deleted: true });
      });
    },
  );
});

export { handler as GET, handler as POST };
