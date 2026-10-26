FROM node:20-alpine

LABEL version="8.2.0"
LABEL description="JstudioPlay Pro v8.2.0"

WORKDIR /app

# Compiladores necessários para better-sqlite3 (módulo nativo C++)
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
