.PHONY: all

all: hcl-hil.js

transpiled.js: gopherjs.Dockerfile main.go
	docker build -t gopher-hcl-gopherjs -f gopherjs.Dockerfile .
	docker run --rm gopher-hcl-gopherjs > transpiled.js

hcl-hil.js: closure.Dockerfile transpiled.js
	docker build -t gopher-hcl-closure-compiler -f closure.Dockerfile .
	docker run --rm gopher-hcl-closure-compiler > hcl-hil.js