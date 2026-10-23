# Une seule image : le front React est compilé puis servi par Express avec l'API.

# 1. Compilation du front
FROM node:20-alpine AS front
WORKDIR /front
COPY front/package*.json ./
RUN npm install
COPY front/ .
RUN npm run build

# 2. API + front compilé
FROM node:20-alpine
WORKDIR /app/api
COPY api/package*.json ./
RUN npm install --omit=dev
COPY api/ .
COPY --from=front /front/dist /app/front/dist
RUN mkdir -p uploads && chown node:node uploads
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node
CMD ["node", "src/index.js"]
