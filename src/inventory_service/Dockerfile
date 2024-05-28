FROM node:22-alpine

RUN apk add --update --no-cache mysql-client

WORKDIR /common
COPY ./src/common/package*.json .
RUN npm install
COPY ./src/common .

WORKDIR /app
COPY ./src/inventory_service/package*.json .
RUN npm install
COPY ./src/inventory_service .

EXPOSE 80

CMD ["node", "index.js"]

# Run the tests
CMD ["npm", "test"]