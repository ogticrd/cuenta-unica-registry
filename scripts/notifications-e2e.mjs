import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const buzonRoot = resolve(projectRoot, "../buzon-ciudadano");

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const result = {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsMatch = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*)=(.*)$/);
    if (equalsMatch) {
      result[equalsMatch[1]] = stripQuotes(equalsMatch[2].trim());
      continue;
    }

    const colonMatch = line.match(/^([^:=#]+):\s*(.*)$/);
    if (colonMatch) {
      result[colonMatch[1].trim()] = stripQuotes(colonMatch[2].trim());
    }
  }

  return result;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function getFirstConfiguredKey(value) {
  return value
    ?.split(",")
    .map((key) => key.trim())
    .filter(Boolean)[0];
}

function normalizeCitizenId(value) {
  const normalized = value.replace(/\D/g, "");

  if (normalized.length !== 11) {
    throw new Error(
      "Missing a valid 11-digit citizen id. Set E2E_CITIZEN_ID or configure cedula/user in .env.",
    );
  }

  return normalized;
}

const cuentaEnv = {
  ...parseEnvFile(resolve(projectRoot, ".env")),
  ...parseEnvFile(resolve(projectRoot, ".env.local")),
};

const buzonEnv = {
  ...parseEnvFile(resolve(buzonRoot, ".env.example")),
  ...parseEnvFile(resolve(buzonRoot, ".env.local")),
};

const baseUrl =
  process.env.BUZON_API_BASE_URL ??
  cuentaEnv.BUZON_API_BASE_URL ??
  buzonEnv.BUZON_API_BASE_URL ??
  "http://localhost:3010";

const portalApiKey =
  process.env.BUZON_PORTAL_API_KEY ??
  cuentaEnv.BUZON_PORTAL_API_KEY ??
  getFirstConfiguredKey(buzonEnv.BUZON_PORTAL_API_KEYS);

const producerApiKey =
  process.env.BUZON_PRODUCER_API_KEY ??
  getFirstConfiguredKey(process.env.BUZON_PRODUCER_API_KEYS) ??
  getFirstConfiguredKey(buzonEnv.BUZON_PRODUCER_API_KEYS);

const citizenId = normalizeCitizenId(
  process.env.E2E_CITIZEN_ID ??
    cuentaEnv["cedula/user"] ??
    cuentaEnv.CEDULA ??
    cuentaEnv.USER ??
    "",
);

if (!portalApiKey) {
  throw new Error("Missing BUZON_PORTAL_API_KEY.");
}

if (!producerApiKey) {
  throw new Error("Missing BUZON_PRODUCER_API_KEY or BUZON_PRODUCER_API_KEYS.");
}

const runId = randomUUID();
const notificationTitle = `E2E Cuenta Unica ${runId.slice(0, 8)}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson({ path, method = "POST", key, body, headers = {} }) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed with ${response.status}: ${json.error ?? text}`,
    );
  }

  return json;
}

