// "use client";

import { getServerSession } from "next-auth";
import Book from "./components/Book";
import { getAllBooks } from "./lib/microcms/client";
import { BookType, Purchase } from "./types/types";
import { User } from "./types/types";
import { nextAuthOptions } from "./lib/next-auth/options";

// 疑似データ
const books = [
  {
    id: 1,
    title: "Book 1",
    thumbnail: "/thumbnails/discord-clone-udemy.png",
    price: 2980,
    author: {
      id: 1,
      name: "Author 1",
      description: "Author 1 description",
      profile_icon: "https://source.unsplash.com/random/2",
    },
    content: "Content 1",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  {
    id: 2,
    title: "Book 2",
    thumbnail: "/thumbnails/notion-udemy.png",
    price: 1980,
    author: {
      id: 2,
      name: "Author 2",
      description: "Author 2 description",
      profile_icon: "https://source.unsplash.com/random/3",
    },
    content: "Content 2",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  {
    id: 3,
    title: "Book 3",
    price: 4980,
    thumbnail: "/thumbnails/openai-chatapplication-udem.png",
    author: {
      id: 3,
      name: "Author 3",
      description: "Author 3 description",
      profile_icon: "https://source.unsplash.com/random/4",
    },
    content: "Content 3",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  // 他の本のデータ...
];

// eslint-disable-next-line @next/next/no-async-client-component
export default async function Home() {
  const{ contents } : { contents: BookType[] } = await getAllBooks();
  // SSRでセッションを受け取る方法　サーバーサイドでセッションを取得する方法：getServerSession
  const session = await getServerSession(nextAuthOptions);
  // as Userにすることでuserが存在する時だけUserの型を使う
  const user = session?.user as User;

  let purchaseBookIds : any;
  // ユーザーの購入履歴を取得するAPI
  if(user) {
    // useEffectだと初回レンダリングが遅くなる SSRでキャッシュしない　購入履歴はISRやSGのようにキャッシュする必要性はない
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRIPE_API_URL}/purchases/${user?.id}`,
      {cache: "no-store"} //SSR
    )
    const purchasesData = await response.json();
    purchaseBookIds = purchasesData.map((purchaseBook: Purchase) => (
      purchaseBook.bookId
    ))
  }
  return (
    <>
      <main className="flex flex-wrap justify-center items-center">
        <div className="relative h-auto w-full flex flex-wrap justify-center items-center md:pt-32 pt-20">
        <h2 className="text-center w-full font-bold text-xl mb-2">
          厳選 商品一覧
        </h2>
        {/* includesで購入履歴のbook.idの配列にincludesしている場合を判定してtrue/false */}
        {contents.map((book: BookType) => (
          // React.Memoを使用することでBookコンポーネントにpropsしているbookが更新・変更された時のみBookコンポーネントを再レンダリングするようにできる（ただし親コンポーネントからbookを変更しているわけでもないので、あまり意味がなく逆にMemo化することでオーバーヘッドが増えてしまう可能性もある）
          <Book 
          key={book.id} 
          book={book} 
          user={user}
          isPurchased={purchaseBookIds?.includes(book.id)}/>
        ))}
        <div className="h-[30vh] w-full"></div>
        </div>
      </main>
    </>
  );
}
