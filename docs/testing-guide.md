# What The WAF - 前端測試完整指南

這份文檔詳細說明如何使用 **GitHub Actions** 和 **Playwright** 進行自動化前端測試。適合想要學習現代前端測試實踐的開發者參考。

---

## 目錄

1. [測試架構總覽](#測試架構總覽)
2. [核心檔案說明](#核心檔案說明)
3. [GitHub Actions CI/CD 詳解](#github-actions-cicd-詳解)
4. [Playwright 配置詳解](#playwright-配置詳解)
5. [測試套件說明](#測試套件說明)
6. [本地開發測試指南](#本地開發測試指南)
7. [最佳實踐與學習重點](#最佳實踐與學習重點)

---

## 測試架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                                   │
│  │ Validate │ ──────────────────────────────────────────────┐   │
│  └──────────┘                                               │   │
│       │                                                      │   │
│       ▼                                                      ▼   │
│  ┌─────────────────────────────┐    ┌──────────────────────┐    │
│  │     E2E Tests (並行)         │    │    Mobile Tests      │    │
│  │  ┌─────────┐ ┌─────────┐    │    │  ┌────────────────┐  │    │
│  │  │Chromium │ │ Firefox │    │    │  │ Mobile Chrome  │  │    │
│  │  └─────────┘ └─────────┘    │    │  └────────────────┘  │    │
│  │  ┌─────────┐                │    │  ┌────────────────┐  │    │
│  │  │ WebKit  │                │    │  │ Mobile Safari  │  │    │
│  │  └─────────┘                │    │  └────────────────┘  │    │
│  └─────────────────────────────┘    └──────────────────────┘    │
│                │                              │                  │
│                └──────────────┬───────────────┘                  │
│                               ▼                                  │
│                    ┌──────────────────┐                          │
│                    │   Status Check   │                          │
│                    │  (PR Comment)    │                          │
│                    └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### 工作流程說明

1. **Validate** - 快速驗證 HTML 結構
2. **E2E Tests** - 三個瀏覽器並行測試 (Chromium, Firefox, WebKit)
3. **Mobile Tests** - 手機視口響應式測試
4. **Status Check** - 匯總結果並在 PR 留下評論

---

## 核心檔案說明

### 專案結構

```
what-the-waf/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions 工作流程配置
├── tests/
│   └── e2e/
│       ├── navigation.spec.ts      # 導航測試
│       ├── waf-simulator.spec.ts   # WAF 模擬器測試
│       ├── quiz.spec.ts            # 測驗系統測試
│       ├── challenge.spec.ts       # 挑戰關卡測試
│       ├── encoder.spec.ts         # 編碼器測試
│       └── score-calculator.spec.ts # 分數計算器測試
├── playwright.config.ts        # Playwright 測試配置
├── package.json               # NPM 專案配置
└── tsconfig.json              # TypeScript 配置
```

### 各檔案用途

| 檔案 | 用途 | 重要性 |
|------|------|--------|
| `ci.yml` | 定義 CI/CD 工作流程，自動化測試流程 | 核心 |
| `playwright.config.ts` | Playwright 測試框架配置 | 核心 |
| `package.json` | 定義測試腳本和依賴套件 | 核心 |
| `tsconfig.json` | TypeScript 編譯設定 | 輔助 |
| `tests/e2e/*.spec.ts` | 實際的測試案例 | 核心 |

---

## GitHub Actions CI/CD 詳解

### 檔案位置：`.github/workflows/ci.yml`

### 1. 觸發條件 (Triggers)

```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
```

**學習重點：**
- `push` - 當程式碼推送到 main/master 分支時觸發
- `pull_request` - 當有 PR 針對 main/master 時觸發
- 這確保每次程式碼變更都會經過測試

### 2. 並行控制 (Concurrency)

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**學習重點：**
- 相同分支的新推送會自動取消正在進行的舊測試
- 節省 CI 資源，避免測試結果過時

### 3. 權限設定 (Permissions)

```yaml
permissions:
  contents: read
  pull-requests: write
```

**學習重點：**
- GitHub Actions 預設權限有限，需要明確聲明所需權限
- `contents: read` - 允許讀取倉庫內容
- `pull-requests: write` - 允許在 PR 上留言（用於自動測試報告）
- 這是最小權限原則的實踐，只授予必要的權限

### 4. 環境變數

```yaml
env:
  CI: true
```

**學習重點：**
- `CI: true` 告訴工具目前在 CI 環境中執行
- Playwright 會根據此變數調整行為（如重試次數）

---

### Job 1: Validate (驗證)

```yaml
validate:
  name: Validate
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Check HTML validity
      run: |
        if ! grep -q '<!DOCTYPE html>' index.html; then
          echo "::error::Missing DOCTYPE declaration"
          exit 1
        fi
        # ... 更多檢查
```

**功能說明：**
- 檢查 HTML 基本結構（DOCTYPE、html 標籤）
- 確認必要的頁面區塊存在
- 作為快速的「門檻檢查」，節省後續測試資源

**學習重點：**
- `::error::` 是 GitHub Actions 的特殊語法，會在 UI 顯示錯誤訊息
- 快速驗證可以及早發現問題，避免浪費時間在更長的測試上

---

### Job 2: E2E Tests (端對端測試)

```yaml
e2e-tests:
  name: E2E Tests (${{ matrix.browser }})
  needs: validate                    # 依賴 validate job
  runs-on: ubuntu-latest
  timeout-minutes: 30

  strategy:
    fail-fast: false                 # 一個失敗不會取消其他
    matrix:
      browser: [chromium, firefox, webkit]
```

**功能說明：**
- 使用矩陣策略同時在三個瀏覽器上執行測試
- 每個瀏覽器獨立執行，一個失敗不影響其他
- 設定 30 分鐘超時保護

**矩陣策略 (Matrix Strategy) 學習重點：**
```yaml
matrix:
  browser: [chromium, firefox, webkit]
```
這會自動創建 3 個並行的 job：
- E2E Tests (chromium)
- E2E Tests (firefox)
- E2E Tests (webkit)

**安裝步驟說明：**
```yaml
- name: Install dependencies
  run: npm ci                        # 比 npm install 更快更穩定

- name: Install Playwright Browser
  run: npx playwright install --with-deps ${{ matrix.browser }}
```

**學習重點：**
- `npm ci` vs `npm install`：ci 更快，且嚴格按照 lock 檔案安裝
- `--with-deps` 會同時安裝系統依賴（如字體、圖形庫）
- 只安裝需要的瀏覽器，節省時間和空間

**測試報告上傳：**
```yaml
- name: Upload HTML report
  uses: actions/upload-artifact@v4
  if: always()                       # 即使測試失敗也上傳
  with:
    name: playwright-report-${{ matrix.browser }}
    path: playwright-report/
    retention-days: 14               # 保留 14 天
```

**學習重點：**
- `if: always()` 確保即使測試失敗也能上傳報告
- Artifact 可在 GitHub Actions 頁面下載
- 報告包含失敗截圖、影片等除錯資訊

---

### Job 3: Mobile Tests (手機測試)

```yaml
mobile-tests:
  name: Mobile Tests
  needs: validate
  runs-on: ubuntu-latest
  timeout-minutes: 20

  steps:
    # ... 安裝步驟

    - name: Run mobile viewport tests
      run: npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

**功能說明：**
- 專門測試手機視口的響應式設計
- 使用 Pixel 5 (Android) 和 iPhone 12 (iOS) 模擬器
- 確保網站在手機上也能正常運作

**學習重點：**
- 響應式測試是現代前端開發的必備項目
- 分開桌面和手機測試可以更快定位問題

---

### Job 4: Status Check (狀態檢查)

```yaml
status-check:
  name: Status Check
  needs: [validate, e2e-tests, mobile-tests]
  runs-on: ubuntu-latest
  if: always()                       # 即使前面失敗也執行
```

**功能說明：**
- 等待所有測試完成
- 匯總測試結果
- 在 PR 上自動留下測試報告評論

**PR 評論功能：**
```yaml
- name: Create status comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const results = {
        validate: '${{ needs.validate.result }}',
        e2e: '${{ needs.e2e-tests.result }}',
        mobile: '${{ needs.mobile-tests.result }}'
      };
      // ... 產生評論
```

**學習重點：**
- `github-script` action 讓你可以用 JavaScript 操作 GitHub API
- 自動評論讓審查者一眼就能看到測試結果
- 評論中的表格格式清晰展示各項測試狀態

---

## Playwright 配置詳解

### 檔案位置：`playwright.config.ts`

### 基本設定

```typescript
export default defineConfig({
  testDir: './tests/e2e',           // 測試檔案位置
  fullyParallel: true,              // 完全並行執行
  forbidOnly: !!process.env.CI,     // CI 中禁止 test.only
  retries: process.env.CI ? 2 : 0,  // CI 中失敗重試 2 次
  workers: process.env.CI ? 1 : undefined, // CI 中單執行緒
```

**設定說明：**

| 設定 | 本地環境 | CI 環境 | 說明 |
|------|---------|---------|------|
| `forbidOnly` | false | true | 防止誤留 `.only` 到 CI |
| `retries` | 0 | 2 | CI 失敗會重試，減少假性失敗 |
| `workers` | auto | 1 | CI 限制資源，避免競爭 |

### 報告器設定

```typescript
reporter: [
  ['html', { open: 'never' }],      // HTML 報告（不自動開啟）
  ['list'],                          // 終端機列表輸出
  ...(process.env.CI ? [['github'] as const] : []), // CI 專用格式
],
```

**學習重點：**
- HTML 報告：詳細的測試結果，含截圖和追蹤
- List 報告：終端機友善的即時輸出
- GitHub 報告：在 Actions 介面顯示錯誤註解

### 共用測試設定

```typescript
use: {
  baseURL: 'http://localhost:3000', // 測試目標 URL
  trace: 'on-first-retry',          // 第一次重試時錄製追蹤
  screenshot: 'only-on-failure',    // 失敗時截圖
  video: 'on-first-retry',          // 第一次重試時錄影
},
```

**除錯工具說明：**
- **Trace**：完整的操作記錄，可逐步回放
- **Screenshot**：失敗時自動截取畫面
- **Video**：錄製測試過程影片

### 瀏覽器設定

```typescript
projects: [
  // 桌面瀏覽器
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },

  // 手機視口
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
],
```

**學習重點：**
- Playwright 內建了多種設備的預設配置
- `devices['Pixel 5']` 包含螢幕大小、User Agent 等設定
- 這讓跨瀏覽器測試變得非常簡單

### 自動啟動伺服器

```typescript
webServer: {
  command: 'npx serve -l 3000 .',   // 啟動指令
  url: 'http://localhost:3000',     // 等待此 URL 可用
  reuseExistingServer: !process.env.CI, // 本地可重用現有伺服器
  timeout: 120 * 1000,              // 等待 2 分鐘
},
```

**學習重點：**
- Playwright 會自動在測試前啟動伺服器
- 測試完成後自動關閉
- 本地開發時可重用已啟動的伺服器，加快測試速度

---

## 測試套件說明

### 1. navigation.spec.ts - 導航測試

**測試內容：**
- 頁面載入和基本結構
- 導航列功能
- 區塊存在性檢查
- 手風琴和標籤切換
- 響應式設計

**範例測試：**
```typescript
test('應該能成功載入頁面', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/WAF/);
});
```

---

### 2. waf-simulator.spec.ts - WAF 模擬器測試

**測試內容：**
- SQL Injection 偵測
- XSS 攻擊偵測
- Command Injection 偵測
- Path Traversal 偵測
- SSRF 偵測
- 正常輸入處理

**學習重點：**
這個測試檔案展示了如何測試安全相關的功能，確保 WAF 規則正確運作。

---

### 3. quiz.spec.ts - 測驗系統測試

**測試內容：**
- 題目載入和顯示
- 答案選擇和鎖定
- 分數計算
- 進度追蹤
- 重新測驗功能

---

### 4. challenge.spec.ts - 挑戰關卡測試

**測試內容：**
- 5 個關卡的切換
- 繞過技術驗證：
  - Level 1: 大小寫變換
  - Level 2: URL 編碼
  - Level 3: SQL 註解
  - Level 4: HTML 標籤變換
  - Level 5: 進階複合技術

---

### 5. encoder.spec.ts - 編碼器測試

**測試內容：**
- URL 編碼/解碼
- Base64 編碼/解碼
- HTML 實體編碼
- Unicode 轉換
- 雙重 URL 編碼

---

### 6. score-calculator.spec.ts - 分數計算器測試

**測試內容：**
- VIOL_RATING_THREAT 分數計算
- 狀態判定（ALLOWED/WARNING/BLOCKED）
- 違規項目累加
- 視覺狀態變化

---

## 本地開發測試指南

### 安裝

```bash
# 安裝依賴
npm install

# 安裝瀏覽器
npx playwright install
```

### 常用測試指令

```bash
# 執行所有測試（無頭模式）
npm test

# 開啟互動式 UI 模式
npm run test:ui

# 有頭模式（看到瀏覽器）
npm run test:headed

# 只測試特定瀏覽器
npm run test:chromium
npm run test:firefox
npm run test:webkit

# 只測試手機視口
npm run test:mobile

# 查看測試報告
npm run test:report
```

### 除錯技巧

**1. 使用 UI 模式**
```bash
npm run test:ui
```
這會開啟 Playwright 的互動式介面，可以：
- 逐步執行測試
- 查看每步的 DOM 快照
- 即時修改選擇器

**2. 查看追蹤檔案**
```bash
npx playwright show-trace test-results/*/trace.zip
```

**3. 只執行特定測試**
```bash
npx playwright test navigation.spec.ts
npx playwright test -g "應該能偵測 SQL Injection"
```

---

## 最佳實踐與學習重點

### 1. 測試金字塔

```
        /\
       /  \     E2E 測試 (本專案)
      /----\    - 較慢但最接近真實使用情境
     /      \
    /--------\  整合測試
   /          \ - 測試元件之間的互動
  /------------\
 /  單元測試    \ - 最快，測試個別函數
/________________\
```

本專案專注於 E2E 測試，因為這是一個純前端的靜態網站。

### 2. 好的測試特徵

- **獨立性**：每個測試不依賴其他測試的結果
- **可重複**：多次執行結果應該一致
- **快速**：使用並行執行加速
- **可讀性**：測試描述清楚說明測試目的

### 3. CI/CD 最佳實踐

- **快速回饋**：使用並行矩陣策略
- **失敗隔離**：`fail-fast: false` 讓所有測試都執行完
- **證據保存**：上傳報告和錯誤證據
- **資源管理**：使用 concurrency 避免重複執行

### 4. 跨瀏覽器測試的重要性

| 瀏覽器 | 引擎 | 市佔率 |
|--------|------|--------|
| Chrome | Chromium | ~65% |
| Safari | WebKit | ~18% |
| Firefox | Gecko | ~3% |

測試這三個引擎基本上覆蓋了所有主流瀏覽器。

---

## 延伸學習資源

- [Playwright 官方文檔](https://playwright.dev/)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [OWASP 測試指南](https://owasp.org/www-project-web-security-testing-guide/)

---

## 常見問題

### Q: 為什麼 CI 中只用 1 個 worker？

CI 環境的資源有限，多個 worker 可能導致資源競爭和不穩定的測試結果。

### Q: 為什麼要分開 E2E 和 Mobile 測試？

1. 更清晰的測試報告
2. 更容易定位問題（是桌面還是手機的問題）
3. 可以選擇性地只執行需要的測試

### Q: 測試失敗了怎麼辦？

1. 查看 GitHub Actions 的錯誤訊息
2. 下載測試報告 Artifact
3. 查看截圖和追蹤檔案
4. 在本地使用 `npm run test:ui` 重現問題

---

*這份文檔由 What The WAF 專案維護，歡迎提交 PR 改進！*
