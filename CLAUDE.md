# SSSOFT 포트폴리오

SSSOFT(Spark · Shape · Ship)의 회사 소개·포트폴리오 사이트와 홍보 릴스.

- 공개 주소: https://sssoft-idea.web.app (같은 내용이 https://sssoft-portfolio.web.app 에도 배포됨)
- Firebase 프로젝트: `sssoft-portfolio` (Hosting 사이트 2개: `sssoft-idea`, `sssoft-portfolio`)
- 문의 메일: sssoft1004@gmail.com

## 구조

```
public/            ← 배포되는 사이트. 이 폴더가 원본이다 (루트에 복사본을 만들지 않는다)
  index.html       페이지 레이아웃·스타일·렌더링 코드
  data.js          프로젝트(앱) 데이터: window.PROJECTS = [...]
  contract.html    소프트웨어 개발 용역 표준계약서 (흰 바탕·검은 글씨 문서, 다크 모드 없음)
  maintenance.html 소프트웨어 유지보수 표준계약서 (연간/건당 선택)
  logo-mark.svg    로고 심볼 (블록 S + 불꽃)
  shots/           카드·상세 화면 대표 이미지 ({id}-m.png 폰, {id}-d.png 데스크톱)
  gallery/         상세 화면 미리보기 이미지
  sssoft-reel-720.mp4, sssoft-reel-poster.jpg  사이트용 릴스
  apps/{id}/       앱마다 검색에 걸리는 소개 페이지. scripts/apps.cjs가 data.js로 만든다 (직접 고치지 않는다)
  sitemap.xml      scripts/sitemap.cjs가 만든다 (직접 고치지 않는다)
scripts/apps.cjs     apps/{id}/index.html 생성: 상세 창과 같은 내용을 정적 HTML로(제목·설명·SoftwareApplication 구조화 데이터)
scripts/sitemap.cjs  sitemap.xml 생성: 페이지별 lastmod(git 커밋 날짜), 홈 카드 이미지, 릴스 영상, 앱 소개 페이지
reel/              홍보 릴스(32초, 1080×1920) 원본
  reel.html        프레임 단위 애니메이션 (window.render(t))
  render.cjs       reel.html → sssoft-reel-nomusic.mp4
  mux.cjs          메인곡 입히기 + 사이트용 720p·포스터 생성
  sssoft-reel.mp4  업로드용 완성본 (음악 포함)
design/            로고·글꼴 시안, 원본 캡처
```

## 배포

```
firebase deploy --only hosting
```

`npm run deploy`는 앱 소개 페이지(public/apps)와 sitemap.xml을 다시 만든 뒤 배포한다. data.js를 고치면 `npm run apps`로 만든 페이지도 함께 커밋한다. 두 사이트에 함께 배포된다. html/js/png 등은 `no-cache` 헤더라 새로고침하면 바로 반영된다.
클라우드(GitHub)에서는 `main`에 push하면 `.github/workflows/deploy.yml`이 배포한다
(배포 전에 sitemap.xml도 다시 만든다. 저장소 Secret `FIREBASE_SERVICE_ACCOUNT_SSSOFT_PORTFOLIO` 필요).

## 앱 데이터(data.js) 규칙

각 프로젝트 필드: `id, title, en, cat(church|ai|game|biz|life), tag, color, url, play?, demo?, share?(true면 카드·상세에 "앱 공유하기" 버튼: 휴대폰은 공유 창, PC는 url 복사),
shot, frame(phone|browser|svg), tagline, overview, flagship[], stages[{stage,summary,items[]}],
roles[], rolesTitle?, numbers[{value,label}], gallery?[{src,cap}], galleryWide?, supports?, audience, tech[],
scene?{src,cap,card?}, video?(.mp4면 세로 영상 플레이어), videoPoster?, videoLabel?,
videos?[{src,poster?,label,wide?}](영상이 여럿일 때 video 대신, 적은 순서대로 나온다. wide: 가로 mp4)`
(사이트에 올리는 mp4는 ffmpeg로 1280px·CRF 26 정도로 줄여 public/에 영문 파일명으로 둔다)
(scene: 실제 사용 장면 사진. 카드 배경(card가 있으면 그 이미지)과 상세 화면 영상 바로 아래에 나온다.
상세 화면은 영상 → 사용 장면 → 숫자 → 대표 기능 → 미리보기 순서. 영상을 보면 앱이 다 이해되므로 맨 위에 둔다)

순서: 캠프마스터, STARFARER, 다락방 기도앱, 교구 레크리에이션, 다정 리딩북, 케미몰(독립몰), 보캐브스캔, 워드드롭,
노후자금 시뮬레이터, 중심잡기, 큐티레이스, 열왕기 — 두 왕국의 연대기, 그 길 — 예수의 발자취, 비전 퀘스트.
(그 길 = the-way-jesus.web.app 저장소, 비전 퀘스트 = team-esc 저장소. 화면은 실제 사이트를 Playwright로 캡처한다.
비전 퀘스트는 https://team-esc.web.app/?demo 로 로그인 없이 가짜 참가자 화면을 볼 수 있다.
비전 퀘스트 '실전 기록'은 2026-10-31 전주 한옥마을 게임 Q9A54의 실제 자료(`firebase database:get /games/Q9A54 --project team-esc`)에서 센 숫자다.
참가자 사진은 쓰지 않고 그림으로 다시 그렸다: shots/visionquest-scene.jpg, gallery/visionquest-jeonju.jpg)

