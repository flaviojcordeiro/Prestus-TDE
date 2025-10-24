FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

ENV PORT=3002
EXPOSE 3002

CMD ["npm", "start"]
