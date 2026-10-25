# #00 共通開発・運用

この文書はブランチ・Pull Request・作品別技術資料・devlog の詳細手順を管理する。必須ルールは [AGENTS.md](../AGENTS.md)、作品追加の実行順は [Skill.md](../Skill.md)、設計は [architecture.md](architecture.md) を参照する。#00 は共通運用の番号であり、作品レジストリに登録する Day 000 ではない。

## ブランチ運用

新しい 404 作品は必ず feature ブランチで開発し、原則として 1 作品 1 ブランチとする。main への直接コミット・push、`git push origin HEAD:main`、force push は禁止。共通運用の変更も feature ブランチで行う。

作品の命名規則は `feature/404-NNN-kebab-case`。作品番号は 3 桁ゼロ埋め、作品名は英小文字の kebab-case とする。例：`feature/404-003-glass`。#00 の共通運用は `feature/404-000-common-development` のように区別し、新作品は実際の作品番号・名称を使用する。

作業開始時に以下を確認する。

```sh
git status --short
git diff
git diff --cached
git branch --show-current
git remote -v
git fetch origin
git log -1 --oneline origin/main
```

作業ツリーがクリーンで、新規作業を最新 main から開始する場合の例：

```sh
git switch -c feature/404-003-glass origin/main
```

既存の feature ブランチで継続する場合はその差分を先に確認する。未コミット変更があれば、勝手な破棄・上書き・stash 等の退避は行わない。作業元や競合が今回の目的に影響する場合は、既存作業を保持してユーザーへ確認する。remote 更新の取り込みでも同じ原則を守る。

## Pull Request 運用

1. 実装・技術資料・必要な検証を完了し、`git diff --check` と差分一覧を確認する。
2. feature ブランチで対象ファイルだけをコミットし、`git push -u origin <featureブランチ名>` で同名の remote ブランチへ push する。
3. main を base とする Pull Request を作成する。GitHub では Merge Request という名称は使用しない。
4. PR の最新コミットに対する CI 結果を確認し、失敗時はログから原因を調査・修正する。接続・権限制約で確認できなければ、その事実を報告する。
5. 変更・検証・未確認事項・PR URL を報告して人間のレビューを待つ。ここを Codex の基本的な作業完了地点とする。

作品 PR タイトルは `feat(404): Day XXX - 作品名`（例：`feat(404): Day 003 - Glass 404`）。#00 の文書・運用変更は `docs: #00 共通開発・運用ルールを整備` のように内容を示し、新作品の追加と誤記しない。

PR 本文は [共通テンプレート](../.github/PULL_REQUEST_TEMPLATE.md) を使用する。概要には Day 番号・作品名・コンセプト・主な操作、実装には使用技術・変更内容・選定理由、検証にはテスト・ビルド・PC／モバイル・既存作品への影響を記載する。技術資料リンクと残課題・未確認事項を含める。作品追加でない項目は対象外と明記する。

PR 作成と main へのマージは別の操作。CI 成功だけを承認とみなさず、人間の明示的なマージ承認を待つ。承認前のマージ・自動マージ設定・本番公開（デプロイ workflow の手動起動を含む）はしない。レビュー修正は同じ feature ブランチへ追加し、最新コミットの CI を再確認する。

## 作品別技術ドキュメント

現在は [Day 001](day-001-glitch-404.md)、[Day 002](day-002-break-the-404.md) の `doc/day-NNN-title.md` 形式があるため、この構成を継続する。通常は 1 作品 1Markdown とし、追加資料が必要になった場合のみ作品別ディレクトリを検討する。`doc/artworks/` への一括移動や既存文書の複製は行わない。

各文書に次の内容を簡潔に記録する。既存文書の日本語見出しでも、対応する内容があればよい。

| 項目            | 記載内容                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| Concept         | 表現するもの、操作体験                                                    |
| Technology      | 使用技術・採用理由、必要なら検討した代替技術                              |
| Implementation  | 描画・入力方式、主要コンポーネント、技術的な工夫                          |
| Lessons Learned | 得られた知見、問題と解決方法、改善点                                      |
| Reuse           | 他作品や Web サイトへ再利用・応用できる技術。具体例がなければその旨を記す |

操作・配色・アクセシビリティ・制約・検証範囲も作品に応じて記録する。未実装機能を実装済みと書かず、コードの逐語説明より技術選定理由と再利用可能な知見を優先する。既存記事への参照で足りる内容は重複させず、作品の規模に応じて記述量を調整する。新規文書は [doc の目次](README.md) と PR 本文からリンクする。

