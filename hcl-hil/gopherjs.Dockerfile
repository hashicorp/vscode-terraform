FROM golang:1.16

WORKDIR /go/src/app

ADD go.mod ./
ADD go.sum ./
ADD main.go ./

RUN go install github.com/gopherjs/gopherjs
RUN go mod vendor

RUN GOPHERJS_GOROOT="$(go env GOROOT)" gopherjs build main.go -o build.js -v

CMD ["cat", "build.js"]
