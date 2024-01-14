# syntax=docker/dockerfile:1

# ---- build -----------------------------------------------------------------
# Create React App inlines REACT_APP_* at build time, so the API base URL is a
# build argument rather than a runtime environment variable. Rebuild the image
# to point the client at a different API.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ARG REACT_APP_API_BASE_URL=""
ARG REACT_APP_PAGE_SIZE=8
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL \
    REACT_APP_PAGE_SIZE=$REACT_APP_PAGE_SIZE \
    GENERATE_SOURCEMAP=false

COPY public ./public
COPY src ./src
RUN npm run build

# ---- serve -----------------------------------------------------------------
FROM nginx:1.27-alpine AS serve

# nginx's own config expects to write a pid and caches as root. Point both at
# paths the unprivileged user owns so the container can drop privileges.
RUN mkdir -p /var/cache/nginx /var/run/nginx \
 && chown -R nginx:nginx /var/cache/nginx /var/run/nginx /usr/share/nginx/html

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/build /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
