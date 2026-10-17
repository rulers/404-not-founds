# 技術構成と設計

## 技術の選択

Next.js App Router、React、TypeScript strict、CSSを使用する。Node.js 24とnpmで開発し、GitHub ActionsからGitHub Pagesへ静的出力を配信する。バージョンの実体は `package-lock.json` を正とし、`npm ci` で再現する。

Day 001はCSSとPointer Eventsで成立するため、Three.jsやGLSLは導入していない。認証・DB・CMS・バックエンドAPI・外部フォントも不要。将来WebGLが必要な作品は、その作品の実装に限定して追加を検討する。

## 責務

| ファイル                 | 責務                                         |
| ------------------------ | -------------------------------------------- |
| `app/page.tsx`           | Homeの入口                                   |
| `app/discover/page.tsx`  | レジストリから一覧を生成                     |
| `app/404/[id]/page.tsx`  | 登録IDを静的生成し、固定作品を表示           |
| `app/not-found.tsx`      | 実際の不明URLへの復帰画面                    |
| `components/Gallery.tsx` | 作品のランダム選択・展示レイアウト・テーマ   |
| `components/Header.tsx`  | Home・Discover・Shuffleの導線                |
| `components/artworks/`   | 個別のインタラクティブ作品                   |
| `lib/artworks.ts`        | 作品の型・登録・publicアセットのbasePath補完 |
| `lib/selection.ts`       | ランダム選択・Shuffleの純粋関数              |
| `app/globals.css`        | 共通レイアウト、テーマ、現時点のDay 001演出  |

## 作品レジストリ

`Artwork` は `id`、`title`、`category`、`createdAt`、`description`、`instructions`、`thumbnail`、任意の `theme`・`ownsArtworkInfo`、`component` を持つ。componentは引数なしのReactコンポーネント。IDは一意の3桁文字列とし、既存IDは永続的に扱う。

同じ配列からHome、Discover、静的URLを構築する。`createdAt` は記録用であり公開予約の判定には使わない。配列に登録した作品はすべて公開対象。現時点ではコンポーネントを明示的にimportする。大量の重い作品を追加する際は、計測に基づいて遅延ロードを検討する。

## 全画面レイアウトと入力

Homeと個別ページのGalleryは `100dvh`（フォールバック `100svh`）の展示空間とし、作品のラッパーを全面に配置する。共通フッターと展示上部の状態表示は置かない。

Headerは `immersive` 指定時だけロゴ・Discover・ShuffleまたはHomeを絶対配置で重ねる。左下にDayとタイトル、右下にレジストリの `instructions` を表示する。共通UIのコンテナは `pointer-events: none`、リンク・ボタンだけ `auto` として、非操作領域から作品へクリック・タップ・移動を通す。ナビゲーションの実際のコントロールを操作しても作品のクリックは発生しない。

画面端の余白にはsafe-areaを考慮し、狭い画面では文字サイズと折り返しを調整する。作品の文字サイズも画面の高さを上限にし、横向きで共通UIと重なりにくくする。Discoverでは通常のHeaderを使い、一覧とフッターを維持する。UIの表示状態を管理する新しいstateやライブラリは使用しない。

`ownsArtworkInfo: true` の作品では、共通の下部タイトル・操作説明を省略し、作品自身で情報を配置する。Day 002は左上にタイトル、左下に操作説明、右下にコピーを置く。ヘッダーは共通のまま維持する。

Day 002はCanvas 2Dで描画し、`lib/break404.ts` に盤面と物理を分離する。専用CSS Modulesによって他作品への影響を避ける。

## ランダム展示とShuffle

Homeはマウントごとに `randomIndex()` で公開作品を均等に抽選する。再読み込み・他ページからの再訪でも再抽選し、同じ作品が続く可能性がある。個別URLは固定作品を表示する。表示中の日付・フォーカス・タブ復帰では抽選し直さない。

抽選はuseEffectで実行し、静的HTMLと初回クライアント描画を一致させる。Shuffleは2件以上なら現在以外、1件なら同じ作品を再マウントする。保存領域や追加ライブラリは使わない。

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
