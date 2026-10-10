FROM node:20-alpine

WORKDIR /app

# Instala ferramentas necessárias para compilação nativa (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Instalação de dependências
COPY package*.json ./
RUN npm install --omit=dev

# Copia código-fonte da aplicação
COPY . .

# Garante pasta de dados com permissão
RUN mkdir -p /app/data

EXPOSE 3030

ENV NODE_ENV=production
ENV PORT=3030

CMD ["node", "server/index.js"]
