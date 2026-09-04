"use strict"

import { MEMORY_SIZE, noOfRegisters } from "./config.js";

export class Executor {
    constructor(ast) {
        this.ast = ast;
        this.pc = 0;
        this.registers = new Array(noOfRegisters).fill(0);
        this.memory = new Array(MEMORY_SIZE).fill(0);

        this.variables = {};
        this.labels = {};
        this.instructions = [];
        this.stack = [];
        this.registerStack = []; // Stack to preserve register values for function scopes only
        this.flagStack = []; // Stack to preserve equalFlag state for function scopes
        this.halted = false;
        this.equalFlag = false;

        this.memoryPointer = 0;
        this.init();
    }

    init() {
        let instructionIndex = 0;
        for (let node of this.ast) {
            if (node.type === "VARIABLE_ASSIGNMENT") {
                const { name, value } = node;

                if (typeof value === "string") {
                    this.variables[name] = this.memoryPointer;
                    for (let j = 0; j < value.length; j++) {
                        if (this.memoryPointer >= MEMORY_SIZE) throw new Error("Runtime Error: Out of Memory");
                        this.memory[this.memoryPointer] = value.charCodeAt(j);
                        this.memoryPointer++;
                    }
                    if (this.memoryPointer >= MEMORY_SIZE) throw new Error("Runtime Error: Out of Memory");
                    this.memory[this.memoryPointer] = 0;
                    this.memoryPointer++;

                } else if (typeof value === "number") {
                    this.variables[name] = this.memoryPointer;
                    this.memory[this.memoryPointer] = value;
                    this.memoryPointer++;
                }
            }
            else if (node.type === "LABEL") {
                this.labels[node.name] = instructionIndex;
            }
            else if (node.type === "INSTRUCTION") {
                this.instructions.push(node);
                instructionIndex++;
            }
        }
    }

    pushRegisters() {
        this.registerStack.push([...this.registers]);
    }

    popRegisters() {
        if (this.registerStack.length === 0) {
            throw new Error("Runtime Error: Register stack underflow");
        }
        this.registers = this.registerStack.pop();
    }

    pushFlag() {
        this.flagStack.push(this.equalFlag);
    }

    popFlag() {
        if (this.flagStack.length === 0) {
            throw new Error("Runtime Error: Flag stack underflow");
        }
        this.equalFlag = this.flagStack.pop();
    }

    resetRegisters() {
        this.registers.fill(0);
    }

    resolveValue(operand) {
        if (operand === undefined || operand === null) return 0;
        if (typeof operand === "number") return operand;
        if (typeof operand === "string") {
            if (operand.startsWith("R") && !isNaN(operand.slice(1))) {
                const idx = parseInt(operand.slice(1));
                if (idx < 0 || idx >= this.registers.length) throw new Error("Runtime Error: Invalid register " + operand);
                return this.registers[idx];
            }
            if (this.variables[operand] !== undefined) {
                const addr = this.variables[operand];
                return this.memory[addr];
            }
            if (!isNaN(operand)) return parseInt(operand);
        }
        throw new Error("Runtime Error: Undefined value '" + operand + "'");
    }

    setValue(operand, value) {
        if (typeof operand === "string") {
            if (operand.startsWith("R") && !isNaN(operand.slice(1))) {
                const idx = parseInt(operand.slice(1));
                if (idx < 0 || idx >= this.registers.length) throw new Error("Runtime Error: Invalid register " + operand);
                this.registers[idx] = value;
                return;
            } else if (this.variables[operand] !== undefined) {
                const addr = this.variables[operand];
                this.memory[addr] = value;
                return;
            } else if (!isNaN(operand)) {
                const addr = parseInt(operand);
                if (addr >= 0 && addr < MEMORY_SIZE) this.memory[addr] = value;
                return;
            }
        }
        throw new Error("Runtime Error: Cannot write to target '" + operand + "'");
    }

    run() {
        while (!this.halted && this.pc < this.instructions.length) {
            const inst = this.instructions[this.pc];
            this.pc++;
            this.execute(inst);
        }
    }

