# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code（および開発者）向けのガイドです。ユーザー向けの説明は `README.md` を参照してください。

## 概要

microCMS で管理する本（記事）を一覧表示し、GitHub ログイン済みユーザーが Stripe Checkout で購入できる Next.js 14 (App Router) アプリ。購入履歴は Prisma + PostgreSQL の `Purchase` テーブルに保存し、購入済み判定とプロフィールの購入一覧に使う。UI 文言・コメントは日本語。

## コマンド

```bash
npm run dev      # 開発サーバー (localhost:3000)
npm run build    # prisma generate && next build
npm run lint     # next lint (next/core-web-vitals)
npx prisma migrate dev --name <name>   # スキーマ変更時のマイグレーション作成
npx prisma generate                    # Prisma Client 再生成
```

テストフレームワークは導入されていない。変更後は最低限 `npm run lint` と `npx tsc --noEmit` で確認する（`npm run build` は DB・外部サービスの環境変数が必要）。

## アーキテクチャ

- **データの出どころが 2 つある**
  - 本の情報 → microCMS（`app/lib/microcms/client.ts` の `getAllBooks` / `getDetailBook`、エンドポイント `bookcommerce`）
  - ユーザー・セッション・購入履歴 → PostgreSQL（`app/lib/prisma.ts` のシングルトン PrismaClient）
  - 両者は `Purchase.bookId` = microCMS のコンテンツ ID で紐づく（外部キー制約なし）。
- **認証**: `app/lib/next-auth/options.ts`。GitHub Provider + PrismaAdapter（database セッション）。`session` コールバックで `session.user.id` を追加しているため、サーバー側では `getServerSession(nextAuthOptions)` → `session?.user as User` で `id` を取得する（型は `app/types/types.ts` の `User`）。
- **決済フロー**
  1. `components/Book.tsx`（Client）がクリック → モーダル → `POST ${NEXT_PUBLIC_STRIPE_API_URL}/checkout`
  2. `api/checkout/route.ts` が Stripe セッションを作成（`metadata.bookId`、`client_reference_id = userId`）
  3. 成功時 `/book/checkout-success?session_id=...` → `POST /api/checkout/success` が Stripe セッションを取得して `Purchase` を作成（重複チェックあり）
- **レンダリング方針**（`client.ts` のコメントに記載の方針に従う）
  - 頻繁に変わらない商品一覧 → ISR（`next: { revalidate: 3600 }`）
  - 即時反映が必要な購入履歴 → `cache: "no-store"`（SSR）
  - 本の詳細 → 現状 `cache: "no-store"`
- **セッション取得はサーバー側で行う**: `Header.tsx`・`page.tsx`・`profile/page.tsx` は `getServerSession` を使う。`Book.tsx` は一覧で多数描画されるため `useSession` を使わず、親から `user` を props で受け取る（コメント参照）。この方針を崩さないこと。
- サーバーコンポーネントからも自アプリの API を `fetch(`${process.env.NEXT_PUBLIC_STRIPE_API_URL}/purchases/${user.id}`)` の絶対 URL で呼んでいる。`NEXT_PUBLIC_STRIPE_API_URL` は名前に反して「自アプリの `/api` のベース URL」。

## 環境変数

`.env` に置く（`.gitignore` 済み）。詳細は README 参照。

`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SERVICE_DOMAIN`, `NEXT_PUBLIC_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STRIPE_API_URL`

## コーディング規約・注意点

- パスエイリアス `@/*` はリポジトリルート（例: `@/app/lib/prisma`）。
- スタイルは Tailwind CSS。アニメーション等の局所 CSS は `styled-jsx`（`<style jsx>`）を使用している。
- 外部画像を `next/image` で表示する場合は `next.config.js` の `images.remotePatterns` にホストを追加する（現在は `avatars.githubusercontent.com` と `images.microcms-assets.io`）。
- `reactStrictMode: false`。
- microCMS の API キー（`NEXT_PUBLIC_API_KEY`）を使う `client.ts` はクライアントコンポーネントから import しないこと（キーがバンドルに含まれる）。
- `prisma/schema.prisma` を変更したら必ずマイグレーションを作成し、`prisma/migrations/` をコミットする。NextAuth 用モデルは `@@map` / `@map` で snake_case のテーブル・カラム名にマップされている（`Purchase` はマップなし）。
- `app/page.tsx` の `books` 定数は初期実装時の疑似データで、現在は未使用。

## 既知の課題（修正時の参考）

- `/book/[id]` に購入済みチェックがない（未購入でも本文を閲覧可能）。
- 購入履歴の保存が決済完了ページ依存で、Stripe Webhook を使っていない。
- `/api/checkout`・`/api/purchases/[userId]` がサーバー側でセッションを検証していない（クライアントから送られた `userId` をそのまま信頼）。
- `/api/checkout` で `price` をクライアントから受け取っている（改ざん可能）。サーバー側で microCMS から価格を取得するのが望ましい。
- `app/login/page.tsx` が async な Client Component になっている（eslint-disable で回避）。
- `profile/page.tsx` のデフォルトアイコン `/default_icon.png` が `public/` に存在しない。未ログインでも `/profile` にアクセスできる。
- API のエラー時もステータス 200 で `NextResponse.json(err)` を返している。
