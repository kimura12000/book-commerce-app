import prisma from "@/app/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 購入履歴の保存 (購入履歴を使用して購入済みのアイテムの除外や購入商品の一覧表示などを行う)
export async function POST(request: Request, response: Response) {
    // 購入成功画面のURLからセッションIDを取得する
    const { sessionId } = await request.json();

    try { 
        const session = await stripe.checkout.sessions.retrieve(sessionId);
         // 購入履歴に既に同じbookIdがあるのなら実行しない
        const existingPurchase = await prisma.purchase.findFirst({
            where: {
                userId: session.client_reference_id!,
                bookId: session.metadata?.bookId!,
            }
        })
        if(!existingPurchase) {
            const purchase = await prisma.purchase.create({
                data: {
                    userId: session.client_reference_id!,
                    bookId: session.metadata?.bookId!,
                }
            });
            return NextResponse.json({ purchase });
        } else {
            return NextResponse.json("既に購入済みです。");
        }
    }
    catch(err) {
        console.log(err)
        return NextResponse.json(err);
    }
}