## 開発環境

Node.js 24.22.1 と npm を使用する。`.nvmrc` をローカルと CI の共通のバージョン指定とし、`nvm install && nvm use` で切り替える。Next.js と eslint-config-next は 16.4.2 以降の 16 系を使用する。

```sh
npm ci
npm run dev
```

http://localhost:3000 を開く。依存追加時は package.json と package-lock.json を一緒に更新する。秘密情報やローカル生成物はコミットしない。

## Formatter と VS Code

```sh
npm run format       # Prettierで整形
npm run format:check # 変更せず整形を検査
```

`.prettierrc.json` を共通の整形設定とし、`.prettierignore` で生成物・lockfile を除外する。Prettier のルールと競合する ESLint の整形ルールは `eslint-config-prettier/flat` で止め、コード品質の検査は継続する。

VS Code は `.vscode/settings.json` により、保存時に Prettier で整形し、ESLint で検査・自動修正する。`.vscode/extensions.json` に挙げた `esbenp.prettier-vscode` と `dbaeumer.vscode-eslint` の拡張を導入し、`npm ci` を実行してから使用する。ユーザーの VS Code への拡張インストールは別途必要。

ESLint の `source.fixAll.eslint: "always"` は明示的な保存と、VS Code がサポートするフォーカス／ウィンドウ切替時の Auto Save にも対応する。自動修正できない違反は Problems で解決する。`eslint.run: "onSave"` は診断タイミングも保存時に揃える。保存操作そのものの動作はユーザーの VS Code で確認する。

## Linter

```sh
npm run lint       # ESLint: 警告0件を要求
npm run lint:fix   # 自動修正後、差分を確認する
```

`eslint.config.mjs` は `eslint-config-next/core-web-vitals` と `eslint-config-next/typescript` を使用する。React Hooks、Next.js、アクセシビリティ、TypeScript の標準的な問題を検出する。`.next/`、`out/`、ブラウザテストの成果物、生成された next-env.d.ts は対象外。

lint は TypeScript の型検査・ビルド・ブラウザテストを置き換えない。CSS の検査はこの ESLint 設定の対象外。ファイル全体やプロジェクト全体のルール無効化で警告を隠さず、必要な例外には理由を記録する。

## 検証コマンド

```sh
npm run format:check
npm run lint
npm test
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run build
npx playwright install chromium
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run test:e2e
```

- 単体テスト: 乱数の境界と全作品の選択、単一作品、現在以外への Shuffle、空レジストリの拒否。
- ブラウザテスト: Home、Discover、個別作品、スラッシュ有無の直接 URL、サムネイル、マウス・タッチ・キーボード、reduced-motion、Shuffle、404 復帰、320px 幅。
- `typecheck` は `next typegen` を先に実行し、クリーン環境でも Next.js の生成型を用意する。
- ビルドとテストサーバーに同じ basePath を指定する。環境の Chromium を使うときだけ `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` 等を追加する。

文書のみの変更は整形・リンク・規約の整合性・差分確認を基本とし、必要以上にアプリのテストを繰り返さない。CI 設定を変更した場合は対象 PR で実際の CI 結果を確認する。既存のテスト・品質設定を弱めない。

見た目の変更時はスクリーンショットを確認し、作品の静止時と操作時、ナビゲーション、モバイルの横はみ出し、明暗テーマの可読性を見る。未実施の実機・性能計測を「確認済み」に含めない。

