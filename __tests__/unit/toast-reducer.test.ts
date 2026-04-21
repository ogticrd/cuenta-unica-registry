import { describe, expect, it } from "vitest";
import { reducer } from "@/hooks/use-toast";

function createToast(id: string, overrides = {}) {
  return {
    id,
    open: true,
    onOpenChange: () => {},
    ...overrides,
  };
}

describe("toast reducer", () => {
  describe("ADD_TOAST", () => {
    it("adds a toast to the beginning of the list", () => {
      const state = { toasts: [] };
      const toast = createToast("1");

      const result = reducer(state, { type: "ADD_TOAST", toast });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]?.id).toBe("1");
    });

    it("prepends new toasts (most recent first) while respecting the toast limit", () => {
      const state = { toasts: [createToast("1")] };
      const toast = createToast("2");

      const result = reducer(state, { type: "ADD_TOAST", toast });

      expect(result.toasts[0]?.id).toBe("2");

      expect(result.toasts).toHaveLength(1);
    });

    it("enforces the toast limit of 1", () => {
      const state = { toasts: [createToast("1")] };
      const toast = createToast("2");

      const result = reducer(state, { type: "ADD_TOAST", toast });

      // TOAST_LIMIT is 1, so only the newest should remain
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]?.id).toBe("2");
    });
  });

  describe("UPDATE_TOAST", () => {
    it("updates a matching toast", () => {
      const state = {
        toasts: [createToast("1", { title: "Original" })],
      };

      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });

      expect(result.toasts[0]).toEqual(
        expect.objectContaining({ id: "1", title: "Updated" }),
      );
    });

    it("does not modify non-matching toasts", () => {
      const state = {
        toasts: [createToast("1", { title: "Original" })],
      };

      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "99", title: "Updated" },
      });

      expect(result.toasts[0]).toEqual(
        expect.objectContaining({ id: "1", title: "Original" }),
      );
    });
  });

  describe("DISMISS_TOAST", () => {
    it("sets open to false for a specific toast by ID", () => {
      const state = {
        toasts: [createToast("1", { open: true })],
      };

      const result = reducer(state, {
        type: "DISMISS_TOAST",
        toastId: "1",
      });

      expect(result.toasts[0]?.open).toBe(false);
    });

    it("does not affect other toasts when dismissing by ID", () => {
      const state = {
        toasts: [createToast("1"), createToast("2")],
      };

      const result = reducer(state, {
        type: "DISMISS_TOAST",
        toastId: "1",
      });

      expect(result.toasts[0]?.open).toBe(false);
      expect(result.toasts[1]?.open).toBe(true);
    });

    it("sets open to false for all toasts when no ID is provided", () => {
      const state = {
        toasts: [createToast("1"), createToast("2")],
      };

      const result = reducer(state, {
        type: "DISMISS_TOAST",
        toastId: undefined,
      });

      expect(result.toasts.every((t) => t.open === false)).toBe(true);
    });
  });

  describe("REMOVE_TOAST", () => {
    it("removes a specific toast by ID", () => {
      const state = {
        toasts: [createToast("1"), createToast("2")],
      };

      const result = reducer(state, {
        type: "REMOVE_TOAST",
        toastId: "1",
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]?.id).toBe("2");
    });

    it("clears all toasts when no ID is provided", () => {
      const state = {
        toasts: [createToast("1"), createToast("2")],
      };

      const result = reducer(state, {
        type: "REMOVE_TOAST",
        toastId: undefined,
      });

      expect(result.toasts).toHaveLength(0);
    });

    it("returns unchanged state when toast ID does not exist", () => {
      const state = {
        toasts: [createToast("1")],
      };

      const result = reducer(state, {
        type: "REMOVE_TOAST",
        toastId: "99",
      });

      expect(result.toasts).toHaveLength(1);
    });
  });
});
