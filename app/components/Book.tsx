"use client";

import Image from "next/image";
import Link from "next/link";
import { BookType, User } from "../types/types";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { title } from "process";

type BookProps = {
    book: BookType;
    isPurchased: boolean;
    user: User;
}

// eslint-disable-next-line react/display-name
const Book = ({ book, isPurchased, user }: BookProps) => {
    const [showModal, setShowModal] = useState(false);
    // BookコンポーネントはMapされており5回呼び出されている。その度にuseSessionが呼び出されているのでパフォーマンス的に×
    // const {data: session} = useSession();
    // const user : any = session?.user;
    const router = useRouter();

    const startCheckout = async() => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_STRIPE_API_URL}/checkout`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    title: book.title,
                    price: book.price,
                    // 購入履歴保存のため
                    // bookId: book.id,
                    userId: user?.id,
                    bookId: book.id,
                    // bookId: "testName5678",
                })
            })
            const responseData = await response.json();
            if(responseData) {
                router.push(responseData.checkout_url);
            }
            
        } catch(err) {
            console.error(err);
        }
    }

    const handleCancel = () => {
        setShowModal(false);
    }
    const handlePurchase = () => {
      if(isPurchased) {
        alert('購入済みの商品です。')
      } else {
        setShowModal(true);
      }
    }

    const handlePurchaseConfirm = () => {
        if(!user) {
            setShowModal(false);
            router.push("/login");
        } else {
            // Stripeで決済する
            startCheckout();
        }
    }
  return (
    <>
      {/* アニメーションスタイル */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .modal {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center m-4">
        <a onClick={handlePurchase} className="cursor-pointer shadow-2xl duration-300 hover:translate-y-1 hover:shadow-none">
          <Image
            priority
            src={book.thumbnail?.url}
            alt={book.title}
            width={450}
            height={350}
            className="rounded-t-md"
          />
          <div className="px-4 py-4 bg-slate-100 rounded-b-md">
            <h2 className="text-lg font-semibold">{book.title}</h2>
            <p className="mt-2 text-lg text-slate-600">{book.content.slice(0, 20)}</p>
            <p className="mt-2 text-md text-slate-700">値段：{book.price}円</p>
          </div>
        </a>

        {showModal && 
        <>
        <div onClick={handleCancel} className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-slate-900 bg-opacity-50 z-10"></div>
        <div className="absolute w-screen h-screen top-0 left-0 right-0 bottom-0 flex justify-center items-center modal z-50 pointer-events-none">
            <div className="bg-white p-8 rounded-lg relative z-50 pointer-events-auto">
            <h3 className="text-xl mb-4">本を購入しますか？</h3>
            <button onClick={handlePurchaseConfirm} type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
                購入する
            </button>
            <button onClick={handleCancel} type="button" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                キャンセル
            </button>
            </div>
        </div>
        </>
}
      </div>
    </>
  );
};

export default Book;