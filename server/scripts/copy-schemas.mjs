import { cpSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src", "schemas");
const dst = join(root, "dist", "schemas");
if (!existsSync(src)) process.exit(0);
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
