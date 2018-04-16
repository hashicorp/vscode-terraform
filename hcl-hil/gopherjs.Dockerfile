FROM golang:latest

RUN go get github.com/gopherjs/gopherjs
RUN go get github.com/hashicorp/hcl
RUN go get github.com/hashicorp/hil

ADD main.go ./
RUN gopherjs build main.go -o build.js

CMD ["cat", "build.js"]