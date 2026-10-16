# 技術構成と設計

## 技術の選択

Next.js App Router、React、TypeScript strict、CSSを使用する。Node.js 24とnpmで開発し、GitHub ActionsからGitHub Pagesへ静的出力を配信する。バージョンの実体は `package-lock.json` を正とし、`npm ci` で再現する。

Day 001はCSSとPointer Eventsで成立するため、Three.jsやGLSLは導入していない。認証・DB・CMS・バックエンドAPI・外部フォントも不要。将来WebGLが必要な作品は、その作品の実装に限定して追加を検討する。

## 責務

| ファイル                 | 責務                                           |
| ------------------------ | ---------------------------------------------- |
| `app/page.tsx`           | Homeの入口                                     |
| `app/discover/page.tsx`  | レジストリから一覧を生成                       |
| `app/404/[id]/page.tsx`  | 登録IDを静的生成し、固定作品を表示             |
| `app/not-found.tsx`      | 実際の不明URLへの復帰画面                      |
| `components/Gallery.tsx` | 作品選択・日替わり監視・展示レイアウト・テーマ |
| `components/Header.tsx`  | Home・Discover・Shuffleの導線                  |
| `components/artworks/`   | 個別のインタラクティブ作品                     |
| `lib/artworks.ts`        | 作品の型・登録・publicアセットのbasePath補完   |
| `lib/selection.ts`       | JST日付・決定論的選択・Shuffleの純粋関数       |
| `app/globals.css`        | 共通レイアウト、テーマ、現時点のDay 001演出    |

## 作品レジストリ

`Artwork` は `id`、`title`、`category`、`createdAt`、`description`、`instructions`、`thumbnail`、任意の `theme`、`component` を持つ。componentは引数なしのReactコンポーネント。IDは一意の3桁文字列とし、既存IDは永続的に扱う。

同じ配列からHome、Discover、静的URLを構築する。`createdAt` は記録用であり公開予約の判定には使わない。配列に登録した作品はすべて公開対象。現時点ではコンポーネントを明示的にimportする。大量の重い作品を追加する際は、計測に基づいて遅延ロードを検討する。

## 全画面レイアウトと入力

Homeと個別ページのGalleryは `100dvh`（フォールバック `100svh`）の展示空間とし、作品のラッパーを全面に配置する。共通フッターと展示上部の状態表示は置かない。

Headerは `immersive` 指定時だけロゴ・Discover・ShuffleまたはHomeを絶対配置で重ねる。左下にDayとタイトル、右下にレジストリの `instructions` を表示する。共通UIのコンテナは `pointer-events: none`、リンク・ボタンだけ `auto` として、非操作領域から作品へクリック・タップ・移動を通す。ナビゲーションの実際のコントロールを操作しても作品のクリックは発生しない。

画面端の余白にはsafe-areaを考慮し、狭い画面では文字サイズと折り返しを調整する。作品の文字サイズも画面の高さを上限にし、横向きで共通UIと重なりにくくする。Discoverでは通常のHeaderを使い、一覧とフッターを維持する。UIの表示状態を管理する新しいstateやライブラリは使用しない。

## 日替わりとShuffle

ブラウザ時計を9時間進めたUTC日付からJSTの `YYYY-MM-DD` を作り、FNV-1aでハッシュして作品数の剰余で選ぶ。サーバーも乱数の保存も不要。同じ日付・同じレジストリなら同じ選択になる。

Homeは初回マウント、1秒間隔、フォーカス復帰、visibilitychange、pointerdown、keydownで日付を確認する。日付が変わった時だけ選択stateを更新する。個別ページでは監視しない。イベントとintervalはアンマウント時に解除する。

Shuffleは2件以上なら現在以外のindexを選ぶ。1件なら0を返し、作品を再マウントする。日付が変わるか再読み込みするまでは手動選択を維持する。レジストリの件数・順序を変えると同じ日でも選択が変わり得る。端末時計の誤りも選択日に影響する。

## テーマ

`theme: "dark" | "light"` をレジストリに指定する。未指定はdark。Galleryの `data-theme` とCSS変数で、展示・ヘッダー・下部の作品情報・ボタン・ページ背景をまとめて切り替える。

| 変数                                 | 用途                           |
| ------------------------------------ | ------------------------------ |
| `--bg` / `--fg`                      | 背景／主要文字                 |
| `--muted` / `--detail` / `--soft-fg` | 補助情報・細部                 |
| `--line`                             | 罫線                           |
| `--acid`                             | アクセント                     |
| `--button-ink` / `--accent-ink`      | 濃いボタン／アクセント上の文字 |

`:root:has(.gallery-shell[data-theme="light"])` でページ全体の配色とcolor-schemeも変える。shell自身にもlightの変数を持たせる。Discoverへの遷移でlightのshellがなくなればrootはdarkへ戻る。OSのテーマには依存しない。CSSの `filter: invert()` は使わず、作品固有の画像やRGB色はそのまま保持する。

## Static ExportとbasePath

`next.config.ts` は `output: "export"` と `trailingSlash: true` を使用する。個別作品ルートは `generateStaticParams()` と `dynamicParams = false` で登録済みIDだけを生成する。

- `/` → `out/index.html`
- `/discover/` → `out/discover/index.html`
- `/404/001/` → `out/404/001/index.html`
- 不明URL → `out/404.html`

basePathは明示した `NEXT_PUBLIC_BASE_PATH` を優先し、Actionsでは `GITHUB_REPOSITORY` のリポジトリ名から導出する。`owner.github.io` 形式はルート配信。それ以外は `/<repo>`。Next LinkはbasePathを扱い、publicファイルは `assetPath()` で補う。

## 品質ツール

Prettierで整形を統一し、VS Codeの保存時整形とCIの `format:check` に同じ設定を使う。ESLintと整形の役割を分け、競合はeslint-config-prettierで解消する。

ESLint flat configでNext.js Core Web VitalsとTypeScriptの推奨ルールを適用する。`npm run lint` は警告も失敗扱いにする。生成物はlint対象外。ESLintの対象はJS/TS/Reactで、CSSはこの設定の対象外。

Node標準test runnerは日付・Shuffleを検証し、PlaywrightはChromiumのPC・モバイル設定で静的出力を確認する。Safari実機やLighthouseの測定とは区別する。CIは整形チェック・lint・単体テスト・型チェック・ビルド・ブラウザテスト成功後にだけ公開する。
