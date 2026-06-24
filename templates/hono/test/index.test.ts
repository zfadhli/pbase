import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("Tasks API", () => {
  it("logs in, creates a task, and lists tasks", async () => {
    const app = await createApp();

    const loginRes = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "alice@test.com" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers.get("set-cookie");
    expect(cookies).toBeTruthy();

    const createRes = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Test task" }),
      headers: { "Content-Type": "application/json", Cookie: cookies! },
    });
    expect(createRes.status).toBe(201);
    const task = await createRes.json();
    expect(task.title).toBe("Test task");

    const listRes = await app.request("/tasks", {
      headers: { Cookie: cookies! },
    });
    expect(listRes.status).toBe(200);
    const tasks = await listRes.json();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Test task");
  });

  it("rejects unauthenticated requests", async () => {
    const app = await createApp();

    const res = await app.request("/me");
    expect(res.status).toBe(401);

    const tasksRes = await app.request("/tasks");
    expect(tasksRes.status).toBe(401);
  });

  it("serves OpenAPI spec", async () => {
    const app = await createApp();

    const res = await app.request("/openapi.json");
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.info.title).toBe("Tasks API");
  });
});
