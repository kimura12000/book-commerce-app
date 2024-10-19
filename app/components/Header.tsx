import { getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { nextAuthOptions } from "../lib/next-auth/options";
import { User } from "../types/types";

const Header = async() => {
  // useSessionで取得するとヘッダーのアイコン表示が遅くなる。SSRで取得すると速くなる？
    // const {data: session} = useSession();
    // const user = session?.user;

    // SSRを使用することでuserアイコンの表示が速くなった
    const session = await getServerSession(nextAuthOptions);
    const user = session?.user as User;

  return (
    <header className="bg-black text-gray-100 shadow-lg">
      <nav className="flex items-center justify-between p-4">
        <Link href={"/"} className="text-xl font-bold">
          神田 下久呉服店 Online Shop
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            ホーム
          </Link>
          <Link
            href={user ? "/profile" : "/login"}
            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            {user ? "プロフィール" : "ログイン"}
          </Link>

          {user ? 
          <Link href={"/api/auth/signout"}
          // onClick={()=> signOut({ callbackUrl: "/login" })} 
          className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            ログアウト
            </Link> : ""}

          <Link href={`/profile`} className="h-full">
            <Image
              width={50}
              height={50}
              alt="profile_icon"
              src={user?.image || "/vercel.svg"}
              className="bg-white rounded-full"
            />
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;