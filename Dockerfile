# Usamos una imagen de Node.js basada en "bookworm" que trae Python 3.11
# Cambiamos de 18 a 20 para que desaparezcan los warnings amarillos
FROM node:20-bookworm-slim

# Instalamos Python y FFmpeg (Vitales para que yt-dlp funcione)
RUN apt-get update && apt-get install -y python3 ffmpeg

# Creamos la carpeta donde vivirá tu app en el servidor
WORKDIR /app

# Copiamos los archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install

RUN npx youtube-dl-exec --update

# Copiamos todo el resto de tu código
COPY . .

# Compilamos TypeScript a JavaScript
RUN npx tsc

# Exponemos el puerto
EXPOSE 3000

# Comando para arrancar la API
CMD ["node", "dist/index.js"]
