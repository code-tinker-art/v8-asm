"use strict"

import {tokenType, INSTRUCTIONS } from "./config.js";

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.hasStartedGlobalStart = false;
    }

    peek() {
        return this.tokens[this.current];
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.tokens[this.current - 1];
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }

    parse() {
        const program = [];

        while (!this.isAtEnd()) {
            const token = this.peek();

            if (token.type === tokenType.STRING && this.tokens[this.current + 1]?.type === tokenType.COLON) {
                const labelName = this.advance().value;
                this.advance();
                program.push({ type: "LABEL", name: labelName });
                continue;
            }

            if (token.type === tokenType.FULLSTOP) {
                this.advance();
                if (this.isAtEnd() || this.peek().type !== tokenType.STRING) {
                    throw new Error("Syntax Error: Expected directive name after '.'");
                }
                const directiveName = this.advance().value.toLowerCase();

                if (directiveName === "section_data") {
                    program.push({ type: "DIRECTIVE", name: "section_data" });
                } else if (directiveName === "global_start") {
                    this.hasStartedGlobalStart = true;
                    program.push({ type: "DIRECTIVE", name: "global_start" });
                } else {
                    throw new Error("Syntax Error: Invalid directive '." + directiveName + "'");
                }
                continue;
            }

            if (token.type === tokenType.STRING) {
                const valueUpper = token.value.toUpperCase();

                if (INSTRUCTIONS.has(valueUpper)) {
                    program.push(this.parseInstruction());
                    continue;
                } else if (this.tokens[this.current + 1]?.type === tokenType.EQUALTO) {
                    if (this.hasStartedGlobalStart) {
                        throw new Error("Syntax Error: Variable assignment '" + token.value + "' after '.global_start'");
                    }
                    const varName = this.advance().value;
                    this.advance();

                    const nextToken = this.peek();
                    if (this.isAtEnd() || (nextToken.type !== tokenType.NUMBER && nextToken.type !== tokenType.STRING)) {
                        throw new Error("Syntax Error: Expected a number or a string after '" + varName + " = '");
                    }

                    const varValue = this.advance().value;
                    program.push({ type: "VARIABLE_ASSIGNMENT", name: varName, value: varValue });
                    continue;
                }
            }
            throw new Error("Unexpected token at index " + this.current + ": " + JSON.stringify(token));
        }
        return program;
    }

    parseInstruction() {
        const opcodeToken = this.advance();
        const opcode = opcodeToken.value.toUpperCase();
        const operands = [];

        while (!this.isAtEnd()) {
            const nextToken = this.peek();
            if (nextToken.type === tokenType.STRING) {
                const nextValUpper = nextToken.value.toUpperCase();
                const isNextALabel = this.tokens[this.current + 1]?.type === tokenType.COLON;
                if (INSTRUCTIONS.has(nextValUpper) || isNextALabel) break;
            }
            if (nextToken.type === tokenType.FULLSTOP) break;
            if (nextToken.type === tokenType.COMMA) {
                this.advance();
                continue;
            }

            if (nextToken.type === tokenType.NUMBER || nextToken.type === tokenType.STRING) {
                const currentToken = this.advance();

                // If token is literal "R" and followed by a number token, merge them into a single string (e.g. "R0")
                if (currentToken.value === "R" && this.peek()?.type === tokenType.NUMBER) {
                    const regNumber = this.advance().value;
                    operands.push("R" + regNumber);
                } else {
                    operands.push(currentToken.value);
                }
            } else {
                break;
            }
        }
        return { type: "INSTRUCTION", opcode, operands };
    }
}

export function parse(tokens) {
    const parser = new Parser(tokens);
    return parser.parse();
}
