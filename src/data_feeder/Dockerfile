FROM node:22-alpine

WORKDIR /app
COPY ./src/data_feeder/package*.json .
RUN npm install
COPY ./src/data_feeder .

EXPOSE 80

CMD ["node", "index.js"]
