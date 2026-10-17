# Gallery development workflow

このリポジトリのベースを使った開発の実行手順です。自動導入される外部プラグインではなく、[AGENTS.md](AGENTS.md) に基づくローカルの作業ガイドです。

## 作業開始

1. `AGENTS.md` → 関連する `doc/` の文書を読む。
2. `git status --short`、`git diff`、`git branch --show-current`、`git remote -v` を確認する。
3. [#00のブランチ運用](doc/development.md#ブランチ運用)に従い、remoteのmainを確認してfeatureブランチで作業する。未コミット変更がある場合は無断で破棄・上書き・退避しない。
4. READMEの起動方法と `package.json` を確認し、依存が未導入なら `npm ci` を実行する。
5. 既存のコンポーネント・CSS変数・レジストリを使える範囲を確認してから編集する。

## 作品を追加する

1. [Day 001の記録](doc/day-001-glitch-404.md) を参考に、コンセプト・入力への反応・静かな状態と変化の関係を決める。
2. `components/artworks/` に引数なし・default exportの作品コンポーネントを作る。操作やフックには `"use client"` を使う。
3. 独自のクラス名、タッチ、キーボード、reduced-motion、リソース解除を実装する。WebGLは必要な作品だけに使う。
4. `public/thumbnails/NNN.svg` 等を追加する。推奨比率3:2。外部通信なしで表示できる画像を優先する。
5. `lib/artworks.ts` に一意の3桁ID、タイトル、category、createdAt、description、instructions、thumbnail、theme、componentを登録する。配列末尾へ追加し、既存IDは変えない。
6. [技術ドキュメントの構成](doc/development.md#作品別技術ドキュメント)に従って `doc/day-NNN-title.md` を追加し、[doc/README.md](doc/README.md) の作品一覧とPR本文からリンクする。
7. Discoverから選択し、Homeと個別URLの同じ作品・テーマ・操作を確認する。`createdAt` による予約公開はないので、登録した作品は公開される。

### レジストリへの登録例

Day 003を追加する場合の例。実際の作品番号・名前・制作日に置き換える。

```tsx
import YourArtwork from "@/components/artworks/YourArtwork";

// artworks 配列へ追加
{
  id: "003",
  title: "Your Artwork",
  category: "Typography",
  createdAt: "2026-10-18",
  description: "A short description.",
  instructions: "Move to explore / Click or tap to interact",
  thumbnail: "/thumbnails/003.svg",
  theme: "light", // 白背景・黒文字。省略または "dark" で黒背景
  component: YourArtwork,
},
```

登録後はDiscover・作品数・ランダム展示・Shuffle・個別URLの静的生成へ反映される。`createdAt` は予約公開機能ではなくメタデータ。レジストリに登録した作品はマージ・デプロイ後にすべて公開対象となる。IDは一意の3桁文字列とする。レジストリの設計とテーマは [architecture.md](doc/architecture.md) を参照する。

## 共通ベースを変更する

1. `Gallery.tsx`・`Header.tsx`・`app/globals.css`・`lib/selection.ts` の責務を [architecture.md](doc/architecture.md) で確認する。
2. Home、作品ページ、Discover、不明URLで意図しない影響がないか確認する。
3. ランダム選択・Shuffleのロジック変更には複数作品を想定したテストを使う。単一作品の画面だけで判断しない。
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

## Pull Request・報告

1. `git diff --check` と変更一覧を確認し、featureブランチで今回の対象だけをステージしてコミットする。mainへ直接コミット・pushしない。
2. remoteのmainと作業ブランチを確認する。更新の取り込み・競合解消では既存変更を保全し、無断の退避やforce pushをしない。
3. featureブランチへpushし、[PRテンプレート](.github/PULL_REQUEST_TEMPLATE.md)に従ってmain向けのPull Requestを作成する。作品PRタイトルは `feat(404): Day XXX - 作品名`。#00の運用変更は変更内容が分かるタイトルにする。
4. PRのCI結果を確認する。失敗時は原因を調査・修正し、確認できない場合は理由を報告する。
5. 変更内容・検証結果・PR URL・未確認事項を報告してレビューを待つ。PR作成とマージを分離し、人間の明示的な承認なしにマージ・自動マージ設定・本番公開をしない。
6. 承認後のマージ・公開を担当する場合は、mainの対象コミットのCIとデプロイを確認する。

## 日報

[#00のdevlog手順](doc/development.md#devlog運用)に従い、日報を生成・保存する。投稿は作品のユーザーレビュー完了承認後に行う。Cloudで認証・本運用設定が利用できなければMarkdownを残し、Localで既存設定を使って後続処理する。投稿できなくても実装・検証・PR作成とは切り分けて報告する。
