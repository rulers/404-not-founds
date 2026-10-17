# #00 共通開発・運用

この文書はブランチ・Pull Request・作品別技術資料・devlogの詳細手順を管理する。必須ルールは [AGENTS.md](../AGENTS.md)、作品追加の実行順は [Skill.md](../Skill.md)、設計は [architecture.md](architecture.md) を参照する。#00は共通運用の番号であり、作品レジストリに登録するDay 000ではない。

## ブランチ運用

新しい404作品は必ずfeatureブランチで開発し、原則として1作品1ブランチとする。mainへの直接コミット・push、`git push origin HEAD:main`、force pushは禁止。共通運用の変更もfeatureブランチで行う。

作品の命名規則は `feature/404-NNN-kebab-case`。作品番号は3桁ゼロ埋め、作品名は英小文字のkebab-caseとする。例：`feature/404-003-glass`。#00の共通運用は `feature/404-000-common-development` のように区別し、新作品は実際の作品番号・名称を使用する。

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

作業ツリーがクリーンで、新規作業を最新mainから開始する場合の例：

```sh
git switch -c feature/404-003-glass origin/main
```

既存のfeatureブランチで継続する場合はその差分を先に確認する。未コミット変更があれば、勝手な破棄・上書き・stash等の退避は行わない。作業元や競合が今回の目的に影響する場合は、既存作業を保持してユーザーへ確認する。remote更新の取り込みでも同じ原則を守る。

## Pull Request運用

1. 実装・技術資料・必要な検証を完了し、`git diff --check` と差分一覧を確認する。
2. featureブランチで対象ファイルだけをコミットし、`git push -u origin <featureブランチ名>` で同名のremoteブランチへpushする。
3. mainをbaseとするPull Requestを作成する。GitHubではMerge Requestという名称は使用しない。
4. PRの最新コミットに対するCI結果を確認し、失敗時はログから原因を調査・修正する。接続・権限制約で確認できなければ、その事実を報告する。
5. 変更・検証・未確認事項・PR URLを報告して人間のレビューを待つ。ここをCodexの基本的な作業完了地点とする。

作品PRタイトルは `feat(404): Day XXX - 作品名`（例：`feat(404): Day 003 - Glass 404`）。#00の文書・運用変更は `docs: #00 共通開発・運用ルールを整備` のように内容を示し、新作品の追加と誤記しない。

PR本文は [共通テンプレート](../.github/PULL_REQUEST_TEMPLATE.md) を使用する。概要にはDay番号・作品名・コンセプト・主な操作、実装には使用技術・変更内容・選定理由、検証にはテスト・ビルド・PC／モバイル・既存作品への影響を記載する。技術資料リンクと残課題・未確認事項を含める。作品追加でない項目は対象外と明記する。

PR作成とmainへのマージは別の操作。CI成功だけを承認とみなさず、人間の明示的なマージ承認を待つ。承認前のマージ・自動マージ設定・本番公開（デプロイworkflowの手動起動を含む）はしない。レビュー修正は同じfeatureブランチへ追加し、最新コミットのCIを再確認する。

## 作品別技術ドキュメント

現在は [Day 001](day-001-glitch-404.md)、[Day 002](day-002-break-the-404.md) の `doc/day-NNN-title.md` 形式があるため、この構成を継続する。通常は1作品1Markdownとし、追加資料が必要になった場合のみ作品別ディレクトリを検討する。`doc/artworks/` への一括移動や既存文書の複製は行わない。

各文書に次の内容を簡潔に記録する。既存文書の日本語見出しでも、対応する内容があればよい。

| 項目            | 記載内容                                                                |
| --------------- | ----------------------------------------------------------------------- |
| Concept         | 表現するもの、操作体験                                                  |
| Technology      | 使用技術・採用理由、必要なら検討した代替技術                            |
| Implementation  | 描画・入力方式、主要コンポーネント、技術的な工夫                        |
| Lessons Learned | 得られた知見、問題と解決方法、改善点                                    |
| Reuse           | 他作品やWebサイトへ再利用・応用できる技術。具体例がなければその旨を記す |

操作・配色・アクセシビリティ・制約・検証範囲も作品に応じて記録する。未実装機能を実装済みと書かず、コードの逐語説明より技術選定理由と再利用可能な知見を優先する。既存記事への参照で足りる内容は重複させず、作品の規模に応じて記述量を調整する。新規文書は [docの目次](README.md) とPR本文からリンクする。

## 開発環境

Node.js 24とnpmを使用する。

```sh
npm ci
npm run dev
```

http://localhost:3000 を開く。依存追加時はpackage.jsonとpackage-lock.jsonを一緒に更新する。秘密情報やローカル生成物はコミットしない。

## FormatterとVS Code

```sh
npm run format       # Prettierで整形
npm run format:check # 変更せず整形を検査
```

