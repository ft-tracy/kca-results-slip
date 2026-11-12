import { describe, it, expect } from "vitest";
import { gradeFor, gpa, recommendation } from "@/lib/grading";

describe("grading", () => {
  it("grade boundaries", () => {
    expect(gradeFor(70)).toBe("A");
    expect(gradeFor(69)).toBe("B");
    expect(gradeFor(50)).toBe("C");
    expect(gradeFor(40)).toBe("D");
    expect(gradeFor(39)).toBe("E");
  });
  it("weighted gpa", () => {
    expect(gpa([{ total: 80, credit_hours: 3 }, { total: 45, credit_hours: 3 }])).toBe(2.5);
  });
  it("recommendation", () => {
    expect(recommendation([{ total: 55 }])).toMatch(/PASS/);
    expect(recommendation([{ total: 30 }, { total: 60 }])).toMatch(/SUPPLEMENTARY in 1 unit/);
    expect(recommendation([{ total: 1 }, { total: 2 }, { total: 3 }])).toMatch(/REPEAT/);
  });
});
