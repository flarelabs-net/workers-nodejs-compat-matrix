import assert from "node:assert";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// One liner to kill phantom workerd processes
// ps ax | grep workerd | grep workers-nodejs-support | awk '{ print $1 }' | xargs kill

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spawnWrangler = async () => {
  const wranglerProcess = spawn(
    "node_modules/.bin/wrangler",
    ["dev", `--port=0`, "worker.mjs"],
    {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      cwd: __dirname,
      env: { ...process.env, PWD: __dirname },
    }
  );

  wranglerProcess.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });

  wranglerProcess.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  const url = await new Promise((res) => {
    wranglerProcess.on("message", (message) => {
      const { event, ip, port } = JSON.parse(message);
      assert.strictEqual(event, "DEV_SERVER_READY");
      res(new URL(`http://${ip}:${port}`));
    });
  });

  const kill = async () => {
    wranglerProcess.kill("SIGTERM");
    return new Promise((res, rej) => {
      wranglerProcess.on("close", () => res());
      wranglerProcess.on("error", () => rej());
    });
  };

  return {
    kill,
    url,
  };
};

const dump = async () => {
  const outputFilePath = path.join(
    __dirname,
    "..",
    "data",
    "wrangler-unenv-polyfills.json"
  );
  console.log("Deleting ", outputFilePath);
  await fs.rm(outputFilePath, { force: true });

  // Spawn wrangler
  console.log("Spawning wrangler");
  const { kill, url } = await spawnWrangler();

  // Make request to test worker
  console.log("Fetching from test worker");
  const res = await fetch(url);

  // Write results to file
  await fs.writeFile(outputFilePath, Buffer.from(await res.arrayBuffer()));
  console.log(
    "Done! Result written to",
    path.relative(__dirname, outputFilePath)
  );
  await kill();
};

const compatibilityDate = process.argv[2] ?? "";
const tomlPath = path.join(__dirname, "wrangler.toml");
const toml = await fs.readFile(tomlPath, "utf-8");
const updatedToml = toml
  .split("\n")
  .map((line) =>
    line.includes("compatibility_date")
      ? `compatibility_date = "${compatibilityDate}"`
      : line
  )
  .join("\n");
await fs.writeFile(tomlPath, updatedToml);

await dump();
