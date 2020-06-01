# bank-internal-fund-transfer-tool

## Project setup

```bash
npm install
```

### Compiles and hot-reloads for development

```bash
npm run serve
```

### Compiles and minifies for production

```bash
npm run build
```

### Lints and fixes files

```bash
npm run lint
```

### Run your unit tests

```bash
npm run test:unit -- '--runInBand' 'ABCWorker.spec.ts' #Powershell
npm run test:unit -- --runInBand ABCWorker.spec.ts #Cmd
```

### Run your end-to-end tests

```bash
npm run test:e2e
```

### Generate all svg components

```bash
npm run svg
```

### Customize Vue configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### 測試完成標準

1. interface 定義的東西都有做了嗎？
2. 目標是可以完成整個轉帳任務
3. 出款與內轉各測試三筆，連續六筆不能出錯