`.prettierrc.json` を共通の整形設定とし、`.prettierignore` で生成物・lockfileを除外する。Prettierのルールと競合するESLintの整形ルールは `eslint-config-prettier/flat` で止め、コード品質の検査は継続する。

VS Codeは `.vscode/settings.json` により、保存時にPrettierで整形し、ESLintで検査・自動修正する。`.vscode/extensions.json` に挙げた `esbenp.prettier-vscode` と `dbaeumer.vscode-eslint` の拡張を導入し、`npm ci` を実行してから使用する。ユーザーのVS Codeへの拡張インストールは別途必要。

ESLintの `source.fixAll.eslint: "always"` は明示的な保存と、VS Codeがサポートするフォーカス／ウィンドウ切替時のAuto Saveにも対応する。自動修正できない違反はProblemsで解決する。`eslint.run: "onSave"` は診断タイミングも保存時に揃える。保存操作そのものの動作はユーザーのVS Codeで確認する。

## Linter

```sh
npm run lint       # ESLint: 警告0件を要求
npm run lint:fix   # 自動修正後、差分を確認する
```

`eslint.config.mjs` は `eslint-config-next/core-web-vitals` と `eslint-config-next/typescript` を使用する。React Hooks、Next.js、アクセシビリティ、TypeScriptの標準的な問題を検出する。`.next/`、`out/`、ブラウザテストの成果物、生成されたnext-env.d.tsは対象外。

lintはTypeScriptの型検査・ビルド・ブラウザテストを置き換えない。CSSの検査はこのESLint設定の対象外。ファイル全体やプロジェクト全体のルール無効化で警告を隠さず、必要な例外には理由を記録する。

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

- 単体テスト: 乱数の境界と全作品の選択、単一作品、現在以外へのShuffle、空レジストリの拒否。
- ブラウザテスト: Home、Discover、個別作品、スラッシュ有無の直接URL、サムネイル、マウス・タッチ・キーボード、reduced-motion、Shuffle、404復帰、320px幅。
- `typecheck` は `next typegen` を先に実行し、クリーン環境でもNext.jsの生成型を用意する。
- ビルドとテストサーバーに同じbasePathを指定する。環境のChromiumを使うときだけ `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` 等を追加する。

文書のみの変更は整形・リンク・規約の整合性・差分確認を基本とし、必要以上にアプリのテストを繰り返さない。CI設定を変更した場合は対象PRで実際のCI結果を確認する。既存のテスト・品質設定を弱めない。

見た目の変更時はスクリーンショットを確認し、作品の静止時と操作時、ナビゲーション、モバイルの横はみ出し、明暗テーマの可読性を見る。未実施の実機・性能計測を「確認済み」に含めない。

## GitHub Pages

公開URLは https://rulers.github.io/404-not-founds/ 。PagesのSourceは **GitHub Actions**。初回設定とデプロイは完了済み。

mainへの直接pushによる旧運用は廃止する。人間が明示的に承認したPRのマージでmainを更新し、その更新を契機に公開する。PR作成だけでは公開しない。

Workflowの処理順は以下。

1. checkout、Node.js 24、Pagesメタデータの確認。
2. npm ci、整形チェック、lint、単体テスト、型チェック。
3. GitHubリポジトリ名からbasePathを導出してStatic Export。
4. Chromiumを導入し、静的出力をPC・モバイル設定でテスト。
5. 必須HTMLを確認して `.nojekyll` を配置し、outをartifact化。
6. build成功後、Pagesへのデプロイ。

既存の [deploy.yml](../.github/workflows/deploy.yml) はmainの更新とworkflow_dispatchで起動する。手動起動も本番公開を行うため、人間の明示的な承認が必要。PRの検証は [ci.yml](../.github/workflows/ci.yml) が `pull_request` で同じ品質チェックを実行し、デプロイはしない。PR CIの権限はcontents:readだけとし、秘密情報・Pages権限・日報投稿を必要としない。公開ジョブだけがpages:writeとid-token:writeを持つ。デプロイ成功は対象コミットのActionsで確認する。初回Pages有効化には管理権限が必要で、通常のWorkflowだけで初回設定できると仮定しない。

### basePath付きのローカル確認

