import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseTranslations = vi.fn((namespace: string) => (key: string) => {
  return `${namespace}.${key}`;
});
const mockUseLocale = vi.fn(() => "es");

vi.mock("next-intl", () => ({
  useTranslations: mockUseTranslations,
  useLocale: mockUseLocale,
}));

import { useLocale, useT } from "@/hooks/use-t";

describe("useT", () => {
  it("delegates to next-intl with the provided namespace", () => {
    const { result } = renderHook(() => useT("login"));

    expect(mockUseTranslations).toHaveBeenCalledWith("login");
    expect(result.current("title")).toBe("login.title");
  });

  it("re-reads translations when the namespace changes", () => {
    const { result, rerender } = renderHook(
      ({ namespace }) => useT(namespace),
      { initialProps: { namespace: "login" } },
    );

    expect(result.current("title")).toBe("login.title");

    rerender({ namespace: "register" });

    expect(mockUseTranslations).toHaveBeenLastCalledWith("register");
    expect(result.current("title")).toBe("register.title");
  });
});

describe("useLocale", () => {
  it("delegates to next-intl locale resolution", () => {
    const { result } = renderHook(() => useLocale());

    expect(mockUseLocale).toHaveBeenCalledTimes(1);
    expect(result.current).toBe("es");
  });

  it("returns whatever locale next-intl resolves", () => {
    mockUseLocale.mockReturnValueOnce("en");

    const { result } = renderHook(() => useLocale());

    expect(result.current).toBe("en");
  });
});
