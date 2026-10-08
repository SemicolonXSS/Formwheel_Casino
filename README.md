# Formwheel_Casino

가상 코인 미니게임과 UID 지갑·거래 내역·배경/이름 장식 상점을 제공하는 프로젝트.

- 실행: https://semicolonxss.github.io/Formwheel_Casino/
- 프로젝트 목록: https://semicolonxss.github.io/Formwheel/
- 진행 상태: https://semicolonxss.github.io/Formwheel_Check/

## 사용

브라우저에서 실행 링크를 여세요. 화면에 표시된 설명과 버튼으로 진행합니다. 온라인 기능은 Firebase 연결이 필요하며, 방 게임은 같은 코드로 참가합니다. 로컬 저장은 현재 브라우저에만 남습니다.

## 2026-10-08 개선

Firebase Email/Password와 Google 로그인, UID별 새 casinoV2 지갑, 최근 코인 내역, 배경·이름 장식 구매 및 인벤토리 장착. 기존 users 계정의 비밀번호를 읽거나 새 평문 비밀번호를 저장하지 않습니다. 기존 계정·코인은 자동 이전 또는 삭제하지 않습니다. 인증 제공자/허용 도메인 설정과 모든 게임 지급의 서버 검증은 아직 운영 확인이 필요합니다. 클라이언트 지급 방식은 경쟁 보안용이 아닙니다.

## 개발 및 검증

정적 HTML/JavaScript 프로젝트입니다. HTTP 서버로 제공하세요. Firebase 운영 설정·Rules는 이 저장소의 화면 파일만 배포해서 바뀌지 않습니다.

```sh
node scripts/check-syntax.cjs
node tests/regression.test.cjs
```

첫 검사는 JavaScript 구문과 상대경로 파일 존재를 확인합니다. 모든 앱의 실제 멀티플레이와 운영 권한을 보증하는 검사는 아닙니다.

## 데이터 및 운영 보안

공통 안내: https://semicolonxss.github.io/Formwheel/privacy.html

닉네임·답안·점수·채팅 등이 서버에 저장될 수 있습니다. 새 보안 스키마와 서버 코드는 [Formwheel/firebase-security](https://github.com/SemicolonXSS/Formwheel/tree/main/firebase-security)에 준비했습니다. 현재 운영 적용 및 기존 경로 전환이 완료되었다고 가정하지 마세요. 계정/제공자 설정, 서버 보안 검증이 필요한 항목은 Check에서 별도로 남겨둡니다.

화면 마크업은 `index.html`, 앱별 스타일과 실행 코드는 `assets/`에 분리했습니다. 공통 UI는 Formwheel 저장소의 `shared/`를 사용합니다.
