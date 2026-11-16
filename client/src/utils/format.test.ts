import { describe, expect, it } from "vitest";
import { formatDate, formatSalary, getInitials, timeAgo, titleCase } from "./format";

describe("formatSalary", () => {
  it("handles undisclosed and single-bound salaries", () => {
    expect(formatSalary()).toBe("Salary not disclosed");
    expect(formatSalary(50000)).toContain("50,000");
    expect(formatSalary(null, 90000)).toContain("90,000");
  });

  it("formats ranges", () => {
    expect(formatSalary(50000, 70000)).toContain("50,000");
    expect(formatSalary(50000, 70000)).toContain("70,000");
  });
});

describe("date helpers", () => {
  it("renders placeholders for empty values", () => {
    expect(formatDate()).toBe("—");
  });

  it("describes recent timestamps", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
    expect(timeAgo(new Date(Date.now() - 2 * 86_400_000).toISOString())).toContain("2 days ago");
  });
});

describe("title and initials helpers", () => {
  it("converts enum values into labels", () => {
    expect(titleCase("full_time")).toBe("Full Time");
  });

  it("derives at most two initials", () => {
    expect(getInitials("Ada Lovelace Byron")).toBe("AL");
    expect(getInitials()).toBe("?");
  });
});
