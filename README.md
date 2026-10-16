# 404 NOT FOUNDS — 365 Days of Nothing

毎日作る404 not founds。**A collection of things that shouldn’t exist.**

Next.js App Router / TypeScript / CSSによる静的インタラクティブアートギャラリー。
Day 001はCSSのRGB分離、スキャンライン、ノイズ、水平スライスで構成し、Three.js・DB・API・外部フォントは使用していません。

## 起動

Node.js 24、npmを使用します。

```sh
npm ci
npm run dev
```

http://localhost:3000 を開きます。

```sh
npm run format       # Prettierで整形
npm run format:check # 整形チェック
npm run lint         # ESLint（警告0件）
npm run lint:fix     # 自動修正
npm test             # JST境界・決定論・Shuffle
npm run typecheck
npm run build        # 静的ファイルを out/ に生成
npx playwright install chromium  # ブラウザ未導入の場合
npm run test:e2e     # 静的出力をPC・モバイルで検証
```

## 構成

```text
app/
  page.tsx               Home（日替わり作品）
  discover/page.tsx      公開作品一覧
  404/[id]/page.tsx      全登録作品をビルド時に静的生成
  not-found.tsx          実際の不明URL用 → out/404.html
  globals.css           レイアウト・Glitchアニメーション
components/
  Gallery.tsx           Home／個別ページ共通の展示
  Header.tsx            ナビゲーション
  artworks/Glitch404.tsx Day 001
lib/
  artworks.ts           型付き作品レジストリ・アセットパス
  selection.ts          JST日付・日替わり選択・Shuffle
public/thumbnails/001.svg
.github/workflows/deploy.yml
```

## 操作・日替わり

- カーソルが作品中央に近づくほどRGB分離・ノイズが強くなります。
- クリック／タップで、その座標から波紋と約0.6秒の崩壊が発生。Enter／Spaceにも対応。
- reduced-motionでは自動アニメーションを停止し、操作は短い色の変化で知らせます。
- Pointer EventsとCSS変数で操作を処理し、マウス移動でReactを再レンダリングしません。RAF・タイマー・イベントはアンマウント時に解除します。
- JSTの `YYYY-MM-DD` をFNV-1aでハッシュし、公開作品数で剰余を取ります。同一レジストリ・同一日なら全員同じ作品です。ブラウザ時計を使用するため、端末時計が不正な場合は選択日もずれます。
- Homeは1秒ごとの日付確認、フォーカス復帰、タブ復帰、次のポインター／キーボード操作で更新します。個別作品ページは固定です。
- Shuffleは2件以上なら現在以外の作品を選びます。1件なら同作品を再表示。日付変更まではその選択を保持し、再読み込みでは日替わり作品に戻ります。
- レジストリの順序や件数が変わると、その日の選択も変わり得ます。全閲覧者で同じ公開バージョンが前提です。

## Day 002を追加する

1. `components/artworks/YourArtwork.tsx` を追加します。操作やフックを使う場合は先頭に `"use client";` を付け、デフォルトexportで引数なしの作品コンポーネントを公開します。背景と表示範囲はコンポーネント側で制御し、タイマー等の解除とreduced-motionにも対応してください。
2. `public/thumbnails/002.svg`（PNG等も可）を追加します。推奨比率は3:2。
3. `lib/artworks.ts` にimportし、配列末尾に登録します。

```tsx
import YourArtwork from "@/components/artworks/YourArtwork";

// artworks 配列へ追加
{
  id: "002",
  title: "Your Artwork",
  category: "Typography",
  createdAt: "2026-10-18",
  description: "A short description.",
  thumbnail: "/thumbnails/002.svg",
  theme: "light", // 白背景・黒文字。省略または "dark" で黒背景
  component: YourArtwork,
},
```

4. テスト・ビルドし公開します。Discover、作品数、日替わり、Shuffle、`/404/002/` の静的生成に自動反映されます。`createdAt` はメタデータであり予約公開機能ではありません。登録した作品はすべて公開対象です。IDは一意の3桁文字列にしてください。

現状は小規模な明示的importです。作品が重くなった際にコンポーネントを個別に遅延ロードできます。カテゴリーは登録済みで、将来一覧のフィルターに利用できます。

## GitHub Pages

GitHubの **Settings → Pages → Build and deployment → Source: GitHub Actions** を選択してください。`main` へのpush、またはActionsの手動実行でビルド・デプロイします。別ブランチを公開元にする場合はworkflowのbranchesを変更します。

