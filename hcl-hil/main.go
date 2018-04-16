package main

import (
	"github.com/gopherjs/gopherjs/js"
	"github.com/hashicorp/hcl"
	"github.com/hashicorp/hil"
	"github.com/hashicorp/hil/ast"
)

func parseHcl(v string) (interface{}, error) {
	return hcl.ParseString(v)
}

func parseHilWithPosition(v string, column, line int, filename string) (interface{}, error) {
	return hil.ParseWithPosition(v, ast.Pos{
		Column:   column,
		Line:     line,
		Filename: filename,
	})
}

func main() {
	exports := js.Module.Get("exports")
	exports.Set("parseHcl", parseHcl)
	exports.Set("parseHil", parseHilWithPosition)
}
