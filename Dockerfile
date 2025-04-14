FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN npm install -g prisma
RUN pnpm install

COPY prisma ./prisma
COPY .env ./

# Ma'lumotlar bazasiga ulanishni tekshirish
RUN pnpm prisma generate
RUN pnpm prisma migrate dev --name init --skip-generate

COPY . .

RUN pnpm build

EXPOSE 4000

ENV DATABASE_URL="postgresql://postgres:3636@postgres:5432/lms_db"
ENV NODE_ENV="production"

CMD ["node", "dist/src/main"]