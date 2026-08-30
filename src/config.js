//making a enum like data structure
export const tokenType = {
    "STRING": 0,
    "NUMBER": 1,
    "COMMA": 2,
    "SEMICOLON": 3,
    "COLON": 4,
    "FULLSTOP": 5,
    "EQUALTO": 6
};


export const INSTRUCTIONS = new Set([
    "MOV", "LOAD", "STORE", "LOADI", "STOREI",
    "ADD", "SUB", "MUL", "DIV", "INCR", "DECR",
    "AND", "NOT", "OR", "XOR", "CMPR",
    "JMP", "JMPE", "JMPNE",
    "PUSH", "POP", "CALL", "RET", "NOP", "HLT", "PRINT"
]);

export let MEMORY_SIZE = 0xFFF;
export let noOfRegisters = 7;