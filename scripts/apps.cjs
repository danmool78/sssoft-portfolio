// public/apps/{id}/index.html 생성 — 앱마다 검색에 걸리는 소개 페이지.
// 홈은 data.js를 자바스크립트로 그려 상세 내용이 창(모달) 안에만 있으므로, 같은 내용을 앱마다 주소가 있는 정적 HTML로 만든다.
// 스타일은 index.html의 <style>을 그대로 쓰고, 상세 화면(open)과 같은 짜임으로 그린다.
// 다정 리딩북 권수는 public/live/readingbook-classics.json으로 맞춘다(index.html applyBookCounts와 같은 방식).
// 사용: npm run apps (npm run deploy가 먼저 부른다)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const SITE = "https://sssoft-idea.web.app/";
const OUT = path.join(PUB, "apps");

const index = fs.readFileSync(path.join(PUB, "index.html"), "utf8");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(PUB, "data.js"), "utf8"), ctx);
const P = ctx.window.PROJECTS;

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const exists = p => fs.existsSync(path.join(PUB, p));
const u = src => /^https?:/.test(src) ? src : "/" + src; // 페이지가 /apps/{id}/ 아래라 사이트 기준 경로로
const css = index.match(/<style>([\s\S]*?)<\/style>/)[1];
// 큐티레이스 카드 그림은 index.html의 qtSvg를 그대로 쓴다
const qtSvg = new Function(index.match(/function qtSvg\(c\)\{[\s\S]*?\n\}/)[0] + "; return qtSvg;")();

// 다정 리딩북 권수: index.html의 BOOK_BASE·BOOK_LABELS를 읽어 같은 방식으로 바꾼다
(function bookCounts() {
  const base = vm.runInNewContext("(" + index.match(/const BOOK_BASE = (\{[^}]*\})/)[1] + ")");
  const labels = vm.runInNewContext("(" + index.match(/const BOOK_LABELS = (\{[^}]*\})/)[1] + ")");
  let langs;
  try { langs = JSON.parse(fs.readFileSync(path.join(PUB, "live/readingbook-classics.json"), "utf8")).languages; } catch (e) { return; }
  const p = P.find(x => x.id === "readingbook"); if (!p || !langs) return;
  const keys = Object.keys(base), n = keys.length;
  if (!keys.every(k => Number.isInteger(langs[k]) && langs[k] >= 0)) return;
  const fmt = n => n.toLocaleString("en-US");
  const sum = o => keys.reduce((t, k) => t + o[k], 0);
  const total = sum(langs), b = sum(base);
  if (total < b / 2) return;
  let text = JSON.stringify(p).split(fmt(b * n)).join(fmt(total * n)).split(fmt(b)).join(fmt(total));
  for (const k of keys) text = text.split(`${labels[k]} ${fmt(base[k])}`).join(`${labels[k]} ${fmt(langs[k])}`);
  Object.assign(p, JSON.parse(text));
})();

const shot = p => p.frame === "svg" ? null : `shots/${p.shot}-${p.frame === "phone" ? "m" : "d"}.png`;
function visual(p) {
  if (p.frame === "svg") return qtSvg(p.color);
  const src = shot(p);
  return p.frame === "phone"
    ? `<div class="phone"><img src="${u(src)}" alt="${esc(p.title)} 앱 화면"></div>`
    : `<div class="browser"><img src="${u(src)}" alt="${esc(p.title)} 웹 화면"></div>`;
}
const CATEGORY = { game: "GameApplication", ai: "EducationalApplication", church: "LifestyleApplication", biz: "BusinessApplication", life: "FinanceApplication" };
const cut = (s, n) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";

function page(p) {
  const url = `${SITE}apps/${p.id}/`;
  const image = p.scene ? (p.scene.card || p.scene.src) : (shot(p) || "og-image.png");
  const desc = cut(`${p.tagline}. ${p.overview}`.replace(/\.\./g, "."), 155);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication", "@id": url + "#app", name: p.title, alternateName: p.en,
        description: p.overview, url: p.url || url, image: SITE + image,
        applicationCategory: CATEGORY[p.cat] || "WebApplication",
        operatingSystem: p.play ? "Web, Android" : "Web", inLanguage: "ko",
        author: { "@id": SITE + "#org" }, publisher: { "@id": SITE + "#org" },
        ...(p.play ? { installUrl: p.play } : {}),
      },
      {
        "@type": "WebPage", "@id": url, url, name: `${p.title} — ${p.tag}`, description: desc, inLanguage: "ko",
        isPartOf: { "@id": SITE + "#site" }, about: { "@id": url + "#app" }, primaryImageOfPage: SITE + image,
        breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "SSSOFT", item: SITE },
          { "@type": "ListItem", position: 2, name: "프로젝트", item: SITE + "#work" },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ] },
      },
      { "@type": "Organization", "@id": SITE + "#org", name: "SSSOFT", url: SITE, logo: SITE + "logo-mark.svg", email: "sssoft1004@gmail.com" },
    ],
  };
  const videos = p.videos || (p.video ? [{ src: p.video, poster: p.videoPoster, label: p.videoLabel }] : []);
  const others = P.filter(x => x.id !== p.id);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} — ${esc(p.tag)} | SSSOFT</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SSSOFT">
