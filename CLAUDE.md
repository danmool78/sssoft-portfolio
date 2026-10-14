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
reel/              홍보 릴스(26초, 1080×1920) 원본
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

두 사이트에 함께 배포된다. html/js/png 등은 `no-cache` 헤더라 새로고침하면 바로 반영된다.
클라우드(GitHub)에서는 `main`에 push하면 `.github/workflows/deploy.yml`이 배포한다
(저장소 Secret `FIREBASE_SERVICE_ACCOUNT_SSSOFT_PORTFOLIO` 필요).

## 앱 데이터(data.js) 규칙

각 프로젝트 필드: `id, title, en, cat(church|ai|game|biz|life), tag, color, url, play?, demo?,
shot, frame(phone|browser|svg), tagline, overview, flagship[], stages[{stage,summary,items[]}],
roles[], rolesTitle?, numbers[{value,label}], gallery?[{src,cap}], galleryWide?, supports?, audience, tech[],
scene?{src,cap,card?}, video?(.mp4면 세로 영상 플레이어), videoPoster?, videoLabel?`
(scene: 실제 사용 장면 사진. 카드 배경(card가 있으면 그 이미지)과 상세 화면 맨 위에 나온다)

순서: 캠프마스터, STARFARER, 다락방 기도앱, 다정 리딩북, 케미몰(독립몰), 보캐브스캔, 워드드롭,
노후자금 시뮬레이터, 중심잡기, 큐티레이스.

## 글쓰기 원칙 (사용자 피드백)

- 소개 문구는 **실제 앱 코드·문서에서 확인한 사실만** 쓴다. 숫자(도구 앱 13개, 틈새게임 7종,
  지원 언어 17개 등)는 반드시 코드에서 세어 확인한다.
- 자기 서비스 소개에 **"추정", "근사", "~것으로 보입니다" 같은 자신 없는 표현을 쓰지 않는다.**
- 케미몰은 "특정 제품군 쇼핑몰"이 아니라 **업종에 상관없는 나만의 독립몰 구축** 사례로 소개한다 (SEO·AEO 포함).
- 캠프마스터는 교회·학교·회사 캠프 모두 지원. 대표 기능: 타이핑 없는 등록, 요청사항 반영 자동 조편성·방 배정,
  명찰 QR 현장 관리(입실·퇴실·버스 탑승·상벌점·방키), 자동 카풀 매칭, 접는 양면 명찰 자동 출력, 운영 도구 앱 13개.
- STARFARER의 첫 번째 강점은 **안정적인 실시간 멀티플레이**.
- 다정 리딩북은 앱의 저작권 안내에 맞춰 공유를 "기기 간 백업"으로만 소개한다 (가족 공유 표현 금지).
- 실명·개인 QR 등 개인정보가 담긴 이미지는 이름을 바꾸고 QR을 흐리게 처리한다.

## 디자인

- 제목: G마켓 산스, 본문: Pretendard, 영문 보조: Space Grotesk. 릴스 큰 문구: 잘난체.
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
