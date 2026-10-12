# 北海道サッカーリーグ 公式サイト（試験公開）

GitHub Pages：https://hokkaidosl.github.io/hsl/

| 場所 | 中身 |
| --- | --- |
| `index.html` | 入口。`new/` へ移る（`?page=…` のときは大会運営システムの画面を開く。Webアプリの URL を `EXEC` に入れる） |
| `new/` | 公式サイト（トップ・大会記録・チーム・お知らせ・連盟について）。学連の新HP（jufa の `new/`）と同じ作りで、強調色だけ変えた（`new/theme.css` の `--accent` など。いまは仮の青） |
| `results/data/` | 大会記録のデータ（JSON）。大会運営システム（hsl-system の StaticSite.gs）、または `hsl-system/tools/build_site.py` が書き出す |

2026年度の北海道サッカーリーグは、北海道サッカー協会の公式記録PDFから読み取ったもの（hsl-system の `data/2026/TOP/`）。
