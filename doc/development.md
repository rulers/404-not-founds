# 開発・検証・公開

## 開発環境

Node.js 24とnpmを使用する。

```sh
npm ci
npm run dev
```

http://localhost:3000 を開く。依存追加時はpackage.jsonとpackage-lock.jsonを一緒に更新する。秘密情報やローカル生成物はコミットしない。

## Linter

```sh
npm run lint       # ESLint: 警告0件を要求
npm run lint:fix   # 自動修正後、差分を確認する
```

`eslint.config.mjs` は `eslint-config-next/core-web-vitals` と `eslint-config-next/typescript` を使用する。React Hooks、Next.js、アクセシビリティ、TypeScriptの標準的な問題を検出する。`.next/`、`out/`、ブラウザテストの成果物、生成されたnext-env.d.tsは対象外。

lintはTypeScriptの型検査・ビルド・ブラウザテストを置き換えない。CSSの検査はこのESLint設定の対象外。ファイル全体やプロジェクト全体のルール無効化で警告を隠さず、必要な例外には理由を記録する。

## 検証コマンド

```sh
npm run lint
npm test
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run build
npx playwright install chromium
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run test:e2e
```

- 単体テスト: JST 0:00の境界、同一日の再現性、複数日の選択、単一作品、現在以外へのShuffle、空レジストリの拒否。
- ブラウザテスト: Home、Discover、個別作品、スラッシュ有無の直接URL、サムネイル、マウス・タッチ・キーボード、reduced-motion、Shuffle、404復帰、320px幅。
- `typecheck` は `next typegen` を先に実行し、クリーン環境でもNext.jsの生成型を用意する。
- ビルドとテストサーバーに同じbasePathを指定する。環境のChromiumを使うときだけ `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` 等を追加する。

見た目の変更時はスクリーンショットを確認し、作品の静止時と操作時、ナビゲーション、モバイルの横はみ出し、明暗テーマの可読性を見る。未実施の実機・性能計測を「確認済み」に含めない。

## GitHub Pages

公開URLは https://rulers.github.io/404-not-founds/ 。PagesのSourceは **GitHub Actions**。初回設定とデプロイは完了済み。

通常は作業後にmainへpushするというユーザー方針。push前に差分とremoteを確認し、今回の変更だけをコミットする。非fast-forward時はremoteの内容を取り込み、force pushしない。作業ブランチから公開する場合は `git push origin HEAD:main` が使える。

Workflowの処理順は以下。

1. checkout、Node.js 24、Pagesメタデータの確認。
2. npm ci、lint、単体テスト、型チェック。
3. GitHubリポジトリ名からbasePathを導出してStatic Export。
4. Chromiumを導入し、静的出力をPC・モバイル設定でテスト。
5. 必須HTMLを確認して `.nojekyll` を配置し、outをartifact化。
6. build成功後、Pagesへのデプロイ。

`main`へのpushとworkflow_dispatchで起動する。公開ジョブだけがpages:writeとid-token:writeを持つ。デプロイ成功は対象コミットのActionsで確認する。初回Pages有効化には管理権限が必要で、通常のWorkflowだけで初回設定できると仮定しない。

## 記録を更新する場面

新作品は `doc/day-NNN-title.md` と目次、共通の設計はarchitecture、開発・公開手順はこの文書を更新する。READMEは入口と起動・追加手順を保つ。開発ルールが変わったらAgent.mdとSkill.mdも整合させる。
