/**
 * 抓取指定 layer 的 MasterGo DSL（等同 magic-mcp 的 getDsl 工具）。
 * Token 来源：环境变量 MG_MCP_TOKEN / MASTERGO_API_TOKEN，或同目录 .token 文件。
 * 用法：node fetch-dsl.mjs 2960:44433:scene-hover dy2983:48053:ws-chip nk2868:58658:quick-chip nk2868:57925:new-hover
 *       node fetch-dsl.mjs --all   # 一次抓全部预置层
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE_ID = '193158744355579';
const BASE = 'https://mastergo.com';
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

function readToken() {
  if (process.env.MG_MCP_TOKEN) return process.env.MG_MCP_TOKEN.trim();
  if (process.env.MASTERGO_API_TOKEN) return process.env.MASTERGO_API_TOKEN.trim();
  const f = path.join(HERE, '.token');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  return '';
}

const PRESET = {
  'scene-hover': '2960:44433',
  'ws-chip': 'dy2983:48053',
  'quick-chip': 'nk2868:58658',
  'new-hover': 'nk2868:57925',
};

const token = readToken();
if (!token) {
  console.error('缺少访问令牌：请把 MasterGo 访问令牌写到 .mg-d2c/.token，或设置 MG_MCP_TOKEN');
  process.exit(2);
}

const args = process.argv.slice(2);
const tasks = args[0] === '--all'
  ? Object.entries(PRESET).map(([name, id]) => [id, name])
  : args.map((a) => {
      const parts = a.split(':');
      const name = parts.length > 2 ? parts.slice(2).join('-') : parts.join('-');
      return [parts.slice(0, 2).join(':'), name];
    });

const outDir = path.join(HERE, 'layers');
fs.mkdirSync(outDir, { recursive: true });

for (const [layerId, name] of tasks) {
  const url = `${BASE}/mcp/dsl?fileId=${encodeURIComponent(FILE_ID)}&layerId=${encodeURIComponent(layerId)}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-MG-UserAccessToken': token },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[${name}] HTTP ${res.status}: ${text.slice(0, 200)}`);
      continue;
    }
    const json = JSON.parse(text);
    const dsl = json.data ?? json;
    const file = path.join(outDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(dsl, null, 1));
    const nodes = dsl.nodes?.length ?? 0;
    const size = fs.statSync(file).size;
    console.log(`[${name}] ok → ${path.relative(HERE, file)} (${size}B, ${nodes} node)`);
  } catch (e) {
    console.error(`[${name}] 失败: ${e.message}`);
  }
}
