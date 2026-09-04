"use strict"

import { tokenType } from "./config.js";

class Token {
    constructor(tokenType, tokenValue) {
        this.type = tokenType;
        this.value = tokenValue;
    }
}
let tokens = [];

export function tokenize(rawCode) {
    // Clear tokens array to prevent duplicates from multiple tokenize() calls
    tokens = [];
    
    // Remove invisible control characters, Zero-Width spaces, and unexpected BOM marks
    // This cleans up the string before the while loop starts analyzing it.
    let code = rawCode.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00A0\u200B\uFEFF]/g, "");

    let i = 0;
    while (i < code.length) {
        if ("\n\t\r ".includes(code[i])) {
            i++;
            continue;
        } else if (isDigit(code[i])) {
            let number = "";

            while (i < code.length && isDigit(code[i])) {
                number += code[i];
                i++;
            }

            tokens.push(new Token(tokenType.NUMBER, Number(number)));
            continue;
        } else if (isValidStringChar(code[i])) {
            let string = "";

            while (i < code.length && isValidStringChar(code[i])) {
                string += code[i];
                i++;
            }

            tokens.push(new Token(tokenType.STRING, string));
            continue;
        } else if (isAlphaNumericalValue(code[i])) {
            if (code[i] === ".") {
                tokens.push(new Token(tokenType.FULLSTOP, "."));
            }
            else if (code[i] === ",") {
                tokens.push(new Token(tokenType.COMMA, ","));
            }
            else if (code[i] === ";") {
                while (i < code.length && code[i] !== "\n") { i++; }
                continue;
            }
            else if (code[i] === ":") {
                tokens.push(new Token(tokenType.COLON, ":"));
            } else {
                throw new Error("Invalid character " + code[i] + " found...");
            }
        } else if (code[i] === '"') {
            i++;
            let str = "";
            while (i < code.length && code[i] !== '"') {
                if (code[i] === '\\') {
                    if (code[i + 1] === "n") {
                        str += "\n";
                        i++;
                    } else if (code[i + 1] === "t") {
                        str += "\t";
                        i++;
                    } else if (code[i + 1] === "r") {
                        str += "\r";
                        i++;
                    }
                } else {
                    str += code[i];
                }
                i++;
            }
            tokens.push(new Token(tokenType.STRING, str));
            i++; // Skip the closing double quote
            continue;
        } else if (code[i] === "=") {
            tokens.push(new Token(tokenType.EQUALTO, "="));
        } else {
            throw new Error("Invalid character " + code[i] + " found...");
        }

        i++;
    }

    // Return tokens so callers can use the result directly rather than relying on module state
    return tokens;
}

export function getTokens() {
    return tokens;
}

export function isDigit(n) {
    return "0123456789".includes(n);
}

export function isValidStringChar(char) {
    // Allow letters, digits, and underscore in identifiers (fixes token-splitting of names like var1 or R0)
    return "abcdefghijklmnopqrstuvwxyz0123456789_".includes(char.toLowerCase());
}

export function isAlphaNumericalValue(char) {
    return "!@#$%^&*:;,.".includes(char);
}
