FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
