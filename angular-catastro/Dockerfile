# Multi-stage build optimizado para Raspberry Pi (ARM)
# Stage 1: Build de Angular
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (incluye devDependencies necesarias para el build)
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción con base href /herencia/
RUN npm run build -- --configuration production --base-href /herencia/

# Stage 2: Servidor Nginx
FROM nginx:alpine

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist/angular-catastro /usr/share/nginx/html/herencia

# Copiar página de limpieza de caché
COPY clear-sw.html /usr/share/nginx/html/clear-sw.html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/herencia/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
