FROM httpd:alpine
ADD ./public_html /usr/local/apache2/htdocs
ADD ./conf/httpd.conf /usr/local/apache2/httpd.conf
EXPOSE 8080
