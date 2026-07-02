import { describe, expect, it } from "vitest";
import {
  buildAnalyticsContextStartPath,
  getAnalyticsLaunchEntryPath,
} from "@/lib/analytics/client-launch-core";

describe("analytics client launch helpers", () => {
  it("builds a context refresh URL for known auth entry paths", () => {
    expect(
      buildAnalyticsContextStartPath({
        clientId: "client-123",
        entryPath: "/recovery",
        returnUrl: "https://client.example.test/callback",
      }),
    ).toBe(
      "/api/analytics/start?client_id=client-123&entry_path=%2Frecovery&return_url=https%3A%2F%2Fclient.example.test%2Fcallback",
    );
  });

  it("falls back to the direct entry path when there is no linked client", () => {
    expect(
      buildAnalyticsContextStartPath({
        clientId: "__unlinked__",
        entryPath: "/register",
      }),
    ).toBe("/register");
  });

  it("only accepts known auth entry paths from launch URLs", () => {
    expect(
      getAnalyticsLaunchEntryPath(
        new URL(
          "https://registry.example.test/api/analytics/start?entry_path=/settings",
        ),
      ),
    ).toBe("/settings");
    expect(
      getAnalyticsLaunchEntryPath(
        new URL(
          "https://registry.example.test/api/analytics/start?entry_path=https://evil.example.test",
        ),
      ),
    ).toBe("/register");
  });
});
