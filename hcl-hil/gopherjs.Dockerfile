FROM golang:latest

RUN go get github.com/gopherjs/gopherjs
RUN go get github.com/hashicorp/hcl
RUN go get github.com/hashicorp/hil
RUN go get github.com/hashicorp/terraform/terraform

ADD main.go ./
RUN gopherjs build main.go -o build.js -v

CMD ["cat", "build.js"]