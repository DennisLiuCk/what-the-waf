# What The WAF 🛡️

一個互動式的 WAF (Web Application Firewall) 學習平台。

## 線上預覽

部署到 GitHub Pages 後即可使用。

## 功能特色

### 📚 學習內容
- **WAF 基礎介紹** - 了解什麼是 WAF 以及它的運作原理
- **常見攻擊類型** - SQL Injection、XSS、Command Injection、Path Traversal、SSRF
- **WAF 規則設計** - 學習正則表達式、ModSecurity 語法、OWASP CRS
- **繞過技術** - 了解攻擊者如何嘗試繞過 WAF

### 🔧 互動功能
- **WAF 即時偵測模擬器** - 輸入 payload 測試 WAF 偵測效果
- **測驗系統** - 5 道題目驗證學習成果
- **快速測試按鈕** - 一鍵測試各種攻擊類型

## 部署到 GitHub Pages

1. Fork 或 clone 這個專案
2. 到 GitHub 專案設定 → Pages
3. Source 選擇 `main` branch 和 `/ (root)`
4. 等待部署完成即可訪問

## 本地預覽

直接用瀏覽器打開 `index.html` 即可。

或使用簡易 HTTP 服務器：

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

## 技術棧

- 純 HTML/CSS/JavaScript
- 無外部依賴
- 響應式設計
- 深色主題

## 免責聲明

此專案僅供教育學習用途。請勿將學到的技術用於非法活動。

## License

MIT
