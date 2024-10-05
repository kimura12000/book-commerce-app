import { getDetailBook } from "@/app/lib/microcms/client";
import Image from "next/image";
import React from "react";

const DetailBook = async ({params}: { params: {id: string} }) => {
    // SSRする。paramsでURLのidパラメーターを取得可能(server component)
    const book = await getDetailBook(params.id);
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <Image
          className="w-full h-full object-cover object-center"
          src={`${book?.thumbnail.url}`}
          alt="bookImg"
          width={700}
          height={700}
        />
        <div className="p-4">
          <h2 className="text-2xl font-bold">{book?.title}</h2>
          <div
            className="text-gray-700 mt-2"
            dangerouslySetInnerHTML={{ __html: `${book?.content}` }}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">公開日:{book?.publishedAt && new Date(book.publishedAt).toLocaleString('ja-JP')}</span>
            <span className="text-sm text-gray-500">最終更新:{book?.updatedAt && new Date(book.updatedAt).toLocaleString('ja-JP')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailBook;