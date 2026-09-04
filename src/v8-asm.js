"use strict"
import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { Executor } from "./executor.js";
import fs from "node:fs";


export default function compile(fileName) {
    let content = fs.readFileSync(fileName, "utf-8");
    const tokens = tokenize(content);
    const ast = parse(tokens);

    const vm = new Executor(ast);
    vm.run();
}
