import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("API smoke tests", () => {
  it("reports health without requiring a database connection", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true, name: "HireSphere AI API" });
  });

  it("returns a consistent 404 payload for unknown routes", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("was not found");
  });

  it("validates login input before touching the database", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({ email: "not-an-email" });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("prevents public registration as an administrator", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });

    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Validation failed.");
  });

  it("rejects anonymous access to protected routes", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
