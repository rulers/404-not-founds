# Gallery development workflow

このリポジトリのベースを使った開発の実行手順です。自動導入される外部プラグインではなく、[Agent.md](Agent.md) に基づくローカルの作業ガイドです。

## 作業開始

1. `AGENTS.md` → `Agent.md` → 関連する `doc/` の文書を読む。
2. `git status --short`、`git diff`、`git branch --show-current`、`git remote -v` を確認する。
3. READMEの起動方法と `package.json` を確認し、依存が未導入なら `npm ci` を実行する。
4. 既存のコンポーネント・CSS変数・レジストリを使える範囲を確認してから編集する。

## 作品を追加する

1. [Day 001の記録](doc/day-001-glitch-404.md) を参考に、コンセプト・入力への反応・静かな状態と変化の関係を決める。
2. `components/artworks/` に引数なし・default exportの作品コンポーネントを作る。操作やフックには `"use client"` を使う。
3. 独自のクラス名、タッチ、キーボード、reduced-motion、リソース解除を実装する。WebGLは必要な作品だけに使う。
4. `public/thumbnails/NNN.svg` 等を追加する。推奨比率3:2。外部通信なしで表示できる画像を優先する。
5. `lib/artworks.ts` に一意の3桁ID、タイトル、category、createdAt、description、thumbnail、theme、componentを登録する。配列末尾へ追加し、既存IDは変えない。
6. `doc/day-NNN-title.md` を追加し、[doc/README.md](doc/README.md) の作品一覧にリンクする。
7. Discoverから選択し、Homeと個別URLの同じ作品・テーマ・操作を確認する。`createdAt` による予約公開はないので、登録した作品は公開される。

## 共通ベースを変更する

1. `Gallery.tsx`・`Header.tsx`・`app/globals.css`・`lib/selection.ts` の責務を [architecture.md](doc/architecture.md) で確認する。
2. Home、作品ページ、Discover、不明URLで意図しない影響がないか確認する。
3. 日替わり・Shuffleのロジック変更には複数作品を想定したテストを使う。単一作品の画面だけで判断しない。
4. テーマ変更ではヘッダー・ボタン・補助文字・フォーカス・ページ背景まで読めること、Discoverで黒背景に戻ることを確認する。

## 検証

```sh
npm run format:check
npm run lint
npm test
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run build
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run test:e2e
```

ブラウザ未導入なら `npx playwright install chromium` を実行する。環境で提供されたChromiumを使う場合のみ `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` を指定する。ネットワーク・権限の制約があれば、回避せず未確認事項として記録する。

- 整形には `npm run format` を使う。VS Codeでは推奨のPrettier・ESLint拡張を導入し、保存時整形とESLintの自動修正を利用する。
- lintの修正候補には `npm run lint:fix` を使える。差分を必ず見直す。
- PC、390px相当のモバイル、320px幅、直接URL、操作、reduced-motionを確認する。
- CIではGitHubのリポジトリ名からbasePathを自動設定する。ローカルで明示指定したビルドと配信側のbasePathを揃える。

## 公開・報告

1. `git diff --check` と変更一覧を確認し、今回の対象だけをステージしてコミットする。
2. `git ls-remote origin refs/heads/main` 等でremoteを確認する。remoteが進んでいたらfetchして内容を確認し、変更を保全して取り込む。
3. ユーザーの通常方針として `main` へpushする。作業ブランチなら `git push origin HEAD:main`。force pushは使わない。
4. 対象コミットのActionsを確認し、失敗時は該当jobのログから修正する。
5. 変更内容、検証結果、公開URL、残った制約を簡潔に報告する。
