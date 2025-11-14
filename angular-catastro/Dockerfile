# Stage 1: Build de la aplicación Angular
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Build de producción con base-href para subpath
RUN npm run build -- --base-href=/gestion-herencia/

# Stage 2: Servir con nginx
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=builder /app/dist/angular-catastro /usr/share/nginx/html/gestion-herencia

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
