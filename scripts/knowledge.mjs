import { readFile, readdir, writeFile, access } from "node:fs/promises";
import { resolve, relative, dirname, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import Ajv from "ajv";
import ts from "typescript";
import prettier from "prettier";

const groups = {
  artworks: "Artwork",
  discussions: "Discussion",
  experiments: "Experiment",
  decisions: "Decision",
};
function validDate(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    return false;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
export function parseRecord(text, label) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!match) throw new Error(label + ": missing YAML frontmatter");
  const meta = YAML.parse(match[1], { uniqueKeys: true });
  if (
    !meta ||
    typeof meta !== "object" ||
    Array.isArray(meta) ||
    typeof meta.type !== "string" ||
    !meta.type.trim()
  )
    throw new Error(label + ": missing type");
  if (!match[2].trim()) throw new Error(label + ": empty body");
  return { meta, body: match[2] };
}
async function markdownFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await markdownFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(path);
  }
  return result.sort();
}
export async function loadKnowledge(root) {
  const bundle = resolve(root, "okf");
  const schema = JSON.parse(
    await readFile(resolve(bundle, "schema/metadata.schema.json"), "utf8"),
  );
  const ajv = new Ajv({ allErrors: true });
  ajv.addFormat("offset-datetime", validDate);
  const validate = ajv.compile(schema);
  const records = [];
  async function checkPath(target, from) {
    if (/^https?:\/\//.test(target) || target.startsWith("#")) return;
    const path = resolve(
      dirname(from),
      decodeURIComponent(target.split("#")[0]),
    );
    const local = relative(root, path);
    if (local === ".." || local.startsWith(".." + sep) || local.startsWith(sep))
      throw new Error(from + ": path escapes repository: " + target);
    await access(path).catch(() => {
      throw new Error(from + ": missing path: " + target);
    });
  }
  for (const path of await markdownFiles(bundle)) {
    const name = relative(bundle, path).split(sep).join("/");
    if (["index.md", "log.md"].includes(basename(path))) {
      const text = await readFile(path, "utf8");
      for (const match of text.matchAll(/\]\(([^\s)]+)\)/g))
        await checkPath(match[1], path);
      continue;
    }
    const { meta, body } = parseRecord(await readFile(path, "utf8"), name);
    for (const match of body.matchAll(/\]\(([^\s)]+)\)/g))
      await checkPath(match[1], path);
    const group = name.split("/")[0];
    if (!(group in groups)) continue; // README and templates are auxiliary concepts.
    if (!validate(meta))
      throw new Error(name + ": " + ajv.errorsText(validate.errors));
    if (meta.id !== name.slice(0, -3) || meta.type !== groups[group])
      throw new Error(name + ": id/type must match path");
    if (Date.parse(meta.updated) < Date.parse(meta.created))
      throw new Error(name + ": updated precedes created");
    for (const source of meta.sources) await checkPath(source.resource, path);
    if (meta.implementation_path)
      await checkPath(
        meta.implementation_path,
        resolve(root, "repository-root.md"),
      );
    if (
      meta.type === "Artwork" &&
      meta.production_status === "implemented" &&
      (!meta.implementation_path || !meta.commit_sha)
    )
      throw new Error(
        name + ": implemented artwork needs code path and evidence SHA",
      );
    records.push({ ...meta, path: name });
  }
  const ids = new Set(records.map((record) => record.id));
  const artworks = new Map();
  for (const record of records) {
    if (record.type === "Artwork") {
      if (artworks.has(record.artwork_id))
        throw new Error("Duplicate artwork_id: " + record.artwork_id);
      artworks.set(record.artwork_id, record);
    }
  }
  for (const record of records) {
    for (const id of record.related_artworks ?? [])
      if (!artworks.has(id))
        throw new Error(record.id + ": unknown artwork " + id);
    for (const id of record.related_discussions ?? [])
      if (!ids.has(id))
        throw new Error(record.id + ": unknown discussion " + id);
  }
  // Read registry syntax without executing React or importing application code.
  const source = ts.createSourceFile(
    "artworks.ts",
    await readFile(resolve(root, "lib/artworks.ts"), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const registry = [];
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "artworks" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const item of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(item))
          throw new Error("Unsupported artwork registry entry");
        registry.push(
          Object.fromEntries(
            item.properties
              .filter(ts.isPropertyAssignment)
              .map((property) => [
                property.name.getText(source),
                ts.isStringLiteral(property.initializer)
                  ? property.initializer.text
                  : property.initializer.getText(source),
              ]),
          ),
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!registry.length) throw new Error("Artwork registry was not found");
  for (const entry of registry) {
    const record = artworks.get(entry.id);
    if (
      !record ||
      record.title !== entry.title ||
      record.production_status !== "implemented" ||
      record.implementation_path !==
        "components/artworks/" + entry.component + ".tsx"
    )
      throw new Error("Missing or stale artwork record: " + entry.id);
  }
  for (const record of artworks.values())
    if (
      record.production_status === "implemented" &&
      !registry.some((entry) => entry.id === record.artwork_id)
    )
      throw new Error(
        "Implemented artwork absent from registry: " + record.artwork_id,
      );
  return records.sort((a, b) => a.id.localeCompare(b.id, "en"));
}
export async function renderIndexes(records) {
  const markdown =
    '---\nokf_version: "0.2"\n---\n\n# 404 NOT FOUNDS knowledge index\n\n生成物。編集は各記録で行い、npm run knowledge:index を実行する。[運用](README.md)\n\n' +
    Object.entries(groups)
      .map(
        ([group, type]) =>
          "## " +
          type +
          "\n\n" +
          (records
            .filter((record) => record.type === type)
            .map(
              (record) =>
                "- [" +
                record.title +
                "](" +
                record.path +
                ") - " +
                record.description,
            )
            .join("\n") ||
            (group === "discussions"
              ? "確認できる原ログなし。[登録方針](discussions/index.md)"
              : "未登録。")),
      )
      .join("\n\n") +
    "\n";
  return {
    "index.json": await prettier.format(
      JSON.stringify({ okf_version: "0.2", records }, null, 2),
      { parser: "json" },
    ),
    "index.md": await prettier.format(markdown, { parser: "markdown" }),
  };
}
export async function checkKnowledge(root, write = false) {
  const records = await loadKnowledge(root);
  for (const [name, content] of Object.entries(await renderIndexes(records))) {
    const path = resolve(root, "okf", name);
    if (write) await writeFile(path, content);
    else if ((await readFile(path, "utf8").catch(() => "")) !== content)
      throw new Error(name + ": stale index; run npm run knowledge:index");
  }
  return records.length;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const count = await checkKnowledge(
      resolve(fileURLToPath(new URL("../", import.meta.url))),
      process.argv.includes("--write"),
    );
    console.log(
      "Knowledge: " +
        count +
        " records validated" +
        (process.argv.includes("--write")
          ? "; indexes generated"
          : "; indexes current"),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
