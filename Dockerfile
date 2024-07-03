FROM node:12.9.1-alpine as builder
USER root
ARG BASE_HREF
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
 
RUN npm install
COPY . /app
RUN npm run build -- --prod --aot --base-href /IdraPortal/
 
FROM nginx
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html