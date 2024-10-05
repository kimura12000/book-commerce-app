import {PrismaClient} from "@prisma/client"
// グローバルオブジェクト（シングルトン）を作成して一度だけプリズマクライアントが作成されるようにする
// ホットリロードされるたびにPrismaClientが作成されるとパフォーマンスに影響するため

let prisma: PrismaClient;
const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
}

if(!globalForPrisma.prisma){
    globalForPrisma.prisma = new PrismaClient();
}
prisma = globalForPrisma.prisma;

export default prisma;