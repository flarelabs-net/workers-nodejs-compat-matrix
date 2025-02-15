import assert from "node:assert";
import events from "node:events";
import fs from "node:fs/promises";
import childProcess from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import workerd from "workerd";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function spawnWorkerd(configPath) {
  const workerdProcess = childProcess.spawn(
    workerd.default,
    [
      "serve",
      "--experimental",
      "--verbose",
      "--control-fd=3",
      "--socket-addr=http=127.0.0.1:0",
      configPath,
    ],
    { stdio: ["inherit", "inherit", "inherit", "pipe"] }
  );
  const exitPromise = events.once(workerdProcess, "exit");
  const [chunk] = await events.once(workerdProcess.stdio[3], "data");
  const message = JSON.parse(chunk.toString().trim());
  assert.strictEqual(message.event, "listen");
  return {
    url: new URL(`http://127.0.0.1:${message.port}`),
    async kill() {
      workerdProcess.kill("SIGKILL");
      await exitPromise;
    },
  };
}

const compatibilityDate = process.argv[2] ?? "";
const capnpPath = path.join(__dirname, "config.capnp");
const capnp = await fs.readFile(capnpPath, { encoding: "utf8" });
const updatedCapnp = capnp
  .split("\n")
  .map((line) =>
    line.includes("compatibilityDate")
      ? `  compatibilityDate = "${compatibilityDate}",`
      : line
  )
  .join("\n");
await fs.writeFile(capnpPath, updatedCapnp);

const outputFilePath = path.join(__dirname, "..", "data", "workerd.json");
await fs.rm(outputFilePath, { force: true });
const { url, kill } = await spawnWorkerd(path.join(__dirname, "config.capnp"));
const res = await fetch(url);
await kill();

await fs.writeFile(outputFilePath, Buffer.from(await res.arrayBuffer()));
