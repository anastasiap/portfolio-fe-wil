# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Accept Sentry token as build argument
ARG SENTRY_AUTH_TOKEN

# Make it available as environment variable during build
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

COPY package*.json ./
RUN npm ci

COPY . .

# Your build flow:
# 1) build:ssr (Angular Universal build step, but runtime is NOT SSR)
# 2) prerender (produces static html)
RUN npm run build:ssr
RUN npm run prerender

# ---- runtime stage (static hosting) ----
FROM nginx:1.27-alpine AS runtime

# Optional: custom nginx config (recommended)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy prerendered static output into nginx html folder.
COPY --from=build /app/dist/wheeloflife/browser/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