    execute(inst) {
        const { opcode, operands } = inst;

        switch (opcode) {
            case "MOV":
                this.setValue(operands[0], this.resolveValue(operands[1]));
                break;
            case "LOAD":
                this.setValue(operands[0], this.memory[this.resolveValue(operands[1])]);
                break;
            case "STORE": {
                const storeAddr = this.resolveValue(operands[0]);
                if (storeAddr >= 0 && storeAddr < MEMORY_SIZE) {
                    this.memory[storeAddr] = this.resolveValue(operands[1]);
                }
                break;
            }
            case "LOADI": {
                const ptrLoadAddr = this.resolveValue(operands[1]);
                if (ptrLoadAddr < 0 || ptrLoadAddr >= MEMORY_SIZE) {
                    throw new Error("Runtime Error: LOADI out of bounds at address " + ptrLoadAddr);
                }
                this.setValue(operands[0], this.memory[ptrLoadAddr]);
                break;
            }
            case "STOREI": {
                const ptrStoreAddr = this.resolveValue(operands[0]);
                if (ptrStoreAddr >= 0 && ptrStoreAddr < MEMORY_SIZE) {
                    this.memory[ptrStoreAddr] = this.resolveValue(operands[1]);
                } else {
                    throw new Error("Runtime Error: STOREI out of bounds at address " + ptrStoreAddr);
                }
                break;
            }
            case "ADD":
                this.setValue(operands[0], this.resolveValue(operands[1]) + this.resolveValue(operands[2]));
                break;
            case "SUB":
                this.setValue(operands[0], this.resolveValue(operands[1]) - this.resolveValue(operands[2]));
                break;
            case "MUL":
                this.setValue(operands[0], this.resolveValue(operands[1]) * this.resolveValue(operands[2]));
                break;
            case "DIV": {
                const divisor = this.resolveValue(operands[2]);
                if (divisor === 0) throw new Error("Runtime Error: Division by zero");
                this.setValue(operands[0], Math.floor(this.resolveValue(operands[1]) / divisor));
                break;
            }
            case "INCR":
                this.setValue(operands[0], this.resolveValue(operands[0]) + 1);
                break;
            case "DECR":
                this.setValue(operands[0], this.resolveValue(operands[0]) - 1);
                break;
            case "AND":
                this.setValue(operands[0], this.resolveValue(operands[1]) & this.resolveValue(operands[2]));
                break;
            case "NOT":
                this.setValue(operands[0], ~this.resolveValue(operands[1]));
                break;
            case "OR":
                this.setValue(operands[0], this.resolveValue(operands[1]) | this.resolveValue(operands[2]));
                break;
            case "XOR":
                this.setValue(operands[0], this.resolveValue(operands[1]) ^ this.resolveValue(operands[2]));
                break;
            case "CMPR":
                this.equalFlag = (this.resolveValue(operands[0]) === this.resolveValue(operands[1]));
                break;
            case "JMP":
                if (this.labels[operands[0]] === undefined) throw new Error("Runtime Error: Undefined label '" + operands[0] + "'");
                this.pc = this.labels[operands[0]];
                break;
            case "JMPE":
                if (this.equalFlag) {
                    if (this.labels[operands[0]] === undefined) throw new Error("Runtime Error: Undefined label '" + operands[0] + "'");
                    this.pc = this.labels[operands[0]];
                }
                break;
            case "JMPNE":
                if (!this.equalFlag) {
                    if (this.labels[operands[0]] === undefined) throw new Error("Runtime Error: Undefined label '" + operands[0] + "'");
                    this.pc = this.labels[operands[0]];
                }
                break;
            case "PUSH":
                this.stack.push(this.resolveValue(operands[0]));
                break;
            case "POP":
                if (this.stack.length === 0) throw new Error("Runtime Error: Stack Underflow");
                this.setValue(operands[0], this.stack.pop());
                break;
            case "CALL":
                if (this.labels[operands[0]] === undefined) throw new Error("Runtime Error: Undefined label '" + operands[0] + "'");
                this.stack.push(this.pc);
                this.pushRegisters();
                this.pushFlag();
                this.pc = this.labels[operands[0]];
                break;
            case "RET":
                if (this.stack.length === 0) throw new Error("Runtime Error: Stack Underflow on RET");
                this.popFlag();
                this.popRegisters();
                this.pc = this.stack.pop();
                break;
            case "NOP":
                break;
            case "HLT":
                this.halted = true;
                break;
            case "PRINT": {
                const target = operands[0];
                if (this.variables[target] !== undefined) {
                    let addr = this.variables[target];
                    let resultStr = "";
                    while (addr < MEMORY_SIZE && this.memory[addr] !== 0) {
                        resultStr += String.fromCharCode(this.memory[addr]);
                        addr++;
                    }
                    if (resultStr.length > 0) {
                        console.log(resultStr);
                    } else {
                        console.log(this.memory[this.variables[target]]);
                    }
                } else {
                    console.log(this.resolveValue(target));
                }
                break;
            }
            default:
                throw new Error("Runtime Error: Unknown Opcode '" + opcode + "'");
        }
    }
}