PR CI は Ubuntu runner に付属する Chrome を `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で選択し、動画収録用の FFmpeg だけを Playwright で取得する。OS パッケージとブラウザ本体の再取得を避けるが、検証項目は省略しない。Pages のデプロイ workflow は従来どおり Playwright の Chromium と依存を導入する。

ブラウザ試験の出力は PR CI の `browser-review-<PR番号>` artifact に 7 日間保存する。Ripples の画像 3 枚と実時間動画 2 本は `ripples-review-<PR番号>` にまとめて 30 日間保存する。成果物の生成と目視・再生による確認、モバイル設定と実機確認を区別する。

## GitHub Pages

公開 URL は https://rulers.github.io/404-not-founds/ 。Pages の Source は **GitHub Actions**。初回設定とデプロイは完了済み。

main への直接 push による旧運用は廃止する。人間が明示的に承認した PR のマージで main を更新し、その更新を契機に公開する。PR 作成だけでは公開しない。

Workflow の処理順は以下。

1. checkout、Node.js 24、Pages メタデータの確認。
2. npm ci、整形チェック、lint、単体テスト、型チェック。
3. GitHub リポジトリ名から basePath を導出して Static Export。
4. Chromium を導入し、静的出力を PC・モバイル設定でテスト。
5. 必須 HTML を確認して `.nojekyll` を配置し、out を artifact 化。
6. build 成功後、Pages へのデプロイ。

既存の [deploy.yml](../.github/workflows/deploy.yml) は main の更新と workflow_dispatch で起動する。手動起動も本番公開を行うため、人間の明示的な承認が必要。PR の検証は [ci.yml](../.github/workflows/ci.yml) が `pull_request` で同じ品質チェックを実行し、デプロイはしない。PR CI の権限は contents:read だけとし、秘密情報・Pages 権限・日報投稿を必要としない。公開ジョブだけが pages:write と id-token:write を持つ。デプロイ成功は対象コミットの Actions で確認する。初回 Pages 有効化には管理権限が必要で、通常の Workflow だけで初回設定できると仮定しない。

## 記録を更新する場面

新作品は上記の作品別技術資料と目次、共通の設計は architecture、開発・公開手順はこの文書を更新する。README は入口と起動・追加手順を保つ。開発ルールが変わったら AGENTS.md と Skill.md も整合させる。

## devlog 運用

日報生成と投稿を分離し、投稿は作品のユーザーレビュー完了承認後にのみ実施する。承認を推測せず、PR 作成・CI 成功・部分的な操作確認をレビュー完了と同一視しない。日報投稿は実装・テスト・ビルド・PR 作成とは独立した後続処理として扱う。

### Cloud：生成・保存

1. 作業ツリー・Git 履歴・変更差分を確認する。日付は JST で扱い、対象日とプロジェクトを明記する。
2. PR URL・レビュー状況・最新コミットの CI 結果を確認する。未作成・実行中・確認不能はそのまま記録する。
3. 以下の項目で Markdown を作成する。確認済みの事実と未確認事項を分け、推測を実績にしない。
4. 既存の devlog 保存先・同日のファイルがあれば優先し、内容を保持して統合する。なければ `devlog/YYYY-MM-DD-404-not-founds.md` に保存する。秘密情報やローカルの認証設定を含めない。
5. 実行環境・既存設定・認証・投稿先が利用可能で、レビュー承認済みの場合にだけ投稿へ進む。利用できなければ保存パス・不足条件・投稿未完了を報告して Local へ引き継ぐ。

Cloud でコマンド・設定・認証がない場合、投稿を無理に実行しない。認証エラーを繰り返し試行したり、新規認証で埋め合わせたりしない。外部連携で Notion を読めても、devlog CLI に同じ認証が渡るとは限らない。Notion へ直接書き込む別経路で devlog を迂回しない。

### Local：既存設定で投稿

1. `command -v devlog` でコマンドの存在を確認し、実際の CLI のヘルプと既存手順を参照する。未確認のサブコマンドや設定パスを推測しない。
2. 既存の設定ファイル・本運用設定を探し、認証状態・投稿先・対象プロジェクトを確認する。既定設定がカレントディレクトリ基準で見つからない場合は、既存本運用設定を `--config` で明示する。
3. 環境変数は設定有無だけを確認し、値・トークン・認証情報をログ・日報・コミットへ出力しない。一括した環境変数のダンプや秘密ファイルの表示をしない。認証情報の新規発行・上書き・不要な再設定をしない。
4. 同日・同プロジェクトの日報を投稿先で検索し、既存内容を読む。存在すれば新規投稿せず、既存内容を保った統合・追記・更新を検討する。
5. 作品のレビュー完了承認と投稿内容を確認して、既存の devlog 手順で投稿または更新する。既存日報を安全に更新できない場合は重複作成せず、本文と理由を残す。
6. 投稿後に Notion 上の対象ページを読み直し、日付・プロジェクト・本文・Evidence と既存内容の保持を確認する。ページ URL と保存確認結果を報告する。コマンド成功だけを保存確認の代わりにしない。

### 日報の内容・Evidence

- 今日やったこと
- 判断・変更
- AI に任せたこと
- うまくいったこと
- 詰まったこと・失敗
- Evidence（確認できた Commit・PR・CI・公開 URL・テスト結果）
- 学び
- 次にやること

未マージの PR を公開済みと書かず、CI 成功と実サイトの表示確認、模擬センサーと実機確認を分ける。投稿に失敗した場合は原因・保存した Markdown・未完了事項を報告するが、作品の実装・テスト・ビルド・PR 作成まで失敗扱いにしない。
