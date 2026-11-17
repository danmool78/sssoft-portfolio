// 작업 칠판의 일기: 칠판(index.html의 BOARD)에 적힌 작품마다, 그날 병합된 PR 제목을 모아
// Gemini가 우리말 일기 몇 줄로 정리한다. 결과는 public/live/diary.json (board-data 가지에 보관).
// 날마다 PR 묶음이 바뀌었을 때만 다시 쓰고, 오늘·어제만 다시 본다 (지난 일기는 그대로 둔다).
// 환경변수: GEMINI_API_KEY(필수), GITHUB_TOKEN(공개 저장소 읽기 — 한도를 넉넉하게)
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const KEY = process.env.GEMINI_API_KEY, GH = process.env.GITHUB_TOKEN;
const OUT = 'public/live/diary.json', KEEP_DAYS = 14;
const MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
if (!KEY) { console.error('GEMINI_API_KEY가 없습니다'); process.exit(1); }

// 칠판 목록은 index.html의 BOARD 한 곳에만 둔다
const html = await readFile('public/index.html', 'utf8');
// 항목: { name, repo, only?, skip? } — only/skip은 PR 제목 정규식(같은 저장소를 작품별로 나눌 때)
const board = [...html.matchAll(/\{\s*name:\s*"([^"]+)",\s*repo:\s*"([^"]+)"([^}]*)\}/g)].map(m => {
  const rx = k => { const v = m[3].match(new RegExp(`${k}:\\s*"([^"]+)"`)); return v && new RegExp(v[1].replace(/\\\\/g, '\\'), 'i'); };
  return { name: m[1], repo: m[2], only: rx('only'), skip: rx('skip'), commits: /src:\s*"commits"/.test(m[3]) };
});
if (!board.length) { console.error('index.html에서 BOARD를 찾지 못했습니다'); process.exit(1); }

let old = { entries: [] };
try { old = JSON.parse(await readFile(OUT, 'utf8')); } catch {}

// 한국 시간 기준 날짜
const kst = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
const today = kst(Date.now()), yesterday = kst(Date.now() - 864e5);
const since = Date.now() - KEEP_DAYS * 864e5;

const cache = {};
const merged = (repo, commits) => cache[repo] ||= commits ? commitsRaw(repo) : mergedRaw(repo);
// PR 없이 main에 바로 올리는 저장소: 커밋 제목을 쓴다(병합 커밋은 뺀다)
async function commitsRaw(repo) {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=100&page=${page}&since=${new Date(since).toISOString()}`,
      { headers: { accept: 'application/vnd.github+json', ...(GH ? { authorization: `Bearer ${GH}` } : {}) } });
    if (!r.ok) throw Error(`${repo}: GitHub ${r.status}`);
    const list = await r.json();
    for (const c of list) if ((c.parents || []).length < 2) out.push({ n: c.sha, title: c.commit.message.split('\n')[0], at: Date.parse(c.commit.committer.date) });
    if (list.length < 100) break;
  }
  return out;
}
async function mergedRaw(repo) {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`https://api.github.com/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`,
      { headers: { accept: 'application/vnd.github+json', ...(GH ? { authorization: `Bearer ${GH}` } : {}) } });
    if (!r.ok) throw Error(`${repo}: GitHub ${r.status}`);
    const list = await r.json();
    for (const p of list) if (p.merged_at) out.push({ n: p.number, title: p.title, at: Date.parse(p.merged_at) });
    if (list.length < 100 || Date.parse(list.at(-1).updated_at) < since) break;
  }
  return out.filter(p => p.at >= since);
}

async function write(name, date, prs) {
  const lines = prs.sort((a, b) => a.at - b.at).map(p => `- ${p.title}`).join('\n');
  const prompt = `너는 SSSOFT 작업 기록에 그날의 작업 일기를 짧게 적는 사람이다.
아래는 ${date}에 '${name}' 작품에서 병합된 작업 제목들이다. 이것만 보고 우리말 일기를 써라.
- 1~2문장, 110자 안쪽, '~했다'로 끝나는 짧은 일기체. 가장 큰 일 두세 가지만 골라 압축한다.
- 제목에 있는 일만 쓴다. 없는 일·감정·결과를 지어내지 말 것.
- 비슷한 작업은 묶어서 "무엇을 어떻게 다듬었다"로 말하고, 파일 이름·코드 용어는 쉬운 말로 바꾼다.
- 'Game:'으로 시작하는 제목은 순례 게임 작업이다(일기에 'Game'이라 쓰지 말 것). 'e33' 같은 장면 번호는 '예수 여정 33번 장면'처럼, Psalms·Paul·Kings·David·Moses·Proverbs는 시편·바울·열왕기·다윗·모세·잠언으로.
- 이모티콘을 쓰지 말 것. 일기 본문만 답하라.

${lines}`;
  for (const model of MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
    });
    const j = await r.json().catch(() => ({}));
    const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim();
    if (r.ok && text) return text.replace(/\s+/g, ' ');
    console.error(`${model}: ${j.error?.message || r.status}`);
  }
  return null;
}

const entries = [];
for (const b of board) {
  const prs = (await merged(b.repo, b.commits)).filter(p => (!b.only || b.only.test(p.title)) && (!b.skip || !b.skip.test(p.title)));
  const byDay = {};
  for (const p of prs) (byDay[kst(p.at)] ||= []).push(p);
  for (const [date, list] of Object.entries(byDay)) {
    const hash = createHash('sha1').update('v2:' + list.map(p => String(p.n)).sort().join(',')).digest('hex').slice(0, 12);
    const prev = old.entries.find(e => e.name === b.name && e.date === date);
    if (prev && (prev.hash === hash || (date !== today && date !== yesterday))) { entries.push(prev); continue; }
    if (date !== today && date !== yesterday && !prev) continue; // 처음 돌 때 지난 날을 한꺼번에 쓰지 않는다
    const text = await write(b.name, date, list);
    if (text) entries.push({ name: b.name, repo: b.repo, date, count: list.length, hash, text });
    else if (prev) entries.push(prev);
  }
}
entries.sort((a, z) => (a.date < z.date ? 1 : a.date > z.date ? -1 : 0));
const next = { entries };
const same = JSON.stringify(old.entries) === JSON.stringify(entries);
if (!same) await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), ...next }, null, 1) + '\n');
console.log(same ? 'no change' : `diary: ${entries.length} entries`);
