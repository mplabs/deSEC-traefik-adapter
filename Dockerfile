
FROM node:13.13-alpine as desec-proxy

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package*.json ./

COPY ./src .

RUN npm ci

CMD ["node", "index.js"]
