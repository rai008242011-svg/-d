ORRERY Groq版（Vercel用）

ファイル構成
- index.html
- api/chat.js
- README.txt

セットアップ
1. ZIPを展開し、index.html と api フォルダをGitHubリポジトリの一番上に置きます。
2. Vercel → Project → Settings → Environment Variables を開きます。
3. Name に GROQ_API_KEY、Value にGroqで発行したAPIキーを登録します。キーはGitHubに絶対に載せないでください。
4. Productionを選択し保存。設定変更後は必ず再デプロイします。
5. 公開サイトを開き、「こんにちは」など短い質問でテストします。

任意のモデル設定
- 既定モデル: llama-3.3-70b-versatile
- モデルが利用できない場合はGroq Consoleで現在利用可能なモデルIDを確認し、Vercel環境変数 GROQ_MODEL に設定して再デプロイします。

確認事項
- このパッケージはHTML/JavaScript構文とファイル構成をローカル検査できますが、実際のGroq APIキーやVercelアカウントを使った本番接続テストは利用者側のデプロイ環境で必要です。
- 無料枠、モデル提供状況、レート制限は変更されることがあります。
