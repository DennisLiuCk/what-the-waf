# What The WAF

一個互動式的 WAF (Web Application Firewall) 學習平台。

[![CI](https://github.com/DennisLiuCk/what-the-waf/actions/workflows/ci.yml/badge.svg)](https://github.com/DennisLiuCk/what-the-waf/actions/workflows/ci.yml)

---

## 線上預覽

部署到 GitHub Pages 後即可使用。

---

## 功能特色

### 學習內容
- **WAF 基礎介紹** - 了解什麼是 WAF 以及它的運作原理
- **常見攻擊類型** - SQL Injection、XSS、Command Injection、Path Traversal、SSRF
- **WAF 規則設計** - 學習正則表達式、ModSecurity 語法、OWASP CRS
- **繞過技術** - 了解攻擊者如何嘗試繞過 WAF

### 互動功能
- **WAF 即時偵測模擬器** - 輸入 payload 測試 WAF 偵測效果
- **測驗系統** - 5 道題目驗證學習成果
- **繞過挑戰關卡** - 5 個漸進式難度的挑戰
- **Payload 編碼/解碼器** - URL、Base64、HTML、Unicode、雙重編碼
- **分數計算器** - VIOL_RATING_THREAT 計分系統

---

## 自動化測試與 CI/CD

本專案使用 **GitHub Actions** 搭配 **Playwright** 實現完整的自動化前端測試。

### 測試架構概覽

```
GitHub Actions CI/CD Pipeline
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────┐                                          │
│  │ Validate │ ─── 快速驗證 HTML 結構                    │
│  └────┬─────┘                                          │
│       │                                                 │
│       ├──────────────────┬──────────────────┐          │
│       ▼                  ▼                  ▼          │
│  ┌─────────┐       ┌─────────┐       ┌───────────┐     │
│  │Chromium │       │ Firefox │       │  WebKit   │     │
│  └─────────┘       └─────────┘       └───────────┘     │
│       │                  │                  │          │
│       └──────────────────┼──────────────────┘          │
│                          ▼                             │
│               ┌──────────────────┐                     │
│               │   Mobile Tests   │                     │
│               │ (Chrome + Safari)│                     │
│               └────────┬─────────┘                     │
│                        ▼                               │
│               ┌──────────────────┐                     │
│               │  Status Check    │ ─── PR 自動評論     │
│               └──────────────────┘                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CI/CD 功能

| 功能 | 說明 |
|------|------|
| **HTML 驗證** | 自動檢查 DOCTYPE、標籤結構、必要區塊 |
| **跨瀏覽器測試** | Chromium、Firefox、WebKit 並行測試 |
| **響應式測試** | Pixel 5、iPhone 12 手機視口測試 |
| **測試報告** | 自動產生 HTML 報告並上傳為 Artifact |
| **PR 評論** | 測試結果自動評論在 Pull Request |
| **失敗追蹤** | 截圖、影片、Trace 完整錯誤證據 |

### 測試覆蓋範圍

| 測試套件 | 測試內容 | 測試數量 |
|----------|----------|----------|
| `navigation.spec.ts` | 頁面載入、導航、響應式設計 | 19+ |
| `waf-simulator.spec.ts` | WAF 偵測各種攻擊類型 | 12+ |
| `quiz.spec.ts` | 測驗功能、計分、進度追蹤 | 18+ |
| `challenge.spec.ts` | 5 關挑戰、繞過技術驗證 | 18+ |
| `encoder.spec.ts` | 5 種編碼/解碼功能 | 23+ |
| `score-calculator.spec.ts` | 分數計算、狀態判定 | 21+ |

**詳細測試文檔請參閱：[docs/testing-guide.md](docs/testing-guide.md)**

---

## 本地開發

### 安裝

```bash
# 安裝依賴
npm install

# 安裝 Playwright 瀏覽器
npx playwright install
```

### 啟動開發伺服器

```bash
npm run serve
# 或
python -m http.server 8000
```

### 執行測試

```bash
# 執行所有測試
npm test

# 互動式 UI 模式（推薦用於除錯）
npm run test:ui

# 有頭模式（顯示瀏覽器）
npm run test:headed

# 特定瀏覽器測試
npm run test:chromium
npm run test:firefox
npm run test:webkit

# 手機視口測試
npm run test:mobile

# 查看測試報告
npm run test:report
```

---

## 專案結構

```
what-the-waf/
├── index.html               # 主應用程式（單頁式）
├── package.json            # NPM 配置與測試腳本
├── playwright.config.ts    # Playwright 測試配置
├── tsconfig.json          # TypeScript 配置
│
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions CI/CD 工作流程
│
├── tests/
│   └── e2e/               # E2E 測試套件
│       ├── navigation.spec.ts
│       ├── waf-simulator.spec.ts
│       ├── quiz.spec.ts
│       ├── challenge.spec.ts
│       ├── encoder.spec.ts
│       └── score-calculator.spec.ts
│
└── docs/
    └── testing-guide.md   # 詳細測試指南
```

---

## 核心檔案說明

### `.github/workflows/ci.yml`

GitHub Actions 工作流程配置，定義了完整的 CI/CD pipeline：

- **觸發條件**：push 到 main/master 或建立 PR 時執行
- **並行控制**：自動取消同分支的舊任務
- **矩陣策略**：三個瀏覽器並行測試
- **錯誤報告**：失敗時上傳截圖、影片、trace

### `playwright.config.ts`

Playwright 測試框架配置：

- **自動啟動伺服器**：測試前自動啟動 `serve`
- **5 個測試專案**：3 桌面 + 2 手機瀏覽器
- **智慧重試**：CI 環境失敗自動重試 2 次
- **除錯工具**：trace、screenshot、video

### `package.json` 測試腳本

| 腳本 | 指令 | 用途 |
|------|------|------|
| `test` | `playwright test` | 執行所有測試 |
| `test:ui` | `playwright test --ui` | 互動式 UI 模式 |
| `test:headed` | `playwright test --headed` | 顯示瀏覽器 |
| `test:chromium` | `playwright test --project=chromium` | Chrome 測試 |
| `test:firefox` | `playwright test --project=firefox` | Firefox 測試 |
| `test:webkit` | `playwright test --project=webkit` | Safari 測試 |
| `test:mobile` | `playwright test --project='Mobile Chrome' --project='Mobile Safari'` | 手機測試 |
| `test:report` | `playwright show-report` | 查看報告 |

---

## 給開發者的學習資源

這個專案展示了現代前端測試的最佳實踐：

1. **E2E 測試**：使用 Playwright 進行真實瀏覽器測試
2. **跨瀏覽器相容性**：確保在所有主流瀏覽器上正常運作
3. **響應式測試**：驗證手機和平板的使用體驗
4. **CI/CD 自動化**：每次提交自動執行完整測試
5. **測試報告**：詳細的錯誤追蹤和除錯資訊

**詳細教學請參閱：[docs/testing-guide.md](docs/testing-guide.md)**

---

## 技術棧

- **前端**：純 HTML/CSS/JavaScript（無外部依賴）
- **測試**：Playwright E2E 測試框架
- **CI/CD**：GitHub Actions
- **部署**：GitHub Pages

---

## 免責聲明

此專案僅供教育學習用途。請勿將學到的技術用於非法活動。

---

## License

MIT
