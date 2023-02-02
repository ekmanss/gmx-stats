FROM node:14

RUN mkdir /app
WORKDIR /app

COPY package.json /app
RUN yarn install

COPY . /app
RUN yarn build

EXPOSE 3113

CMD ["yarn", "start"]