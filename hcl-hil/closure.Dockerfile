FROM openjdk:alpine

WORKDIR /usr/src/app

RUN apk add --no-cache curl
RUN curl -L https://repo1.maven.org/maven2/com/google/javascript/closure-compiler/v20210505/closure-compiler-v20210505.jar > ./closure-compiler.jar

ADD transpiled.js transpiled.js
CMD java -Xms1024m -Xmx2048m -jar ./closure-compiler.jar --js transpiled.js --language_in ECMASCRIPT5_STRICT --language_out ECMASCRIPT5_STRICT --jscomp_off '*'
