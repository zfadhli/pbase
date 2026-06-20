import { describe, expect, it } from "vitest";
import { validateProjectName, validateTemplateName } from "../src/errors";

describe("validateProjectName", () => {
  it("accepts valid names", () => {
    expect(validateProjectName("my-lib")).toBe(null);
    expect(validateProjectName("a")).toBe(null);
    expect(validateProjectName("my.lib")).toBe(null);
    expect(validateProjectName("my_lib")).toBe(null);
    expect(validateProjectName("my~lib")).toBe(null);
  });

  it("rejects empty name", () => {
    expect(validateProjectName("")).not.toBe(null);
  });

  it("rejects scoped names", () => {
    expect(validateProjectName("@scope/name")).not.toBe(null);
  });

  it("rejects names with uppercase", () => {
    expect(validateProjectName("MyLib")).not.toBe(null);
  });

  it("rejects overly long names", () => {
    expect(validateProjectName("a".repeat(215))).not.toBe(null);
  });
});

describe("validateTemplateName", () => {
  it("accepts valid template names", () => {
    expect(validateTemplateName("lib")).toBe(null);
    expect(validateTemplateName("pkg")).toBe(null);
    expect(validateTemplateName("my-template")).toBe(null);
    expect(validateTemplateName("MyTemplate")).toBe(null);
  });

  it("rejects path traversal", () => {
    expect(validateTemplateName("../../etc")).not.toBe(null);
    expect(validateTemplateName("../foo")).not.toBe(null);
    expect(validateTemplateName("/absolute/path")).not.toBe(null);
  });

  it("rejects empty name", () => {
    expect(validateTemplateName("")).not.toBe(null);
  });

  it("rejects names with spaces", () => {
    expect(validateTemplateName("my template")).not.toBe(null);
  });
});
