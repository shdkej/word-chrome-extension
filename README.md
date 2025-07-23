# Word Translator Extension

Chrome 확장 프로그램으로, 웹 페이지에서 단어를 마우스 오버하면 번역 툴팁을 보여주고, AI를 활용한 **문장 번역** 기능을 제공합니다.

## 주요 기능

### 1. 단어 번역 툴팁

- 웹 페이지의 단어에 마우스를 올리면 실시간 번역 툴팁 표시
- article 태그 내의 텍스트를 자동으로 단어 단위로 분할하여 번역 기능 활성화
- 번역 결과 캐싱으로 성능 최적화

### 2. AI 문장 번역

- 사용자가 입력한 문장을 OpenAI API를 통해 자연스러운 한국어로 번역
- 원문의 의미와 뉘앙스를 최대한 보존하는 번역 결과 제공
- 전문 용어나 고유명사는 적절히 번역하거나 원문을 병기

## 설치 방법

1. 이 저장소를 클론하거나 다운로드합니다.
2. Chrome 브라우저에서 `chrome://extensions/` 페이지로 이동합니다.
3. 우측 상단의 "개발자 모드"를 활성화합니다.
4. "압축해제된 확장 프로그램을 로드합니다" 버튼을 클릭합니다.
5. 프로젝트 폴더를 선택합니다.

## 사용 방법

### 단어 번역

1. 확장 프로그램을 설치하면 자동으로 모든 웹 페이지에서 활성화됩니다.
2. 기사나 문서 페이지에서 단어에 마우스를 올리면 번역 툴팁이 나타납니다.

### AI 문장 번역

1. 확장 프로그램 아이콘을 클릭하여 팝업을 엽니다.
2. 번역할 문장을 입력한 후 "AI 번역 요청" 버튼을 클릭합니다.
3. 번역 결과가 하단에 표시됩니다.

## 설정

### API 키 설정

1. 확장 프로그램 아이콘을 우클릭하고 "옵션"을 선택합니다.
2. OpenAI API 키를 입력하고 저장합니다.

## 파일 구조

```
word-translator-extension/
├── manifest.json          # 확장 프로그램 매니페스트
├── popup.html             # 팝업 UI
├── popup.js               # 팝업 로직 (AI 문장 번역 기능)
├── content-script.js      # 콘텐츠 스크립트 (단어 번역 기능)
├── background.js          # 백그라운드 스크립트
├── options.html           # 설정 페이지
├── options.js             # 설정 페이지 로직
└── purple_favicon-*.png   # 확장 프로그램 아이콘
```

## 기술 스택

- **Frontend**: HTML, CSS, JavaScript (ES6+)
- **Chrome Extension API**: Manifest V3
- **AI Integration**: OpenAI API
- **Markdown Parsing**: marked.js

## 개발

### 테스트 파일

- `*.test.js`: 각 기능별 테스트 파일
- `*.spec.js`: 스펙 기반 테스트 파일

### 빌드 및 배포

현재 개발 버전으로, Chrome Web Store 배포를 위해서는 추가적인 빌드 과정이 필요할 수 있습니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여하기

1. 이 저장소를 포크합니다.
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다.

## 문제 해결

### 일반적인 문제

- **번역이 작동하지 않는 경우**: 페이지를 새로고침하거나 확장 프로그램을 재시작해보세요.
- **AI 번역이 작동하지 않는 경우**: API 키가 올바르게 설정되었는지 확인하세요.

### 지원

문제가 발생하면 이슈를 생성해주세요.