async function expectStatus({
  path,
  method = "POST",
  key,
  body,
  headers = {},
}) {
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (key) {
    requestHeaders.Authorization = `Bearer ${key}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: JSON.stringify(body),
  });

  return response.status;
}

async function queryInbox(status) {
  return requestJson({
    path: "/api/v1/inbox/query",
    key: portalApiKey,
    body: {
      citizenId,
      status,
      limit: 100,
    },
  });
}

async function main() {
  console.log("Running Buzon Ciudadano notification E2E flow...");

  const unauthorizedStatus = await expectStatus({
    path: "/api/v1/inbox/query",
    body: { citizenId, limit: 1 },
  });
  assert(
    unauthorizedStatus === 401,
    "Inbox query without API key must be rejected.",
  );

  const missingIdempotencyStatus = await expectStatus({
    path: "/api/v1/notifications",
    key: producerApiKey,
    body: {
      recipient: { citizenId },
      topic: "security",
      priority: "normal",
      title: notificationTitle,
      message:
        "This request must be rejected because it has no idempotency key.",
      channels: ["portal"],
      source: "cuenta-unica-registry-e2e",
      producer: "cuenta-unica-registry-e2e",
    },
  });
  assert(
    missingIdempotencyStatus === 400,
    "Notification creation without Idempotency-Key must be rejected.",
  );

  const created = await requestJson({
    path: "/api/v1/notifications",
    key: producerApiKey,
    headers: {
      "Idempotency-Key": `cuenta-unica-e2e-${runId}`,
    },
    body: {
      recipient: { citizenId },
      topic: "security",
      priority: "high",
      title: notificationTitle,
      message:
        "Notification created by the Cuenta Unica local E2E runner for Buzon validation.",
      channels: ["portal", "email", "sms", "whatsapp"],
      action: {
        label: "Ver notificaciones",
        url: "http://localhost:3000/notifications",
      },
      metadata: {
        runId,
        suite: "cuenta-unica-notifications",
      },
      source: "cuenta-unica-registry-e2e",
      producer: "cuenta-unica-registry-e2e",
    },
  });

  assert(
    created.recipientId,
    "Created notification must be delivered to portal.",
  );

  const unreadInbox = await queryInbox("unread");
  assert(
    unreadInbox.notifications.some(
      (notification) => notification.id === created.recipientId,
    ),
    "Created notification must appear as unread.",
  );

  await requestJson({
    path: `/api/v1/inbox/${created.recipientId}`,
    method: "PATCH",
    key: portalApiKey,
    body: {
      citizenId,
      status: "read",
    },
  });

  const readInbox = await queryInbox("read");
  assert(
    readInbox.notifications.some(
      (notification) =>
        notification.id === created.recipientId &&
        notification.status === "read",
    ),
    "Notification must move to read status.",
  );

  await requestJson({
    path: `/api/v1/inbox/${created.recipientId}`,
    method: "PATCH",
    key: portalApiKey,
    body: {
      citizenId,
      status: "unread",
    },
  });

  const unreadAgainInbox = await queryInbox("unread");
  assert(
    unreadAgainInbox.notifications.some(
      (notification) =>
        notification.id === created.recipientId &&
        notification.status === "unread",
    ),
    "Notification must move back to unread status.",
  );

  await requestJson({
    path: `/api/v1/inbox/${created.recipientId}`,
    method: "PATCH",
    key: portalApiKey,
    body: {
      citizenId,
      status: "archived",
    },
  });

  const visibleInbox = await queryInbox();
  assert(
    !visibleInbox.notifications.some(
      (notification) => notification.id === created.recipientId,
    ),
    "Archived notification must be hidden from the default inbox.",
  );

  const archivedInbox = await queryInbox("archived");
  assert(
    archivedInbox.notifications.some(
      (notification) =>
        notification.id === created.recipientId &&
        notification.status === "archived",
    ),
    "Archived notification must remain queryable by explicit archived status.",
  );

  const currentPreferences = await requestJson({
    path: "/api/v1/preferences/query",
    key: portalApiKey,
    body: { citizenId },
  });

  const targetPreference = currentPreferences.preferences.find(
    (preference) =>
      preference.topic === "account" && preference.channel === "email",
  );
  assert(targetPreference, "Expected account/email preference to exist.");

  const toggledPreferences = currentPreferences.preferences.map(
    (preference) => ({
      topic: preference.topic,
      channel: preference.channel,
      enabled:
        preference.topic === targetPreference.topic &&
        preference.channel === targetPreference.channel
          ? !targetPreference.enabled
          : preference.enabled,
    }),
  );

  const updatedPreferences = await requestJson({
    path: "/api/v1/preferences",
    method: "PUT",
    key: portalApiKey,
    body: {
      citizenId,
      preferences: toggledPreferences,
    },
  });

  const updatedTarget = updatedPreferences.preferences.find(
    (preference) =>
      preference.topic === targetPreference.topic &&
      preference.channel === targetPreference.channel,
  );
  assert(
    updatedTarget?.enabled === !targetPreference.enabled,
    "Preference update must persist.",
  );

  await requestJson({
    path: "/api/v1/preferences",
    method: "PUT",
    key: portalApiKey,
    body: {
      citizenId,
      preferences: currentPreferences.preferences.map((preference) => ({
        topic: preference.topic,
        channel: preference.channel,
        enabled: preference.enabled,
      })),
    },
  });

  console.log("Buzon Ciudadano E2E flow passed.");
  console.log("- auth and idempotency errors rejected");
  console.log("- notification read/unread/archive states persisted");
  console.log("- preferences update persisted and was restored");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
