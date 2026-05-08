# Etapa 1: Construcción
FROM node:20-alpine as build
RUN npm install -g npm@latest
WORKDIR /app
COPY apps/web-angular/package*.json ./
RUN npm install
COPY apps/web-angular/ .
RUN npm run build -- --configuration production

# Etapa 2: Servidor de producción
FROM nginx:stable-alpine
COPY --from=build /app/dist/web-angular/browser /usr/share/nginx/html
# Configuración personalizada de Nginx para Angular (SPA routing)
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
