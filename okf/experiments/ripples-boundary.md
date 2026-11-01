---
id: "experiments/ripples-boundary"
type: "Experiment"
title: "風の境界減速と長時間の移流"
description: "端で止まった葉が逆風で戻れ、水面が長時間後も飛ばない条件。"
status: "draft"
created: "2026-11-01T10:01:46Z"
updated: "2026-11-01T10:01:46Z"
tags: ["canvas", "wind", "regression"]
sources:
  [
    {
      "resource": "https://github.com/rulers/404-not-founds/blob/aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2/doc/day-009-ripples.md",
    },
    {
      "resource": "https://github.com/rulers/404-not-founds/blob/aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2/tests/ripples404.test.ts",
    },
    { "resource": "https://github.com/rulers/404-not-founds/pull/16" },
  ]
related_artworks: ["009"]
implementation_path: "lib/ripples404.ts"
commit_sha: "aa98d4bfcd4390bf4c66e6fb37a42cb365e740d2"
---

# 風の境界減速と長時間の移流

## 目的・仮説

位置だけで葉を減速すると逆風でも端に張り付く。外向き速度だけを抑えれば、同じ葉を内側へ戻せる。
水面の移流を「経過時間×現在の風向」ではなく速度の積算にすれば、長時間後の方向反転で模様が跳ばない。

## 技術・最小検証

TypeScriptのモデルとNode.js単体テスト。元PRの環境・結果は[PR #16](https://github.com/rulers/404-not-founds/pull/16)、現在の再現手順は次の通り。

```sh
node --experimental-strip-types --test tests/ripples404.test.ts
```

[テスト](../../tests/ripples404.test.ts)は4画面サイズ×4方向の600秒送風、追加10秒の保持、4秒の逆風で同一の葉の境界内復帰を確認する。別のケースで600秒後の反転時の移流差分と、位相が極端に古いモデルと新しいモデルの移流一致を確認する。

## 記録された結果・失敗と対処

[技術資料](../../doc/day-009-ripples.md)に端への張り付きと水面の急な回転・移動への対処が記録されている。PR #16の最新CI報告は単体39件・E2E103件成功。これは過去のPR報告で、今回この実験を実行したという意味ではない。
ブラウザで2分の描画を早送りする試験は時間上限に達し、30秒の送風へ短縮。10分の安定性はモデル試験で維持する。

## 性能・互換性・アクセシビリティ

モデル試験はGPU描画性能や実端末の触感を証明しない。Canvasは約30fpsを目標とし、reduced-motionの空間移動停止も単体対象。実機Safari／Androidと性能計測は未確認。

## 再利用

方向別の境界減速、共通の環境と物体の慣性の分離、長時間後の反転を含む数値検証を、漂流・スクロール演出などの候補にできる。別作品での採用・検証はまだ行っていない。

[作品009](../artworks/009.md)に戻る。
