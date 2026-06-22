import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotificationProvider,
  useNotifications,
} from "@/lib/notifications/notification-context";
import type { CitizenNotification } from "@/lib/notifications/types";
import { notificationService } from "@/lib/services/notifications/notification.service";

const { mockToastError } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/lib/services/notifications/notification.service", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    updateNotification: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

function notification(
  overrides: Partial<CitizenNotification> = {},
): CitizenNotification {
  return {
    id: "security",
    notificationId: "event-security",
    topic: "security",
    priority: "normal",
    title: "Security",
    message: "Security message",
    status: "unread",
    channels: ["portal"],
    actionLabel: null,
    actionUrl: null,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    readAt: null,
    archivedAt: null,
    ...overrides,
  };
}

function NotificationConsumer() {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const currentStatus = notifications[0]?.status ?? "empty";

  return (
    <div>
      <span data-testid="status">{currentStatus}</span>
      <span data-testid="unread">{unreadCount}</span>
      <button type="button" onClick={() => markRead("security")}>
        mark read
      </button>
      <button type="button" onClick={markAllRead}>
        mark all read
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <NotificationProvider>
      <NotificationConsumer />
    </NotificationProvider>,
  );
}

describe("NotificationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: [notification()],
      unreadCount: 1,
    });
  });

  it("rolls back a notification status update when the API returns a coded failure", async () => {
    vi.mocked(notificationService.updateNotification).mockResolvedValueOnce({
      success: false,
      code: "not_found",
      error: "not_found",
    });

    renderProvider();

    await expect(screen.findByTestId("status")).resolves.toHaveTextContent(
      "unread",
    );

    await userEvent.click(screen.getByRole("button", { name: "mark read" }));

    await waitFor(() => {
      expect(notificationService.updateNotification).toHaveBeenCalledWith(
        "security",
        "read",
      );
      expect(screen.getByTestId("status")).toHaveTextContent("unread");
      expect(screen.getByTestId("unread")).toHaveTextContent("1");
      expect(mockToastError).toHaveBeenCalledWith(
        "No se pudo actualizar la notificacion.",
      );
    });
  });

  it("rolls back mark-all-read when the API returns a coded unavailable failure", async () => {
    vi.mocked(notificationService.markAllRead).mockResolvedValueOnce({
      success: false,
      unavailable: true,
      code: "notifications_unavailable",
      error: "notifications_unavailable",
    });

    renderProvider();

    await expect(screen.findByTestId("unread")).resolves.toHaveTextContent("1");

    await userEvent.click(
      screen.getByRole("button", { name: "mark all read" }),
    );

    await waitFor(() => {
      expect(notificationService.markAllRead).toHaveBeenCalled();
      expect(screen.getByTestId("status")).toHaveTextContent("unread");
      expect(screen.getByTestId("unread")).toHaveTextContent("1");
      expect(mockToastError).toHaveBeenCalledWith(
        "No se pudieron marcar las notificaciones como leidas.",
      );
    });
  });
});
