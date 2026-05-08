# Etapa de construcción
FROM node:20-alpine as build
# Instalación de dependencias para libxmljs2 si fuera necesario compilación nativa
RUN apk add --no-cache python3 make g++ 
WORKDIR /app
COPY apps/service-reports/package*.json ./
RUN npm install
COPY apps/service-reports/ .
RUN npm run build

# Etapa de producción
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
