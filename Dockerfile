FROM node:12.9.0-alpine as builder
ARG BASE_HREF
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app

 

RUN npm install
COPY . /app
RUN npm run build -- --prod --aot --base-href $BASE_HREF
# RUN npm run build:prod --aot --base-href $BASE_HREF
 

FROM nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY adapt-config-json.sh /adapt-config-json.sh
RUN chmod 775 /*.sh

EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm /usr/share/nginx/html/assets/config.json

ENV DASHBOARD_BASE_URL=http://localhost:4200 \
    IDM_BASE_URL=http://localhost:8081 \
	TRAFFIC_PREDICTION_API_BASE_URL=http://localhost:8000/urbanite_traffic \
	BIKE_ANALYSIS_API_BASE_URL=http://localhost:8000/bikeAnalysis \
	IDRA_BASE_URL=http://localhost:8080 \
	DATALET_BASE_URL=http://localhost/deep/deep-components/creator.html
	