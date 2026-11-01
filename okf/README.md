---
type: Reference
title: 404 NOT FOUNDS OKF運用
description: 作品制作を支える概念・議論・実験・判断への入口。
---

# 404 NOT FOUNDS の知識基盤

**404 NOT FOUNDS — 365 Days of Nothing** は「存在しないこと」を365通りのインタラクティブ作品にするプロジェクト。暗さや消失だけに限定せず、不条理・ユーモア・ポップさ・錯覚・数学・音楽も扱う。制作速度と作品品質を優先する。

## 採用仕様と配置

[GoogleCloudPlatform Open Knowledge Format SPEC v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)（2026-11-01確認）のMarkdown + YAML frontmatter、type、sources、status、相対リンク、index.mdを採用する。独自の標準規格は定義しない。公式仕様ではtypeのみ必須。本リポジトリの追加必須項目・検証は、制作向けのローカル運用制約であり、汎用OKFの適合検査ではない。未知の拡張キーは許容する。

当初依頼のフォルダ名に合わせて `okf/` を使う。推奨案の `knowledge/` と役割は同じ。コードと一緒に変更・レビューできるため、専用リポジトリは作らない。このフォルダはGitで配布する知識バンドルで、Pages配下へコピーする機能は追加しない。

- [index.md](index.md)：人間・Codex用の索引（生成）。
- [index.json](index.json)：検索・加工用の派生索引（ローカル拡張、生成）。
- `artworks/`：全登録作品001〜009のコンセプトと既存文書への入口。
- [discussions/](discussions/index.md)：討論経緯。確認できる元ログがある場合だけ追加。
- `experiments/`：目的・仮説・方法・結果・失敗と再利用。
- `decisions/`：採用・保留・却下の判断と根拠。制作上の横断的な知見もここから辿る。
- `templates/`：4種類のひな形。索引と作品数に含めない。
- [schema/metadata.schema.json](schema/metadata.schema.json)：ローカル運用のメタデータ契約。

READMEとテンプレートにもtypeを付け、補助文書として読めるようにする。原本の会話や画像を無断で複製せず、共有可能な参照先と必要な経緯だけを残す。

## 正本と重複回避

| 内容                                             | 正本                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 公開対象・表示名・操作案内・部品                 | [lib/artworks.ts](../lib/artworks.ts)、[作品コード](../components/artworks/)                         |
| 各作品の技術・操作・配色・アクセシビリティ・制約 | [doc/](../doc/README.md)                                                                             |
| 共通設計・運用                                   | [architecture](../doc/architecture.md)、[development](../doc/development.md)、[AGENTS](../AGENTS.md) |
| 発想の比較、議論、実験、意味のある判断           | このバンドル。既存資料の詳細はリンクする                                                             |

初回の作品記録は既存資料を読み直した短い導入。過去の制作意図を新たに断定しない。解釈はその旨を記し、過去の検証報告と今回の実行結果を区別する。

## メタデータ

- 必須：`id, type, title, description, status, created, updated, tags, sources`。idはバンドル内パスから.mdを除いたもの。
- type：この運用ではArtwork / Discussion / Experiment / Decisionを使用。
- status：記録のdraft / stable / deprecated。作品の制作状態とは別。初回記録はレビュー前のdraftとし、人間の確認を推測しない。
- Artworkのみ：`artwork_id`（3桁）、`production_status`（idea / in-progress / implemented / retired）。implementedは登録・実装の存在を示す。
- 必要時のみ：`related_artworks, related_discussions, implementation_path, commit_sha`。implementation_pathはリポジトリルート相対、commit_shaは根拠を読んだ40桁SHAで、現在HEADへの自動更新はしない。
- `sources[].resource`は原典URLまたは記録からの相対パス。コード・既存資料の固定SHAリンクと、本文の現在コードへの相対リンクを併用する。新しい根拠で更新した際だけSHAを変える。
- `created, updated`は**知識記録**の作成・更新日時（UTCオフセット付き）。作品の制作日ではない。
- `release_order`は実際の公開順序、`started_at`は制作開始日時、`published_at`は公開日時。根拠がある場合だけ設定する。作品ID・レジストリ順序・createdAtから推測しない。
- `generated, verified`等の公式任意項目も追加できる。ただし人間のレビューや承認を偽って設定しない。verifiedがない記録は未検証として扱う。

## 追加・更新・検索

1. `rg "語句" okf doc` と索引で関連記録を絞り、コードと既存作品を確認する。構図・配色・操作・時間・404体験の類似を比較する。
2. [作品](templates/artwork.md)・[討論](templates/discussion.md)・[実験](templates/experiment.md)・[判断](templates/decision.md)を必要なときだけコピー。365件の空ファイルは作らない。
3. id・日付・根拠と必要な本文を記入。テンプレートの未記入状態を実例として登録しない。討論の結論は実装指示や承認ではない。
4. 意味のある判断・実験・失敗が変わったときだけ対象記録とupdatedを更新する。すべてのコード変更の記事化やNotionへの二重保存はしない。
5. 次を実行して差分をレビューし、既存のfeatureブランチ・PR運用に従う。

```sh
npm run knowledge:index
npm run format:check
npm run knowledge:check
npm test
rg "wind|shader|不条理" okf
```

検証・索引生成は開発時のみ。YAMLはyaml、JSON SchemaはAjvで解釈し、アプリの実行時には組み込まない。index.jsonとindex.mdは本文とfrontmatterから再生成し、直接編集しない。9件では手動索引も可能だが、将来の365作品と関連記録の漏れ・陳腐化を防ぐため小さな生成処理を使う。ローカル検査はID、日付、関連先、実装パス、リンク、登録作品の網羅と索引の鮮度を確認し、外部URLの疎通や主張の真偽は確認しない。npm testでもknowledge:checkを実行し、既存CIに検査を含める。

古い記録は原則削除せずdeprecatedにし、後続の判断を本文でリンクする。改名すると概念IDが変わるため、関連先と索引も更新する。根拠のSHAに古い内容が残ることと、現在の実装に有効であることは区別する。

## 初回調査（2026-11-01）

- GitHubの `user:rulers 404` 検索で確認できた対象は [rulers/404-not-founds](https://github.com/rulers/404-not-founds)。検索範囲外の関連リポジトリがないとは断定しない。
- ローカルmainの根拠は `aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2`。README・AGENTS・Skill・作品レジストリ・9作品の技術資料・Git履歴を確認。Next.js静的出力、Home/個別ページ共用、作品ソース配置を維持する。
- [Issue #12](https://github.com/rulers/404-not-founds/issues/12)はBreak404の改善提案。提案を実装済みとして移植しない。
- [PR #16](https://github.com/rulers/404-not-founds/pull/16)の実装・CI報告と `tests/ripples404.test.ts` を、実験の代表例の根拠に使う。ライセンスと素材選定の代表判断はSmokeの既存資料を参照。
- 確認できる多人数AI討論の原ログは未取得。過去の対立・参加ロール・転換点を創作せず、discussionsは案内とテンプレートのみで開始する。
