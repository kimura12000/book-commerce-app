import { BookType } from '@/app/types/types';
import { createClient } from 'microcms-js-sdk';

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,  // service-domain は https://XXXX.microcms.io の XXXX 部分
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});


// SSRかISRかの判断　購入履歴のように即座に反映されるべきものはSSRで実装し、購入対象の商品の全件取得や詳細ページのように更新が頻繁でない時はISRとする

export const getAllBooks = async() => {
    const allBooks = await client.getList<BookType>({
        endpoint: 'bookcommerce',
        queries: { limit: 100 },
        // SSRのために必要 (microCMSより)　force-cacheにすることでSSGやISRとなる
        customRequestInit: {
          next: {
            // ISRに必要　秒数は3600秒（１時間ごとに再検証）
            revalidate: 3600
          }
        }
        // contentId: '9sc6wwwss',
    })
    return allBooks;
};

export const getDetailBook = async (contentId: string) => {
  const detailBook = await client.getListDetail<BookType>({
    endpoint: "bookcommerce",
    contentId,
    // SSRのために必要 (microCMSより)
    customRequestInit: {
      cache: "no-store",
    }
  });
  return detailBook;
}