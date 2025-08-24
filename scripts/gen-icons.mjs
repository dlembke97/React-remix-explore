// scripts/gen-icons.mjs
import { writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const files = [
    {
        path: resolve(__dirname, "../public/favicon-16x16.png"),
        b64: "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAJElEQVR4nGNgGAWjYBSMglEwCkb9//8/DGJgZGBgGJQ2hJgBAG7pCNxwq8d/AAAAAElFTkSuQmCC"
    },
    {
        path: resolve(__dirname, "../public/favicon-32x32.png"),
        b64: "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKUlEQVR4nO3OMQEAIAwAsYl/0ZQJr4G1f1sSgQAAAAAAAAAAAM8Fv0oAAc6mQk3b7gQAAAAASUVORK5CYII="
    },
    {
        path: resolve(__dirname, "../public/apple-touch-icon.png"),
        b64: "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAABiP0oHAAAALUlEQVR4nO3BMQEAAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAA4GcEJwABo6s3dwAAAABJRU5ErkJggg=="
    }
];

async function ensureDir(p) {
    try {
        await access(p, constants.F_OK);
    } catch {
        await mkdir(p, { recursive: true });
    }
}

async function main() {
    const pub = resolve(__dirname, "../public");
    await ensureDir(pub);

    for (const f of files) {
        try {
            await access(f.path, constants.F_OK);
            console.log(`skip: ${f.path} (exists)`);
        } catch {
            const buf = Buffer.from(f.b64, "base64");
            await writeFile(f.path, buf);
            console.log(`wrote: ${f.path}`);
        }
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
