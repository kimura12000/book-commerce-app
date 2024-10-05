import { BookType } from '@/app/types/types';
import { createClient } from 'microcms-js-sdk';

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,  // service-domain は https://XXXX.microcms.io の XXXX 部分
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

export const getAllBooks = async() => {
    const allBooks = await client.getList<BookType>({
        endpoint: 'bookcommerce',
        queries: { limit: 100 }
        // contentId: '9sc6wwwss',
    })
    return allBooks;
};

export const getDetailBook = async (contentId: string) => {
  const detailBook = await client.getListDetail<BookType>({
    endpoint: "bookcommerce",
    contentId
  });
  return detailBook;
}