# THE AMBASSADOR — 개인화 랜딩 페이지

앰배서더 호텔(서한사) 로그인 회원을 위한 **초개인화 메인 페이지** 프로토타입입니다.
로그인한 회원의 이름·등급·포인트로 맞이하고, 최근 본 객실·관심사에 맞춘 제안을 보여줍니다.

🔗 **라이브 사이트:** https://leehyeon0812-dot.github.io/ambassador/

---

## 주요 섹션
- **Hero** — 마케팅 배경 영상 + 오퍼 슬라이드(커튼 와이프 전환)
- **멤버 바** — 회원 인사 · Gold 멤버십 게이지 · 포인트/쿠폰/무료숙박권
- **퀵메뉴** — 최근 본 객실, 보유 쿠폰, 빠른 예약
- **Where to Go Next** - 고객의 맥락에 맞춘 초개인화 큐레이션
- **Special Offers** - 패키지, 프로모션, 이벤트
- **Summer Chill** - 얼리버드 상품
- **Great Deals Await** — 인기 키워드 큐레이션
- **Ambassador's Family** — 호텔 갤러리(연속 흐름)
- **Signature Experiences** — 시설 소개(호버 크로스페이드)

## 기술 스택
- 순수 **HTML / CSS / JavaScript** (정적 사이트)
- **GSAP + ScrollTrigger** (인터랙션), **Lenis** (부드러운 스크롤)
- 폰트: PP Museum / PP Neue Montreal (로컬), Pretendard (한글 fallback)
- 호스팅: **GitHub Pages**

## 폴더 구조
```
index.html          메인 마크업
css/style.css       스타일
js/main.js          인터랙션
assets/img          이미지
assets/video        히어로 영상
assets/font         폰트
```

---

## 로컬에서 보기
```bash
python3 -m http.server 8123
# 브라우저에서 http://127.0.0.1:8123 열기
```
> 정적 서버가 필요합니다 (파일을 직접 열면 폰트·CDN이 일부 동작하지 않을 수 있음).

## 협업 방법
`main` 브랜치가 작업/배포 대상이며, push하면 라이브 사이트에 자동 반영됩니다(1~2분).

```bash
git clone https://github.com/leehyeon0812-dot/ambassador.git
cd ambassador

git pull            # 작업 전 항상 최신본 받기 (충돌 방지)
# ...수정...
git add -A && git commit -m "변경 내용"
git push
```

## 브랜치 / 버전
- **`main`** — 현재 작업 버전(v2), 라이브에 반영
- **`v1`** 브랜치 / **`v1.0`** 태그 — 버전 1 동결 스냅샷 (복원용)
  ```bash
  git checkout v1     # v1 상태로 되돌려 확인
  ```

---

_Prototype — THE AMBASSADOR Hotels & Suites._
