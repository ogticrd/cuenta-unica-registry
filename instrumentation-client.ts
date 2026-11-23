import { reportClientError } from "@/lib/logging/client";

window.addEventListener("error", (event) => {
  reportClientError("client_error", {}, event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError("client_unhandled_rejection", {}, event.reason);
});