Actionsでは `GITHUB_REPOSITORY` からbasePathを導出する。このリポジトリは `/404-not-founds`、`owner.github.io` 形式では空。独自ドメイン等では `NEXT_PUBLIC_BASE_PATH` を明示する（ルートは空文字、配下は `/repo`、末尾スラッシュなし）。設計は [Static ExportとbasePath](architecture.md#static-exportとbasepath) を参照する。

```sh
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run build
NEXT_PUBLIC_BASE_PATH=/404-not-founds npm run test:e2e
# 手動確認
NEXT_PUBLIC_BASE_PATH=/404-not-founds node tests/serve.mjs
```

http://localhost:3000/404-not-founds/ を開く。テストサーバーはPagesと同様にindex.html、末尾スラッシュへのリダイレクト、不明URLへの404.htmlを返す。static exportの配信に `next start` は使用しない。SPA用404リダイレクトは不要。

### 初期MVPの検証履歴（2026-10-17 JST）

以下は初期MVP時点の記録であり、現在のテスト件数や最新バージョンの検証結果ではない。最新結果は対象PR・コミットのCIで確認する。

- `npm test`: 6件成功。
- `npm run typecheck`: 成功。
- ルート配信の静的ビルドとChromiumテスト: 6件成功。
- `GITHUB_ACTIONS=true GITHUB_REPOSITORY=rulers/404-not-founds npm run build`: 成功。リポジトリ名からbasePathを自動解決。
- 同じActions環境変数で `/404-not-founds/` 配下のブラウザテスト: PC／モバイル合計8件成功。320px幅の横はみ出しも検証。
- ブラウザは環境に導入済みのChromiumを `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` で指定。通常・CIではPlaywrightが導入するChromiumを使用。
- PC／モバイルのスクリーンショットでレイアウトを確認。その後、GitHubへのpushと実際のPagesデプロイも成功。

## 記録を更新する場面

新作品は上記の作品別技術資料と目次、共通の設計はarchitecture、開発・公開手順はこの文書を更新する。READMEはプロジェクト紹介・最小限の起動方法・詳細資料への導線を保つ。作品追加の詳細手順はSkill.mdに置く。開発ルールが変わったらAGENTS.mdとSkill.mdも整合させる。

## devlog運用

日報生成と投稿を分離し、投稿は作品のユーザーレビュー完了承認後にのみ実施する。承認を推測せず、PR作成・CI成功・部分的な操作確認をレビュー完了と同一視しない。日報投稿は実装・テスト・ビルド・PR作成とは独立した後続処理として扱う。

### Cloud：生成・保存

1. 作業ツリー・Git履歴・変更差分を確認する。日付はJSTで扱い、対象日とプロジェクトを明記する。
2. PR URL・レビュー状況・最新コミットのCI結果を確認する。未作成・実行中・確認不能はそのまま記録する。
3. 以下の項目でMarkdownを作成する。確認済みの事実と未確認事項を分け、推測を実績にしない。
4. 既存のdevlog保存先・同日のファイルがあれば優先し、内容を保持して統合する。なければ `devlog/YYYY-MM-DD-404-not-founds.md` に保存する。秘密情報やローカルの認証設定を含めない。
5. 実行環境・既存設定・認証・投稿先が利用可能で、レビュー承認済みの場合にだけ投稿へ進む。利用できなければ保存パス・不足条件・投稿未完了を報告してLocalへ引き継ぐ。

Cloudでコマンド・設定・認証がない場合、投稿を無理に実行しない。認証エラーを繰り返し試行したり、新規認証で埋め合わせたりしない。外部連携でNotionを読めても、devlog CLIに同じ認証が渡るとは限らない。Notionへ直接書き込む別経路でdevlogを迂回しない。

### Local：既存設定で投稿

1. `command -v devlog` でコマンドの存在を確認し、実際のCLIのヘルプと既存手順を参照する。未確認のサブコマンドや設定パスを推測しない。
2. 既存の設定ファイル・本運用設定を探し、認証状態・投稿先・対象プロジェクトを確認する。既定設定がカレントディレクトリ基準で見つからない場合は、既存本運用設定を `--config` で明示する。
3. 環境変数は設定有無だけを確認し、値・トークン・認証情報をログ・日報・コミットへ出力しない。一括した環境変数のダンプや秘密ファイルの表示をしない。認証情報の新規発行・上書き・不要な再設定をしない。
4. 同日・同プロジェクトの日報を投稿先で検索し、既存内容を読む。存在すれば新規投稿せず、既存内容を保った統合・追記・更新を検討する。
5. 作品のレビュー完了承認と投稿内容を確認して、既存のdevlog手順で投稿または更新する。既存日報を安全に更新できない場合は重複作成せず、本文と理由を残す。
6. 投稿後にNotion上の対象ページを読み直し、日付・プロジェクト・本文・Evidenceと既存内容の保持を確認する。ページURLと保存確認結果を報告する。コマンド成功だけを保存確認の代わりにしない。

### 日報の内容・Evidence

- 今日やったこと
- 判断・変更
- AIに任せたこと
- うまくいったこと
- 詰まったこと・失敗
- Evidence（確認できたCommit・PR・CI・公開URL・テスト結果）
- 学び
- 次にやること

未マージのPRを公開済みと書かず、CI成功と実サイトの表示確認、模擬センサーと実機確認を分ける。投稿に失敗した場合は原因・保存したMarkdown・未完了事項を報告するが、作品の実装・テスト・ビルド・PR作成まで失敗扱いにしない。
