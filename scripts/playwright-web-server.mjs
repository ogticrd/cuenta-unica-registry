import { spawn } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const standaloneDir = path.join(rootDir, ".next", "standalone");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} exited with ${signal ?? `code ${code}`}`,
        ),
      );
    });
  });
}

async function copyStandaloneAssets() {
  const standaloneNextDir = path.join(standaloneDir, ".next");
  const standaloneStaticDir = path.join(standaloneNextDir, "static");
  const standalonePublicDir = path.join(standaloneDir, "public");

  await mkdir(standaloneNextDir, { recursive: true });
  await rm(standaloneStaticDir, { recursive: true, force: true });
  await rm(standalonePublicDir, { recursive: true, force: true });
  await cp(path.join(rootDir, ".next", "static"), standaloneStaticDir, {
    recursive: true,
  });
  await cp(path.join(rootDir, "public"), standalonePublicDir, {
    recursive: true,
  });
}

async function startStandaloneServer() {
  const server = spawn(
    process.execPath,
    [path.join(standaloneDir, "server.js")],
    {
      cwd: standaloneDir,
      env: {
        ...process.env,
        PORT: process.env.PORT ?? "3000",
      },
      stdio: "inherit",
    },
  );
  let isStopping = false;

  const stopServer = (signal) => {
    isStopping = true;

    if (!server.killed) {
      server.kill(signal);
      return;
    }

    process.exit(0);
  };

  process.on("SIGINT", () => stopServer("SIGINT"));
  process.on("SIGTERM", () => stopServer("SIGTERM"));

  server.on("error", (error) => {
    throw error;
  });
  server.on("exit", (code, signal) => {
    if (isStopping) {
      process.exit(0);
      return;
    }

    if (signal) {
      process.exit(1);
      return;
    }

    process.exit(code ?? 0);
  });
}

try {
  await run("bun", ["run", "build"]);
  await copyStandaloneAssets();
  await startStandaloneServer();
} catch (error) {
  console.error("[playwright-web-server] Failed to start:", error);
  process.exit(1);
}