Actionsでは `GITHUB_REPOSITORY` からリポジトリ名を取得して `basePath` を設定します。このリポジトリでは `/404-not-founds`。`owner.github.io` の形式では空になります。独自ドメイン等で変更する場合は、ビルド環境変数 `NEXT_PUBLIC_BASE_PATH` を明示してください（ルートは空文字、配下は `/repo`、末尾スラッシュなし）。Next Linkと静的サムネイルの両方がこの設定に従います。

ローカルでプロジェクト配下を再現するには：

```sh
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run build
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run test:e2e
# 手動確認の場合
NEXT_PUBLIC_BASE_PATH=/404-not-founds node tests/serve.mjs
```

http://localhost:3000/404-not-founds/ を開きます。テストサーバーはPagesと同様にディレクトリのindex.html、末尾スラッシュへのリダイレクト、不明URLの404.htmlを返します。`next start` はstatic exportの配信には使用しません。

`trailingSlash: true` と `generateStaticParams()` により、`out/discover/index.html`、`out/404/001/index.html` が作られます。404作品の `/404/` ディレクトリと不明URL用の `/404.html` は共存します。Actionsは必要なHTMLの存在を確認し、`.nojekyll` を置いて `out/` をアップロードします。SPA用の404リダイレクトは不要です。

ブラウザテストはPC・モバイル、直接URL（スラッシュ有無）、サムネイル、操作、Shuffle、reduced-motion、キーボード、不明URLからの復帰を検証します。GitHub Pagesへの実デプロイは完了済みです。実機Safari・Lighthouseスコアは別途確認が必要です。

## MVP検証結果（2026-10-17 JST）

- `npm test`: 6件成功。
- `npm run typecheck`: 成功。
- ルート配信の静的ビルドとChromiumテスト: 6件成功。
- `GITHUB_ACTIONS=true GITHUB_REPOSITORY=rulers/404-not-founds npm run build`: 成功。リポジトリ名からbasePathを自動解決。
- 同じActions環境変数で `/404-not-founds/` 配下のブラウザテスト: PC／モバイル合計8件成功。320px幅の横はみ出しも検証。
- ブラウザは環境に導入済みのChromiumを `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` で指定。通常・CIではPlaywrightが導入するChromiumを使用。
- PC／モバイルのスクリーンショットでレイアウトを確認。その後、GitHubへのpushと実際のPagesデプロイも成功。

## 作品ごとの背景テーマ

レジストリの `theme: "light"` で、Homeと個別作品ページの背景・文字・ナビゲーション・罫線・ボタンを明るい配色にします。`"dark"` または省略で黒背景です。作品の切り替えに合わせてテーマも変わり、Discoverに移動すると通常の黒背景に戻ります。端末のダークモード設定には左右されません。

作品内もテーマに合わせたい場合はCSSの `var(--bg)`（背景）、`var(--fg)`（文字）、`var(--muted)`（補助文字）、`var(--line)`（罫線）、`var(--acid)`（アクセント）を使ってください。作品独自の色は自由に指定できます。ページ全体をCSSフィルターで反転しないため、画像やRGB演出の色は保たれます。Day 001は `theme: "dark"` です。

## 開発ドキュメント

- [doc/README.md](doc/README.md): ページ・作品・技術の記録の目次
- [AGENTS.md](AGENTS.md): エージェントが自動検出する開発ルール。設計・品質・mainへのpush方針を集約
- [Skill.md](Skill.md): 作品追加・共通ベース変更・検証・公開の手順

CIは整形チェック・lint・単体テスト・型チェック・ビルド・ブラウザテストを通過してからデプロイします。

## VS Codeの保存時処理

`.vscode/settings.json` でPrettierの保存時整形とESLintの保存時検査・自動修正を設定しています。`npm ci` の実行後、`.vscode/extensions.json` の推奨拡張 **Prettier - Code formatter** と **ESLint** をインストールし、このリポジトリをVS Codeで開いてください。拡張の導入自体はワークスペース設定では自動実行されません。

PrettierはTS/JS・CSS・JSON・Markdown・YAML等の整形、ESLintはJS/TS/Reactの検査・修正を担当します。ESLintの自動修正対象外の問題はProblemsに表示されます。`npm run format:check` と `npm run lint` はCIでも実行します。
