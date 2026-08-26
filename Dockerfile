
FROM node:22-alpine AS desec-proxy

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package*.json ./

COPY ./src .

RUN npm ci

CMD ["node", "index.js"]
