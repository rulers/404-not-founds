# 404 NOT FOUNDS — 開発ルール

この文書はリポジトリ全体の開発基準です。ユーザーからの明示的な指示を優先します。実行手順は [Skill.md](Skill.md)、仕様と設計は [doc/README.md](doc/README.md) を参照してください。

## 守る設計

- 正式名称は **404 NOT FOUNDS — 365 Days of Nothing**。HTTPエラーの一般名称まで複数形に置換しない。
- Next.js App Router、TypeScript strict、CSS、npm、Node.js 24を基本とする。
- GitHub Pagesへの静的出力を維持する。認証・DB・バックエンドAPI・実行時サーバーを前提にしない。
- `output: "export"`、`trailingSlash: true`、登録作品の `generateStaticParams()` を維持する。404作品と不明URL用の `404.html` を混同しない。
- Homeと個別ページは同じ作品コンポーネントを使う。公開作品の情報源は `lib/artworks.ts` のレジストリに集約する。
- 通常の作品追加は「作品コンポーネント、レジストリ、サムネイル、作品の説明md」の追加で完結させる。
- CSSで十分な演出にはThree.jsを導入しない。新規依存や抽象化は具体的な必要性を確認してから追加する。
- 内部ページの遷移はNext Link、publicアセットの参照は `assetPath()` を使い、basePath配下の公開を壊さない。
- 日替わりはJST 0:00を基準とする。同じ公開バージョン・同じ日なら同じ作品。日替わり判定にMath.randomを使わない。1作品のShuffleと日付変更の検知を維持する。

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
- 新作品は `doc/day-NNN-title.md` にコンセプト・操作・技術・配色・アクセシビリティ・制約を記録し、docの目次を更新する。
- 共通の設計変更は `doc/architecture.md`、運用変更は `doc/development.md` と必要に応じてREADME・この文書へ反映する。
- 検証済み事項と未確認事項を分ける。実サイトを閲覧できない場合、Actions成功を実サイトの表示確認と同一視しない。

## Gitと公開

- 作業前にstatus・差分・現在のブランチを確認する。既存変更を無断で上書き・破棄しない。
- ユーザーの方針に従い、通常は作業完了後にコミットして `main` へpushする。push前にremoteの最新状態を確認し、競合があれば変更を保全して解決する。
- 作業ブランチからは必要に応じて `git push origin HEAD:main` を使う。force pushはしない。
- Actionsのビルド・テスト・デプロイ完了まで確認し、失敗はログから原因を特定して対応する。権限・接続制限で止まった場合は実施済み内容と必要な操作だけを報告する。
- 関係のないファイルや生成物、認証情報をコミットしない。
