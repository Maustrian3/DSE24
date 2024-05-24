FROM node:22-alpine

WORKDIR /common
COPY ./src/common/package*.json .
RUN npm install
COPY ./src/common .

WORKDIR /app
COPY ./src/control_service/package*.json .
RUN npm install
COPY ./src/control_service .

EXPOSE 80

CMD ["node", "index.js"]
