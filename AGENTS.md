# 404 NOT FOUNDS — 開発ルール

この `AGENTS.md` は、エージェントが自動検出するリポジトリ全体の開発ルールです。変更前にこの文書を読み、ユーザーからの明示的な指示を優先してください。実行手順は [Skill.md](Skill.md)、仕様と設計は [doc/README.md](doc/README.md) を参照してください。

## 守る設計

- 正式名称は **404 NOT FOUNDS — 365 Days of Nothing**。HTTPエラーの一般名称まで複数形に置換しない。
- Next.js App Router、TypeScript strict、CSS、npm、Node.js 24を基本とする。
- GitHub Pagesへの静的出力を維持する。認証・DB・バックエンドAPI・実行時サーバーを前提にしない。
- `output: "export"`、`trailingSlash: true`、登録作品の `generateStaticParams()` を維持する。404作品と不明URL用の `404.html` を混同しない。
- Homeと個別ページは同じ作品コンポーネントを使う。公開作品の情報源は `lib/artworks.ts` のレジストリに集約する。
- 通常の作品追加は「作品コンポーネント、レジストリ、サムネイル、作品の説明md」の追加で完結させる。
- CSSで十分な演出にはThree.jsを導入しない。新規依存や抽象化は具体的な必要性を確認してから追加する。
- 内部ページの遷移はNext Link、publicアセットの参照は `assetPath()` を使い、basePath配下の公開を壊さない。
- Homeはアクセス・再読み込み・他ページからの再訪ごとに公開作品からランダム選択する。同じ作品が続く場合もある。個別作品URLは固定。Shuffleは複数作品なら現在以外、1作品なら再表示する。静的HTMLとのhydration不一致を防ぐため抽選はクライアントのマウント後に行う。

## 表現・操作

- ミニマルな展示空間、作品優先の画面、モバイル操作を保つ。作品ごとのテーマは `theme: "dark" | "light"` で指定する。
- 背景・文字・罫線は既存のCSS変数を使う。画像やRGB演出まで変わるページ全体への反転フィルターは使わない。
- 新しい作品のスタイルは作品名でスコープを分け、他作品や共通ナビゲーションに漏らさない。
- マウスだけに依存せず、タップ・キーボード・フォーカス表示・操作説明に対応する。
- `prefers-reduced-motion` の静かな代替表現を用意する。RAF、タイマー、イベント、WebGL資源は適切に解除する。
- ポインター移動ごとのReact state更新を避ける。画像には寸法と適切な代替テキストを付ける。

## 品質と記録

- Prettierを共通formatterとし、`npm run format:check` を通す。整形は `npm run format`。ESLintと競合する整形ルールは `eslint-config-prettier` で無効にする。
- ESLintのCore Web Vitals・TypeScriptルールを適用し、`npm run lint` を警告0件で通す。
- ルールを一括無効化して問題を隠さない。対象を絞った例外は静的サイトの制約など具体的な理由をコードに残す。
- 変更に適した検証を実施する。ロジック変更には必要なテストを追加し、実装の写しや低影響の変更のためだけのテストを増やさない。
- 公開前にformat:check、lint、単体テスト、型チェック、basePath付きビルド、既存ブラウザテストを通す。CIも同じ検証を行う。
- 新作品は既存形式の `doc/day-NNN-title.md` を1作品1ファイルで作成し、Concept・Technology・Implementation・Lessons Learned・Reuseに相当する内容と、操作・配色・アクセシビリティ・制約を簡潔に記録する。実装した事実を優先し、docの目次とPRからリンクする。詳細は [#00 共通開発・運用](doc/development.md) を参照。
- 共通の設計変更は `doc/architecture.md`、運用変更は `doc/development.md` と必要に応じてREADME・この文書へ反映する。
- 検証済み事項と未確認事項を分ける。実サイトを閲覧できない場合、Actions成功を実サイトの表示確認と同一視しない。

## Git・Pull Request・公開

- 作業前にstatus・差分・現在のブランチ・remoteのmain／developを確認する。既存変更を無断で破棄・上書き・退避しない。
- Git Flowを採用する。mainは公開済み、developは開発統合。新作品はdevelopから `feature/404-NNN-kebab-case`（作品番号は3桁）を作り、原則1作品1ブランチとする。共通運用もfeatureブランチで行い、PR先はdevelop。
- main／developへの直接コミット・pushとforce pushは禁止（移行時のdevelop初回作成を除く）。変更はfeature・release・hotfixへコミットし、PRで統合する。
- 作品PRのタイトルは `feat(404): Day XXX - 作品名`。概要・実装・検証・技術文書リンク・残課題を記載する。[PRテンプレート](.github/PULL_REQUEST_TEMPLATE.md)を使う。
- PR作成とCI結果確認をCodexの基本的な作業完了地点とする。CI失敗は調査・修正し、PR作成とマージを分離する。人間の明示的な承認なしにマージ・自動マージ設定・本番公開を行わない。
- 公開準備はdevelopから `release/<version>` を作り、承認後にmainへPRでマージする。同じreleaseをdevelopにもPRで戻す。緊急修正はmainから `hotfix/<version>-<name>` を作り、承認後にmainとdevelopへPRで反映する。進行中のreleaseにも必要な修正を取り込む。
- mainへのマージがPages公開の契機になる。develop・feature・release・hotfixから本番公開しない。release／hotfix完了時のタグは承認済みmainの対象コミットへ付ける。詳細は [Git Flow手順](doc/development.md#ブランチ運用) を参照し、CI・デプロイ・実サイト確認を区別する。
- 関係のないファイルや生成物、認証情報をコミットしない。RTK・lean-ctx等の既存設定は目的なく変更しない。

## devlog

- 日報の生成と投稿を分離する。Git履歴・差分・PR・CIを根拠に作成し、作品のユーザーレビュー完了承認後にのみ投稿する。レビュー承認は推測しない。
- CloudはMarkdown作成・保存を基本とする。既存の保存先がなければ `devlog/YYYY-MM-DD-404-not-founds.md` に保存する。認証・設定がなければ投稿を無理に実行せず、認証エラーを繰り返し試行しない。
- Localは既存のdevlog・本運用設定・認証・投稿先を確認し、必要なら `--config` を指定する。認証情報の新規発行・上書き、環境変数・トークン・認証情報のログ／日報出力は禁止。
- 同日・同プロジェクトの既存日報を確認し、新規作成より内容を保持した統合・追記・更新を検討する。投稿後はNotion上の保存内容を確認する。
- 投稿失敗は実装・テスト・ビルド・PR作成の失敗とは分けて報告する。手順と記載項目は [#00 共通開発・運用](doc/development.md) を参照。

## コマンド出力

RTKによるコマンド出力の取り扱いは、次の管理ファイルを参照してください。

@RTK.md
