FROM node:22-alpine

WORKDIR /common
COPY ./src/common/package*.json .
RUN npm install
COPY ./src/common .

WORKDIR /app
COPY ./src/data_feeder/package*.json .
RUN npm install
COPY ./src/data_feeder .

EXPOSE 80

CMD ["node", "index.js"]
