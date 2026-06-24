import { createClient } from "@libsql/client";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Hono } from "hono";
import { Kysely } from "kysely";
import { requireSession, session } from "peta-auth/hono";
import { getOpenAPISpec } from "peta-docs";
import { route } from "peta-docs/hono";
import { createMigrationRunner } from "peta-migrate";
import { createORM, defineModel, hasMany, t } from "peta-orm";

const SESSION_PASSWORD = process.env.SESSION_PASSWORD ?? "change-me-to-a-32-char-string!!!!";

export async function createApp() {
  const client = createClient({ url: ":memory:" });
  const dialect = new LibsqlDialect({ client });
  const db = new Kysely({ dialect });

  const User = defineModel("users", {
    columns: {
      id: t.integer().primaryKey(),
      email: t.text().unique(),
      name: t.string(255),
    },
    relations: {
      tasks: hasMany(() => Task, { foreignKey: "userId" }),
    },
  });

  const Task = defineModel("tasks", {
    columns: {
      id: t.integer().primaryKey(),
      userId: t.integer(),
      title: t.string(255),
      completed: t.boolean().default(false),
    },
  });

  const orm = createORM({ kysely: db });
  orm.registerAll(User, Task);

  const runner = createMigrationRunner(db);
  await runner.up([
    {
      name: "001_create_users",
      content:
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL)",
    },
    {
      name: "002_create_tasks",
      content:
        "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, completed INTEGER DEFAULT 0)",
    },
  ]);

  const app = new Hono();
  app.use("*", session({ password: SESSION_PASSWORD, cookieName: "session" }));

  app.post("/auth/login", async (c) => {
    const { email } = await c.req.json<{ email: string }>();
    let user = await User.where("email", email).first();
    if (!user) {
      user = await User.insert({ email, name: email.split("@")[0] });
    }
    c.var.session.set({ userId: user.id as number });
    return c.json(user);
  });

  app.post("/auth/logout", requireSession(), (c) => {
    c.var.session.delete();
    return c.body(null, 204);
  });

  app.get("/me", requireSession(), async (c) => {
    const user = await User.find(c.var.session.userId as number);
    return c.json(user);
  });

  app.get(
    "/tasks",
    requireSession(),
    route()
      .response(
        200,
        t({ id: "number", userId: "number", title: "string", completed: "boolean" }).array(),
      )
      .handle(async (c) => {
        return c.json(await Task.where("userId", c.var.session.userId as number).execute());
      }),
  );

  app.post("/tasks", requireSession(), async (c) => {
    const { title } = await c.req.json<{ title: string }>();
    const task = await Task.insert({ title, userId: c.var.session.userId as number });
    return c.json(task, 201);
  });

  app.get("/openapi.json", (c) =>
    c.json(getOpenAPISpec(app, { title: "Tasks API", version: "1.0.0" })),
  );

  return app;
}
