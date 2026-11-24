"use client";

import { useEffect } from "react";
import { z } from "zod";
import { reportClientError } from "@/lib/logging/client";

const messages = z.array(z.object({ id: z.number(), type: z.string() }));
const flowSchema = z.object({
  ui: z.object({
    messages: messages.optional(),
    nodes: z.array(z.object({ messages: messages.optional() })).optional(),
  }),
});

export function OryErrorObserver({
  flow,
  form,
}: {
  flow: unknown;
  form: "login" | "verification" | "account_recovery";
}) {
  useEffect(() => {
    const result = flowSchema.safeParse(flow);
    if (!result.success) return;
    const errors = [
      ...(result.data.ui.messages ?? []),
      ...(result.data.ui.nodes ?? []).flatMap((node) => node.messages ?? []),
    ].filter((message) => message.type === "error");
    if (errors.length) {
      reportClientError("form_error", {
        form,
        code: "ory_validation_error",
        messageIds: errors.slice(0, 20).map((message) => message.id),
      });
    }
  }, [flow, form]);
  return null;
}
