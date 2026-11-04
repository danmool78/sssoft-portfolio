// public/sitemap.xml 생성.
// - lastmod: 각 페이지(와 그 페이지에 쓰이는 파일)의 마지막 커밋 날짜. 커밋 안 된 변경이 있으면 오늘 날짜.
// - 홈: 카드에 보이는 앱 화면 이미지(data.js 기준)·공유 이미지, 32초 릴스 영상.
// 사용: npm run sitemap
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const SITE = "https://sssoft-idea.web.app/";

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
const today = new Date().toISOString().slice(0, 10);
function lastmod(specs) {
  if (git("status", "--porcelain", "--", ...specs)) return today;
  return git("log", "-1", "--format=%cs", "--", ...specs) || today;
}
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = p => SITE + p.split("/").map(encodeURIComponent).join("/");
const exists = p => fs.existsSync(path.join(PUB, p));

// data.js → window.PROJECTS
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(PUB, "data.js"), "utf8"), ctx);
const P = ctx.window.PROJECTS;

// 홈 카드에 그려지는 앱 화면 (index.html visual())
const images = ["og-image.png"];
for (const p of P) {
  if (p.frame === "svg") continue;
  const src = `shots/${p.shot}-${p.frame === "phone" ? "m" : "d"}.png`;
  if (exists(src)) images.push(src);
}

const pages = [
  {
    loc: SITE,
    lastmod: lastmod([
      "public",
      ":!public/contract.html", ":!public/maintenance.html",
      ":!public/sitemap.xml", ":!public/robots.txt", ":!public/live",
    ]),
    images,
    video: {
      thumb: "sssoft-reel-poster.jpg",
      content: "sssoft-reel-720.mp4",
      title: "32초 만에 보는 SSSOFT",
      desc: "캠프마스터부터 STARFARER, 다정 리딩북, 그 길, 비전 퀘스트까지. 아이디어가 서비스가 되는 순간들을 짧게 모은 SSSOFT 소개 영상입니다.",
      duration: 32,
    },
  },
  // 앱 소개 페이지(scripts/apps.cjs가 만든 public/apps/{id}/): 그 페이지에 나오는 화면·장면·미리보기 이미지
  ...P.map(p => ({
    loc: `${SITE}apps/${p.id}/`,
    lastmod: lastmod([`public/apps/${p.id}`]),
    images: [
      p.frame !== "svg" && `shots/${p.shot}-${p.frame === "phone" ? "m" : "d"}.png`,
      p.frame === "browser" && `shots/${p.shot}-m.png`,
      p.scene && p.scene.src,
      ...(p.gallery || []).map(g => g.src),
    ].filter(s => s && !/^https?:/.test(s) && exists(s)),
  })),
  { loc: SITE + "contract.html", lastmod: lastmod(["public/contract.html"]) },
  { loc: SITE + "maintenance.html", lastmod: lastmod(["public/maintenance.html"]) },
];

const out = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
  '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
];
for (const pg of pages) {
  out.push("  <url>", `    <loc>${esc(pg.loc)}</loc>`, `    <lastmod>${pg.lastmod}</lastmod>`);
  for (const img of pg.images || []) out.push(`    <image:image><image:loc>${esc(abs(img))}</image:loc></image:image>`);
  const v = pg.video;
  if (v && exists(v.content) && exists(v.thumb)) {
    out.push(
      "    <video:video>",
      `      <video:thumbnail_loc>${esc(abs(v.thumb))}</video:thumbnail_loc>`,
      `      <video:title>${esc(v.title)}</video:title>`,
      `      <video:description>${esc(v.desc)}</video:description>`,
      `      <video:content_loc>${esc(abs(v.content))}</video:content_loc>`,
      `      <video:duration>${v.duration}</video:duration>`,
      "    </video:video>",
    );
  }
  out.push("  </url>");
}
out.push("</urlset>", "");

fs.writeFileSync(path.join(PUB, "sitemap.xml"), out.join("\n"));
// 서치 콘솔이 sitemap.xml을 한 달 넘게 "가져올 수 없음"으로 두어서, 확장(이미지·영상) 없는 기본형과
// 주소만 적은 텍스트형도 함께 만든다. 같은 페이지 목록이라 어느 쪽으로 제출해도 된다
fs.writeFileSync(path.join(PUB, "sitemap-pages.xml"), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(pg => `  <url><loc>${esc(pg.loc)}</loc><lastmod>${pg.lastmod}</lastmod></url>`),
  "</urlset>", "",
].join("\n"));
fs.writeFileSync(path.join(PUB, "sitemap.txt"), pages.map(pg => pg.loc).join("\n") + "\n");
console.log(`sitemap.xml: ${pages.length} pages, ${images.length} images`);
