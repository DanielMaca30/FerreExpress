# Etapa 1: build de Vite/React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build          # usa tu script de build de Vite

# Etapa 2: servir el build con Nginx
FROM nginx:alpine

# Copiamos el build generado por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# ⬇️ Sobrescribimos la config por defecto de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
