// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as parser from '../../src/index/parser';
import * as build from '../../src/index/build';

import * as vscode from 'vscode';
import { Uri } from 'vscode';

suite("Index Tests", () => {
    suite("Build Tests", () => {
        const uri = vscode.Uri.parse("untitled:file");

        test("Collects typed sections", () => {
            const [ast, error] = parser.parseHcl(`resource "aws_s3_bucket" "bucket" {}`);

            let index = build.build(uri, ast);

            assert.equal(index.TypedSections.length, 1);

            let s = index.TypedSections[0];
            assert.equal(s.SectionType, "resource");

            let typeLocation = new vscode.Location(uri, new vscode.Range(0, 10, 0, 23));
            assert.equal(s.Type, "aws_s3_bucket");
            assert.deepEqual(s.TypeLocation, typeLocation, "type location");

            let nameLocation = new vscode.Location(uri, new vscode.Range(0, 26, 0, 32));
            assert.equal(s.Name, "bucket");
            assert.deepEqual(s.NameLocation, nameLocation, "name location");

            let location = new vscode.Location(uri, new vscode.Range(0, 0, 0, 35));
            assert.deepEqual(s.Location, location, "section location");
        });

        test("Collects untyped sections", () => {
            const [ast, error] = parser.parseHcl(`variable "region" {}`);

            let index = build.build(uri, ast);

            assert.equal(index.UntypedSections.length, 1);
            assert.equal(index.UntypedSections[0].SectionType, "variable");

            let nameLocation = new vscode.Location(uri, new vscode.Range(0, 10, 0, 16));
            assert.equal(index.UntypedSections[0].Name, "region");
            assert.deepEqual(index.UntypedSections[0].NameLocation, nameLocation, "name location");
        });
    });
});