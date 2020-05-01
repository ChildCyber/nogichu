FROM node:10

WORKDIR /app

COPY . /app

RUN npm install --registry=https://registry.npm.taobao.org

EXPOSE 3000

ENTRYPOINT ["npm", "run"]

CMD ["server"]