<meta property="og:title" content="${esc(p.title)} — ${esc(p.tagline)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE + image}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/logo-mark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>${css}
/* 앱 소개 페이지: 상세 창을 페이지로 */
.crumb{font-size:14px;color:var(--muted);margin:4px 0 16px}
.crumb a{text-decoration:none;margin:0 2px;color:inherit;font-size:inherit}
.crumb a:hover{color:var(--text)}
.app{background:var(--surface);border:1px solid var(--line);border-radius:24px;overflow:hidden;margin-bottom:56px}
.app .dhead h1{font-size:clamp(30px,4vw,44px);font-weight:900;line-height:1.15;margin:4px 0 12px;font-family:GmarketSans,Pretendard,sans-serif;letter-spacing:-.01em}
.app .btn{margin-bottom:8px}
.others h2,.contact h2{font-family:GmarketSans,Pretendard,sans-serif}
.others h2{font-size:26px;margin-bottom:18px}
.olist{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;list-style:none;margin-bottom:56px}
.olist a{display:block;height:100%;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:14px;padding:14px 16px}
.olist a:hover{border-color:var(--c)}
.olist b{display:block;font-size:16px}
.olist span{color:var(--muted);font-size:13.5px}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="logo" href="/"><img src="/logo-mark.svg" alt="" width="34" height="34"><span class="lw"><b>SSS</b>OFT</span></a>
    <nav><a href="/#work">프로젝트</a><a href="/#about">회사소개</a><a href="/#process">의뢰·계약</a><a href="/#contact">문의</a></nav>
  </header>
  <nav class="crumb" aria-label="현재 위치"><a href="/">SSSOFT</a> › <a href="/#work">프로젝트</a> › ${esc(p.title)}</nav>
  <main class="app" style="--c:${p.color}">
   <div class="dhead">
     <div>
       <div class="eyebrow" style="color:${p.color}">${esc(p.tag)} · ${esc(p.en)}</div>
       <h1>${esc(p.title)}</h1>
       <div class="tl">${esc(p.tagline)}</div>
       ${p.supports ? `<div class="sup">${p.supports.map(x => `<span>✓ ${esc(x)}</span>`).join("")}</div>` : ""}
       <p class="ov">${esc(p.overview)}</p>
       ${p.url ? `<a class="btn" style="background:${p.color}" href="${p.url}" target="_blank" rel="noopener">${p.play ? "웹에서 열기 →" : "서비스 바로가기 →"}</a>` : ""}
       ${p.demo ? `<a class="btn play" href="${p.demo}" target="_blank" rel="noopener">▶ 샘플 페이지 바로가기</a>` : ""}
       ${p.play ? `<a class="btn play" href="${p.play}" target="_blank" rel="noopener">▶ Google Play에서 받기</a>` : ""}
     </div>
     <div class="dshot">${p.frame === "browser" ? (exists(`shots/${p.shot}-m.png`) ? `<div class="phone"><img src="/shots/${p.shot}-m.png" alt="${esc(p.title)} 모바일 화면"></div>` : "") : visual(p)}</div>
   </div>
   <div class="dbody">
     ${videos.map(v => `<h4>▶ ${esc(v.label || "플레이 영상")}</h4>${/\.mp4$/.test(v.src)
       ? `<div class="vid ${v.wide ? "wv" : "tall"}"><video src="${u(v.src)}" ${v.poster ? `poster="${u(v.poster)}"` : ""} controls playsinline preload="none"></video></div>`
       : `<div class="vid"><iframe src="${v.src}" title="${esc(p.title)} ${esc(v.label || "플레이 영상")}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`}`).join("")}
     ${p.scene ? `<figure class="scene"><img src="${u(p.scene.src)}" alt="${esc(p.title)} ${esc(p.scene.cap || "사용 장면")}" loading="lazy">${p.scene.cap ? `<figcaption>${esc(p.scene.cap)}</figcaption>` : ""}</figure>` : ""}
     ${p.numbers && p.numbers.length ? `<div class="nums">${p.numbers.map(n => `<div><b>${esc(n.value)}</b><small>${esc(n.label)}</small></div>`).join("")}</div>` : ""}
     ${p.record?`<h4>● ${esc(p.record.title||"실전 운영 기록")}</h4><div class="rec">${p.record.date?`<p class="rd">${esc(p.record.date)}</p>`:""}${p.record.stats?`<div class="nums">${p.record.stats.map(n=>`<div><b>${esc(n.value)}</b><small>${esc(n.label)}</small></div>`).join("")}</div>`:""}${p.record.items?`<div class="rg">${p.record.items.map(r=>`<div><b>${esc(r.title)}</b><span>${esc(r.desc)}</span></div>`).join("")}</div>`:""}${p.record.timeline?`<ol class="tlx">${p.record.timeline.map(t=>`<li><time>${esc(t.time)}</time><span>${esc(t.text)}</span></li>`).join("")}</ol>`:""}</div>`:""}
     <h4>★ 대표 기능</h4>
     <div class="flag">${(p.flagship || p.features).map((f, i) => `<div><em>${String(i + 1).padStart(2, "0")}</em><b>${esc(f.title)}</b><span>${esc(f.desc)}</span></div>`).join("")}</div>
     ${p.gallery ? `<h4>▣ 미리보기</h4><div class="gal ${p.galleryWide ? "wide" : ""} ${p.galleryTall ? "tall" : ""}">${p.gallery.map(g => `<figure><a href="${u(g.src)}" target="_blank" rel="noopener"><img src="${u(g.src)}" alt="${esc(p.title)} ${esc(g.cap || "화면")}" loading="lazy"></a>${g.cap ? `<figcaption>${esc(g.cap)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
     ${p.stages ? `<h4>◆ 처음부터 끝까지, 빠짐없는 구성</h4>
     <div class="stages">${p.stages.map((s, i) => `<details class="stg" ${i < 2 ? "open" : ""}>
       <summary><i>${i + 1}</i><div><b>${esc(s.stage)}</b>${s.summary ? `<span>${esc(s.summary)}</span>` : ""}</div><small>${s.items.length}</small></summary>
       <div class="feats">${s.items.map(f => `<div class="feat"><b>${esc(f.title)}</b><span>${esc(f.desc)}</span></div>`).join("")}</div>
     </details>`).join("")}</div>` : ""}
     ${p.roles && p.roles.length ? `<h4>● ${esc(p.rolesTitle || "사용자별 전용 도구")}</h4><div class="roles">${p.roles.map(r => `<div><b>${esc(r.role)}</b><span>${esc(r.desc)}</span></div>`).join("")}</div>` : ""}
     <div class="meta2">
       <div><h4>이런 분들을 위해</h4><p>${esc(p.audience)}</p></div>
       <div><h4>기술 스택</h4><div class="chips">${(p.tech || []).map(t => `<span>${esc(t)}</span>`).join("")}</div></div>
     </div>
     ${p.frame === "browser" ? `<div class="wide"><h4>데스크톱 화면</h4>${visual(p)}</div>` : ""}
   </div>
  </main>
  <section class="others" style="padding:0">
    <h2>SSSOFT의 다른 서비스</h2>
    <ul class="olist">${others.map(o => `<li><a href="/apps/${o.id}/" style="--c:${o.color}"><b>${esc(o.title)}</b><span>${esc(o.tag)}</span></a></li>`).join("")}</ul>
  </section>
  <div class="contact">
    <h2>이런 서비스, 함께 만들어 볼까요?</h2>
    <p>SSSOFT는 아이디어를 매일 쓰이는 서비스로 만드는 소프트웨어 스튜디오입니다.</p>
    <div class="cta2"><a class="btn" href="mailto:sssoft1004@gmail.com">sssoft1004@gmail.com</a><a class="btn kakao" href="https://open.kakao.com/o/ssPDUnSi" target="_blank" rel="noopener">카톡으로 던지기</a></div>
  </div>
</div>
<footer><div class="wrap foot"><span><b>SSSOFT</b> = <b>S</b>park · <b>S</b>hape · <b>S</b>hip — Seriously fun software.</span><span>© 2026 SSSOFT. All rights reserved.</span></div>
<div class="wrap biz"><span>상호 에스에스소프트(SSSOFT)</span><span>대표 김성수</span><span>사업자등록번호 772-01-03846</span><span>전화 <a href="tel:042-670-7577">042-670-7577</a></span><span>이메일 <a href="mailto:sssoft1004@gmail.com">sssoft1004@gmail.com</a></span></div></footer>
</body>
</html>
`;
}

// 예전에 만든 페이지 중 data.js에서 빠진 앱은 지운다
fs.mkdirSync(OUT, { recursive: true });
const ids = new Set(P.map(p => p.id));
for (const d of fs.readdirSync(OUT)) if (!ids.has(d)) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
for (const p of P) {
  fs.mkdirSync(path.join(OUT, p.id), { recursive: true });
  fs.writeFileSync(path.join(OUT, p.id, "index.html"), page(p));
}
console.log(`apps/: ${P.length} pages`);
