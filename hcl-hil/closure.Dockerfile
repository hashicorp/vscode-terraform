FROM openjdk:alpine

RUN apk add --no-cache curl
RUN curl -L http://dl.google.com/closure-compiler/compiler-latest.tar.gz | tar xz

ADD transpiled.js transpiled.js
CMD java -Xms1024m -Xmx2048m -jar closure-compiler-v*.jar --js transpiled.js --language_in ECMASCRIPT5_STRICT --language_out ECMASCRIPT5_STRICT --jscomp_off '*'
