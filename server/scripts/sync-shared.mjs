// 공통 정의(shared/src)를 서버 함수 폴더로 옮긴다.
// 원본은 shared/src다. functions/_shared/defs는 사본이라 직접 고치지 않는다.
// Edge Functions는 functions 폴더 안의 파일만 올린다고 안내하고 있어 사본을 둔다.
//
//   node scripts/sync-shared.mjs          사본을 다시 만든다
//   node scripts/sync-shared.mjs --check  사본이 원본과 같은지만 본다

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const from = join(root, "shared", "src");
const to = join(root, "server", "supabase", "functions", "_shared", "defs");
const banner = "// 사본이다. 고치지 않는다. 원본은 shared/src이고 server/scripts/sync-shared.mjs가 옮긴다.\n";

const files = readdirSync(from).filter((f) => f.endsWith(".ts")).sort();
const want = new Map(files.map((f) => [f, banner + readFileSync(join(from, f), "utf8")]));

if (process.argv.includes("--check")) {
  const have = existsSync(to) ? readdirSync(to).sort() : [];
  const same = have.length === files.length &&
    files.every((f) => existsSync(join(to, f)) && readFileSync(join(to, f), "utf8") === want.get(f));
  if (!same) {
    console.error("공통 정의의 사본이 원본과 다릅니다. npm run sync 를 돌리세요.");
    process.exit(1);
  }
  console.log(`공통 정의 사본 ${files.length}개가 원본과 같습니다.`);
} else {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  for (const [f, text] of want) writeFileSync(join(to, f), text);
  console.log(`공통 정의 ${files.length}개를 옮겼습니다.`);
}