## 글쓰기 원칙 (사용자 피드백)

- 소개 문구는 **실제 앱 코드·문서에서 확인한 사실만** 쓴다. 숫자(도구 앱 13개, 틈새게임 7종,
  지원 언어 17개 등)는 반드시 코드에서 세어 확인한다.
- 자기 서비스 소개에 **"추정", "근사", "~것으로 보입니다" 같은 자신 없는 표현을 쓰지 않는다.**
- 케미몰은 "특정 제품군 쇼핑몰"이 아니라 **업종에 상관없는 나만의 독립몰 구축** 사례로 소개한다 (SEO·AEO 포함).
- 캠프마스터는 교회·학교·회사 캠프 모두 지원. 대표 기능: 타이핑 없는 등록, 요청사항 반영 자동 조편성·방 배정,
  명찰 QR 현장 관리(입실·퇴실·버스 탑승·상벌점·방키), 자동 카풀 매칭, 접는 양면 명찰 자동 출력, 운영 도구 앱 13개.
- STARFARER의 첫 번째 강점은 **안정적인 실시간 멀티플레이**.
- 다정 리딩북은 앱의 저작권 안내에 맞춰 공유를 "기기 간 백업"으로만 소개한다 (가족 공유 표현 금지).
- 다정 리딩북 대표 기능 2·3번은 **오디오북 · 웹북 두 가지 모드**와 **본문 속 장면 삽화**. 사용자 삽화 스타일은 5가지
  (실사 사진은 관리자 전용이라 소개하지 않는다). 인물 일관성(앞 그림 최대 8장 참고)은 고전 기준으로 쓴다.
- 다정 리딩북의 첫 번째 강점은 **고전 문학 36,884권** (카드에 "고전 문학 36,884권"으로 굵고 밝게 표시, flagship의 hot) (readingBook 저장소 classics/index.json의 언어별 권수 합계, 2026-10-22 기준: 영 22,653·일 10,319·불 1,891·독 1,336·한 527·중 158). **원어 판본 기준**임을 함께 밝히고, 6개 언어(한·영·일·중 번체·독·불)로 들을 수 있는 판본 수(권수×6 = 221,304가지)를 같이 쓴다. 권수는 자동으로 따라간다: `.github/workflows/readingbook-count.yml`이 매일 03:17(KST)
  앱의 https://dajeong-audiobook-2026.web.app/classics/index.json 을 읽어 `public/live/readingbook-classics.json`을
  갱신·배포하고, `index.html`의 applyBookCounts가 data.js에 적힌 기준 숫자(BOOK_BASE)를 화면에서 새 숫자로 바꾼다.
  data.js 문구를 직접 고칠 때는 BOOK_BASE도 같은 숫자로 맞춘다.
- 다정 리딩북 주소는 https://dajeongbook.com (소개 링크). 권수 워크플로는 Firebase 기본 주소(web.app)를 그대로 읽는다.
- 프랑스어는 2026-10-22 앱에 반영되었다 (프랑스어 고전은 Project Gutenberg). 언어가 또 늘면 data.js 문구, BOOK_BASE·BOOK_LABELS,
  워크플로의 언어 목록을 함께 고친다 (판본 수는 BOOK_BASE의 언어 수를 곱한다).
- 다정 리딩북의 **학습 기능**(원서로 듣고 읽으며 문단마다 우리말 번역을 함께 보기, 앱 client/study.js)을 강조한다.
  대표 기능 4번. 뮤직비디오(메인테마, Vimeo 1238636676)는 상세 화면 영상 중 맨 앞에 둔다.
- 실명·개인 QR 등 개인정보가 담긴 이미지는 이름을 바꾸고 QR을 흐리게 처리한다.
- **이모티콘(이모지) 금지.** 버튼·제목·문구 모두 글자로만 쓴다 (✓ ★ 같은 기호는 괜찮다).
- 사이트 하단 사업자 정보: 상호 에스에스소프트(SSSOFT), 대표 김성수, 사업자등록번호 772-01-03846,
  전화 042-670-7577, 이메일 sssoft1004@gmail.com. **사업장 주소는 공개하지 않는다.**

## 디자인

- 제목: G마켓 산스, 본문: Pretendard, 영문 보조: Space Grotesk. 릴스 큰 문구: 잘난체.
- 카드·상세 제목은 한 줄에 들어가게 글자 크기를 자동으로 줄인다 (index.html fitText). 본문은 word-break:keep-all.
- 브랜드 그라데이션: #3d5afe → #a855f7 → #ff7a59.
- 계약서는 흰 바탕·검은 글씨의 인쇄용 문서로 유지한다.

## 계약 정책

- 클라우드 계정(Firebase 등)은 반드시 고객 명의로 만들고, SSSOFT는 권한만 받아 관리한다. **운영 대행은 하지 않는다.**
  대신 납품 시 운영 교육을 제공한다.
- 유지보수는 별도 계약서(연간/건당 선택). 개발 계약에는 3개월 무상 하자보수.

## 릴스 다시 만들기

```
npm install
npm run reel:render          # reel/sssoft-reel-nomusic.mp4
# space-racing 저장소의 public/starRacer/music/Terminal Velocity.mp3 를 reel/tv.mp3 로 복사
npm run reel:mux             # 음악 입히기 + public/ 사이트용 영상 갱신
```
