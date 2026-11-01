import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { checkKnowledge, parseRecord } from "../scripts/knowledge.mjs";

test("frontmatter rejects duplicate YAML keys and missing type", () => {
  assert.throws(() =>
    parseRecord("---\ntype: Artwork\ntype: Decision\n---\nBody", "duplicate"),
  );
  assert.throws(
    () => parseRecord("---\ntitle: Missing type\n---\nBody", "missing"),
    /missing type/,
  );
});

test("knowledge authoring catches invalid records, references and stale indexes", async (t) => {
  const schema = await readFile(
    new URL("../okf/schema/metadata.schema.json", import.meta.url),
    "utf8",
  );
  const base = {
    id: "artworks/001",
    type: "Artwork",
    title: "Example",
    description: "Fixture artwork.",
    status: "draft",
    created: "2026-11-01T00:00:00Z",
    updated: "2026-11-01T00:00:00Z",
    tags: ["fixture"],
    sources: [{ resource: "../../lib/artworks.ts" }],
    artwork_id: "001",
    production_status: "implemented",
    implementation_path: "components/artworks/Example.tsx",
    commit_sha: "a".repeat(40),
  };
  async function fixture() {
    const root = await mkdtemp(resolve(tmpdir(), "404-knowledge-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const dir of [
      "okf/artworks",
      "okf/schema",
      "okf/discussions",
      "components/artworks",
      "lib",
    ])
      await mkdir(resolve(root, dir), { recursive: true });
    await writeFile(resolve(root, "okf/schema/metadata.schema.json"), schema);
    await writeFile(
      resolve(root, "okf/README.md"),
      "---\ntype: Reference\n---\n# Fixture instructions",
    );
    await writeFile(
      resolve(root, "okf/discussions/index.md"),
      "# No discussions",
    );
    await writeFile(
      resolve(root, "lib/artworks.ts"),
      'export const artworks = [{ id: "001", title: "Example", component: Example }];',
    );
    await writeFile(
      resolve(root, "components/artworks/Example.tsx"),
      "export default function Example() { return null; }",
    );
    const save = (meta: object, body = "# Fixture") =>
      writeFile(
        resolve(root, "okf/artworks/001.md"),
        "---\n" + JSON.stringify(meta) + "\n---\n" + body,
      );
    await save(base);
    return { root, save };
  }
  await t.test(
    "round trip preserves extension metadata and detects edited index",
    async () => {
      const { root, save } = await fixture();
      await save({ ...base, custom_notes: { retained: true } });
      assert.equal(await checkKnowledge(root, true), 1);
      assert.equal(await checkKnowledge(root), 1);
      const index = JSON.parse(
        await readFile(resolve(root, "okf/index.json"), "utf8"),
      );
      assert.equal(index.records[0].custom_notes.retained, true);
      await writeFile(resolve(root, "okf/index.md"), "# Outdated");
      await assert.rejects(checkKnowledge(root), /stale index/);
    },
  );
  await t.test(
    "record time must be a real datetime with an offset",
    async () => {
      const { root, save } = await fixture();
      for (const created of [
        "2026-11-01",
        "2026-02-30T00:00:00Z",
        "2026-11-01T00:00:00",
      ]) {
        await save({ ...base, created });
        await assert.rejects(checkKnowledge(root, true), /offset-datetime/);
      }
    },
  );
  await t.test("unknown related artworks and discussions fail", async () => {
    const { root, save } = await fixture();
    await save({ ...base, related_artworks: ["999"] });
    await assert.rejects(checkKnowledge(root, true), /unknown artwork/);
    await save({ ...base, related_discussions: ["discussions/missing"] });
    await assert.rejects(checkKnowledge(root, true), /unknown discussion/);
  });
  await t.test(
    "broken links, missing code and repository escapes fail",
    async () => {
      const { root, save } = await fixture();
      await save(base, "# Fixture\n[Broken](missing.md)");
      await assert.rejects(checkKnowledge(root, true), /missing path/);
      await save({
        ...base,
        implementation_path: "components/artworks/Missing.tsx",
      });
      await assert.rejects(checkKnowledge(root, true), /missing path/);
      await save({ ...base, sources: [{ resource: "../../../outside.md" }] });
      await assert.rejects(
        checkKnowledge(root, true),
        /path escapes repository/,
      );
    },
  );
  await t.test(
    "registry additions cannot be omitted from knowledge",
    async () => {
      const { root } = await fixture();
      await writeFile(
        resolve(root, "lib/artworks.ts"),
        'export const artworks = [{ id: "001", title: "Example", component: Example }, { id: "002", title: "New", component: New }];',
      );
      await assert.rejects(
        checkKnowledge(root, true),
        /Missing or stale artwork record: 002/,
      );
    },
  );
});
