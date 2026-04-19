import { readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { ErrorObject } from "ajv";

const require = createRequire(import.meta.url);
const Ajv = require("ajv") as typeof import("ajv").default;
const addFormats = require("ajv-formats") as (a: InstanceType<typeof Ajv>) => void;

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "../schemas/hardware-protocol.schema.json");
const raw = JSON.parse(readFileSync(schemaPath, "utf8")) as Record<string, unknown>;
// Ajv does not bundle the draft-2020 meta-schema URL; omit `$schema` so `compile` does not resolve it.
const { $schema: _ignoredMeta, ...schema } = raw;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

export type HardwareProtocol = Record<string, unknown> & {
  schemaVersion?: string;
  sessionDurationMinutes?: number;
};

export function isValidHardwareProtocol(data: unknown): data is HardwareProtocol {
  return validate(data) === true;
}

export function validationErrors(data: unknown): string[] {
  validate(data);
  return (validate.errors ?? []).map(
    (e: ErrorObject) => `${e.instancePath || "/"} ${e.message}`,
  );
}
