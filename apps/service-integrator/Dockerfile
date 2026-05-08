# Etapa de construcción
FROM node:20-alpine as build
WORKDIR /app
COPY apps/service-integrator/package*.json ./
RUN npm install
COPY apps/service-integrator/ .
RUN npm run build

# Etapa de producción
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
