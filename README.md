# 나폴미 (napolme) - 아이온2 캐릭터 정보 조회 플랫폼

> 아이온2 캐릭터 검색, 랭킹, 닉네임 생성 서비스

**Production:** [napolme.com](https://napolme.com)

---

## 목차

- [개요](#개요)
- [주요 기능 (MVP)](#주요-기능-mvp)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [배포](#배포)
- [API 연동](#api-연동)

---

## 개요

나폴미는 아이온2(Aion 2) 플레이어를 위한 캐릭터 정보 조회 플랫폼입니다.
캐릭터 검색, 장비/스킬 조회, 전투력 랭킹, 닉네임 생성 기능을 제공합니다.

---

## 주요 기능 (MVP)

### 1. 캐릭터 검색

- 서버별 캐릭터 이름 검색 (에레슈 / 아스모 41개 서버)
- 닉네임 기반 검색 지원
- 검색 결과 캐싱 및 쿨다운 표시

### 2. 캐릭터 상세 정보

- 레벨, 직업, 전투력 조회
- 장비 목록 및 강화 수치 표시
- 스킬 및 패시브 능력 조회
- 다에바니온 보드 진행도
- 길드 정보 표시
- 캐릭터 프로필 이미지

### 3. 랭킹 시스템

- 일일 검색 랭킹
- 나폴미 포인트 랭킹
- PvP / PvE 콘텐츠별 랭킹
- 인기 스탯 트래킹

### 4. 닉네임 생성기

- **일반 모드**: 랜덤 한글 닉네임 자동 생성
- **조합 모드**: 음절 선택 후 조합
- **직접 모드**: 특정 닉네임 사용 가능 여부 확인
- 받침, 쌍자음, 모음 타입 필터
- 서버별 사용 가능 여부 실시간 체크

### 5. 부가 기능

- 즐겨찾기 캐릭터 저장 (로컬스토리지)
- 나폴미 전투력 점수 계산 (커스텀 알고리즘)
- 공식 홈페이지 게시판 업데이트 연동
- 치지직(Chzzk) 라이브 스트림 연동

---

## 기술 스택

| 분류             | 기술                           |
| ---------------- | ------------------------------ |
| Framework        | React 19 + TypeScript          |
| Build Tool       | Vite 7                         |
| Routing          | React Router DOM 7             |
| HTTP Client      | Axios                          |
| Styling          | CSS (Global + Component)       |
| Containerization | Docker + Nginx                 |
| CI/CD            | GitHub Actions                 |
| Cloud            | AWS ECR + EC2 (ap-northeast-2) |

---

## 프로젝트 구조

```
src/
├── api/                  # API 클라이언트 레이어
│   ├── characterApi.ts   # 캐릭터 검색, 상세, 장비, 스킬
│   ├── combatScoreApi.ts # 전투력 점수 계산
│   ├── nicknameApi.ts    # 닉네임 생성
│   ├── statApi.ts        # 랭킹, 통계, 라이브스트림
│   └── index.ts
├── lib/                  # 유틸리티
│   ├── http.ts           # Axios 인스턴스 (환경별 baseURL)
│   ├── date.ts           # KST 날짜 포맷팅
│   └── favorites.ts      # 즐겨찾기 (localStorage)
├── pages/                # 페이지 컴포넌트
│   ├── SearchPage.tsx           # 메인 검색 페이지
│   ├── SearchResultsPage.tsx    # 검색 결과
│   ├── CharacterDetailPage.tsx  # 캐릭터 상세
│   ├── NicknameGeneratorPage.tsx # 닉네임 생성기
│   ├── TermsPage.tsx            # 이용약관
│   └── PrivacyPage.tsx          # 개인정보처리방침
├── App.tsx               # 라우팅 설정
├── main.tsx              # 앱 진입점
└── style.css             # 글로벌 스타일
```

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 배포

### Docker

```bash
# 이미지 빌드
docker build -t napolme-frontend .

# 컨테이너 실행
docker run -p 80:80 napolme-frontend
```

### CI/CD (GitHub Actions)

`main` 브랜치에 push하면 자동 배포됩니다.

**파이프라인 순서:**

1. Docker 이미지 빌드
2. AWS ECR에 이미지 푸시
3. EC2에 SSH 접속
4. 기존 컨테이너 교체 및 새 컨테이너 실행

---

## API 연동

백엔드 API는 `VITE_API_BASE_URL`을 기준으로 호출됩니다.

### 주요 엔드포인트

| 메서드 | 경로                              | 설명                  |
| ------ | --------------------------------- | --------------------- |
| GET    | `/api/characters/search`          | 캐릭터 검색           |
| GET    | `/api/character/info`             | 캐릭터 전체 정보 조회 |
| GET    | `/api/character/equipment/bundle` | 장비 및 아이템 상세   |
| GET    | `/api/character/daevanion/bundle` | 다에바니온 보드       |
| GET    | `/api/combat-score`               | 나폴미 전투력 점수    |
| POST   | `/api/nickname/generate`          | 닉네임 생성           |
| GET    | `/api/stat/daily-search-ranking`  | 일일 검색 랭킹        |
| GET    | `/api/stat/napolme-ranking`       | 나폴미 포인트 랭킹    |
| GET    | `/api/stat/chzzk-lives`           | 라이브 스트림 정보    |

### 응답 형식

```typescript
{
  success: boolean;
  code: string;
  message: string;
  data: T;
  cacheHit: boolean;
  cooldown: number;
  timestamp: string;
}
```

## 라이선스

This project is private and proprietary. All rights reserved.

Copyright © 2026 Napolme. Unauthorized copying, distribution, or modification is strictly prohibited.
