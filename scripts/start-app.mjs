import { spawn } from "node:child_process";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://gymai:gymai@localhost:5432/gymai";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "local-dev-session-secret-at-least-32-chars";
const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:5173";
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";
const PORT = process.env.PORT ?? "3001";

const args = new Set(process.argv.slice(2));
const skipSetup = args.has("--skip-setup");
const setupOnly = args.has("--setup-only");
const help = args.has("--help") || args.has("-h");

if (help) {
  console.log(`
Usage:
  npm run start:app

Options:
  --skip-setup   Skip Docker and Prisma setup, then start both dev servers
  --setup-only   Start Postgres and run Prisma setup, then exit

Environment overrides:
  DATABASE_URL, SESSION_SECRET, APP_ORIGIN, API_BASE_URL, PORT, OPEN_ROUTER_KEY
`);
  process.exit(0);
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArgs.join(" ")} exited with ${signal ?? code}`));
    });
  });
}

function start(command, commandArgs, options = {}) {
  const child = spawn(command, commandArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`${command} ${commandArgs.join(" ")} exited with ${signal ?? code}`);
    shutdown(code ?? 1);
  });

  return child;
}

let shuttingDown = false;
const children = [];

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  if (!process.env.OPEN_ROUTER_KEY) {
    console.warn("OPEN_ROUTER_KEY is not set. The app will start, but AI plan generation will fail.");
  }

  if (!skipSetup) {
    await run("docker", ["info"], { stdio: "ignore" }).catch(() => {
      throw new Error("Docker is not running. Start Docker Desktop, then run npm run start:app again.");
    });
    await run("docker", ["compose", "up", "-d", "postgres"]);
    await run("npm", ["run", "db:generate", "--prefix", "server"], {
      env: { ...process.env, DATABASE_URL },
    });
    await run("npm", ["run", "db:migrate", "--prefix", "server"], {
      env: { ...process.env, DATABASE_URL },
    });
  }

  if (setupOnly) {
    return;
  }

  const serverEnv = {
    ...process.env,
    DATABASE_URL,
    SESSION_SECRET,
    APP_ORIGIN,
    API_BASE_URL,
    PORT,
    ENABLE_DEV_LOGIN: process.env.ENABLE_DEV_LOGIN ?? "true",
  };

  children.push(
    start("npm", ["run", "dev:server", "--prefix", "server"], {
      env: serverEnv,
    }),
  );
  children.push(start("npm", ["run", "dev"]));

  console.log(`
GymAI is starting:
  Frontend: ${APP_ORIGIN}
  Backend:  ${API_BASE_URL}

Press Ctrl+C to stop both dev servers.
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
});
