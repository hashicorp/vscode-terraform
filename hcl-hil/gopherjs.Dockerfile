FROM golang:1.12

RUN go get github.com/gopherjs/gopherjs
RUN go get github.com/hashicorp/hcl
RUN go get github.com/hashicorp/hil
RUN go get github.com/hashicorp/terraform/terraform

ADD main.go ./
# hack because of https://github.com/gopherjs/gopherjs/issues/875
ENV GOOS=linux
RUN gopherjs build main.go -o build.js -v

CMD ["cat", "build.js"]
