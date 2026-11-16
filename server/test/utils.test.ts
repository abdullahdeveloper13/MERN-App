import { describe, expect, it } from "vitest";
import { buildPaginationMeta, getPagination } from "../src/utils/pagination.js";
import { buildUniqueSlug, slugify } from "../src/utils/slug.js";

describe("pagination", () => {
  it("uses defaults and coerces page sizes", () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 12, skip: 0 });
    expect(getPagination({ page: "3", limit: "20" })).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it("caps limits and normalizes invalid input", () => {
    expect(getPagination({ page: "-1", limit: "500" }, { maxLimit: 100 })).toEqual({
      page: 1,
      limit: 100,
      skip: 0
    });
    expect(getPagination({ page: "abc", limit: "nope" })).toEqual({ page: 1, limit: 12, skip: 0 });
  });

  it("builds metadata with at least one page", () => {
    expect(buildPaginationMeta(1, 15, 0)).toEqual({ page: 1, limit: 15, total: 0, totalPages: 1 });
    expect(buildPaginationMeta(2, 15, 31)).toMatchObject({ page: 2, totalPages: 3 });
  });
});

describe("slugs", () => {
  it("normalizes text into a URL-safe slug", () => {
    expect(slugify("  Senior Frontend Engineer (Remote)  ")).toBe("senior-frontend-engineer-remote");
  });

  it("adds a suffix when a slug already exists", async () => {
    const taken = new Set(["backend-developer", "backend-developer-2"]);
    await expect(buildUniqueSlug("Backend Developer", async (slug) => taken.has(slug))).resolves.toBe(
      "backend-developer-3"
    );
  });

  it("falls back for values with no usable characters", async () => {
    await expect(buildUniqueSlug("!!!", async () => false, "job")).resolves.toBe("job");
  });
});
