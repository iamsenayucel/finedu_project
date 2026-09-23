import { describe, it, expect } from "vitest";
import { GAME_OPTIONS } from "./gameRegistry";

describe("gameRegistry.ts — AdminPanel game picker source of truth", () => {
  it("is non-empty", () => {
    expect(GAME_OPTIONS.length).toBeGreaterThan(0);
  });

  it("has no duplicate 'value' entries", () => {
    // Bu dosya + backend GAME_CHOICES + GameContainer.tsx switch aynı kod
    // setini paylaşmalı (bkz. dosya başındaki yorum). İçeride bir
    // duplicate value olursa <select> aynı oyunu iki kez listeler ve/veya
    // admin panelinde hangi label'ın seçildiği belirsizleşir.
    const values = GAME_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every option has a non-empty value and label", () => {
    for (const option of GAME_OPTIONS) {
      expect(option.value.trim().length).toBeGreaterThan(0);
      expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("every value is a snake_case identifier (matches Django CharField choice convention)", () => {
    for (const option of GAME_OPTIONS) {
      expect(option.value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});
