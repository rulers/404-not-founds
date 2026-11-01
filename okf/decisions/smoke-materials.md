---
id: "decisions/smoke-materials"
type: "Decision"
title: "煙の素材と描画手法を分離する"
description: "権利条件の不明なPNGを避け、自作素材と作品専用WebGLを使う。"
status: "draft"
created: "2026-11-01T10:01:46Z"
updated: "2026-11-01T10:01:46Z"
tags: ["webgl", "licensing", "reuse"]
sources:
  [
    {
      "resource": "https://github.com/rulers/404-not-founds/blob/aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2/doc/day-005-lost-in-smoke-404.md",
    },
    {
      "resource": "https://github.com/rulers/404-not-founds/blob/aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2/components/artworks/Smoke404.tsx",
    },
  ]
related_artworks: ["005"]
implementation_path: "components/artworks/Smoke404.tsx"
commit_sha: "aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2"
---

# 煙の素材と描画手法を分離する

## 背景・評価基準

[既存資料](../../doc/day-005-lost-in-smoke-404.md)のSource / licensingとTechnologyを読み直した記録。元の多人数討論や逐語ログは確認できないため、その再構成はしない。

## 選択肢と判断

- 採用：平面を重ねる描画の着想を参照し、自作ノイズから煙画像を生成する。
- 採用：固定視点の描画に必要な処理を作品専用WebGLへ限定し、Canvas代替を持つ。
- 不採用：元Penの外部PNGの使用・同梱・改変・再配布。個別の権利者と条件が確認できないため。
- 不採用：Three.js・Stats.jsの追加。既存環境にない依存をこの表現だけのために追加しない。

これは資料に明記された実装判断であり、新たなライセンス判定やユーザー承認ではない。

## トレードオフ・影響

元写真と同じ煙模様や本格的な体積散乱を保証しない。依存を抑え、素材の来歴を説明できる一方、独自WebGLとCanvasの両方を保守する。

## 後続・再利用

他作品でも「手法の参照」と「素材の再配布条件」を分ける。後から条件が判明しても自動採用せず、新しい判断を作りこの記録へリンクする。実機評価などの未解決事項は[作品005](../artworks/005.md)と既存資料を参照する。
