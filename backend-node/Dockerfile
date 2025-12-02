FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario primero para cachear dependencias
COPY package*.json ./

# Instalamos dependencias de producción
RUN npm install --production

# Copiamos el resto del código del backend
COPY . .

ENV NODE_ENV=production

# Puerto donde escucha tu backend (coincide con src/server.js)
EXPOSE 3000

# Usa el script "start" que ya tienes en package.json
CMD ["npm", "start"]