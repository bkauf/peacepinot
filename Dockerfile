FROM httpd:alpine
ADD ./public_html /usr/local/apache2/htdocs

EXPOSE 8080
