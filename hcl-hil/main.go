package main

import (
	"github.com/gopherjs/gopherjs/js"
	"github.com/hashicorp/hcl"
	hclParser "github.com/hashicorp/hcl/hcl/parser"
	hclToken "github.com/hashicorp/hcl/hcl/token"
	"github.com/hashicorp/hil"
	"github.com/hashicorp/hil/ast"
	"github.com/hashicorp/hil/parser"
)

type hclError struct {
	Pos *hclToken.Pos
	Err string
}

func parseHcl(v string) (interface{}, *hclError) {
	result, err := hcl.ParseString(v)

	if err != nil {
		if pErr, ok := err.(*hclParser.PosError); ok {
			return nil, &hclError{
				Pos: &pErr.Pos,
				Err: pErr.Err.Error(),
			}
		}

		return result, &hclError{
			Pos: nil,
			Err: err.Error(),
		}
	}

	return result, nil
}

type hilError struct {
	Pos *ast.Pos
	Err string
}

func parseHilWithPosition(v string, column, line int, filename string) (interface{}, *hilError) {
	result, err := hil.ParseWithPosition(v, ast.Pos{
		Column:   column,
		Line:     line,
		Filename: filename,
	})

	if err != nil {
		if pErr, ok := err.(*parser.ParseError); ok {
			return nil, &hilError{
				Pos: &pErr.Pos,
				Err: pErr.String(),
			}
		}

		return nil, &hilError{
			Pos: nil,
			Err: err.Error(),
		}
	}

	return result, nil
}

// type goError struct {
// 	Err string
// }

// func readPlan(v []uint8) (interface{}, *goError) {
// 	reader := bytes.NewReader(v)

// 	plan, err := terraform.ReadPlan(reader)
// 	if err != nil {
// 		return nil, &goError{Err: err.Error()}
// 	}

// 	return plan, nil
// }

func main() {
	exports := js.Module.Get("exports")
	exports.Set("parseHcl", parseHcl)
	exports.Set("parseHil", parseHilWithPosition)
}
