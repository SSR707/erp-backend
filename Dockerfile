# 1. Rasmiy Node.js image asosida
FROM node:18-alpine

# 2. App papkasi yaratamiz
WORKDIR /app

# 3. package.json va pnpm-lock.json'ni nusxalaymiz
COPY package.json pnpm-lock.yaml ./

# 4. pnpm o'rnatamiz
RUN npm install -g pnpm

# 5. Kutubxonalarni o'rnatamiz
RUN pnpm install

# 6. Avval Prisma papkasini nusxalaymiz
COPY prisma ./prisma

COPY .env /app/.env


# 7. Prisma klientini generatsiya qilish (faqat bir marta)
RUN npx prisma generate

# 8. Qolgan fayllarni nusxalaymiz
COPY . .

# 9. NestJS build qilamiz
RUN pnpm build

# 10. Port ochamiz
EXPOSE 4000

# 11. Muhit o'zgaruvchilarini sozlaymiz
ENV DATABASE_URL="postgresql://postgres:3636@postgres:5432/lms_db"
ENV NODE_ENV="production"

# 12. App'ni ishga tushiramiz
CMD ["node", "dist/src/main"]