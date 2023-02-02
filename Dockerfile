FROM node:14

RUN mkdir /app
WORKDIR /app

COPY package.json /app
RUN yarn install

COPY . /app
RUN yarn build:prod

EXPOSE 8080

CMD ["node", "./build/server.js"]