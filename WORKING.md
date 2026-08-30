Executor Instruction Execution
==============================

1\. How the Executor Executes Instructions
------------------------------------------

The `Executor` class executes instructions that have already been parsed from the Markdown (`.md`) source file into an Abstract Syntax Tree (AST).

The execution process is:

    MD File
       ↓
    Parser
       ↓
    AST
       ↓
    Executor.init()
       ↓
    instructions[]
       ↓
    Executor.run()
       ↓
    Fetch instruction using PC
       ↓
    Increment PC
       ↓
    Executor.execute()
       ↓
    Execute instruction based on opcode
    

The `Executor` maintains the following important components:

*   `pc` — Program Counter. Stores the index of the next instruction to execute.
*   `registers` — Stores register values such as `R0`, `R1`, `R2`, etc.
*   `memory` — Simulated memory of size `MEMORY_SIZE`.
*   `variables` — Maps variable names to memory addresses.
*   `labels` — Maps label names to instruction indexes.
*   `instructions` — Contains executable instructions extracted from the AST.
*   `stack` — Used by `PUSH`, `POP`, `CALL`, and `RET`.
*   `equalFlag` — Stores the result of the most recent `CMPR`.
*   `halted` — Determines whether execution should stop.

* * *

2\. Loading Instructions from the MD File
=========================================

The parser converts instructions from the MD file into AST nodes.

For example:

    MOV R1, 5
    ADD R2, R1, 10
    HLT
    

will become:

    [
        {
            type: "INSTRUCTION",
            opcode: "MOV",
            operands: ["R1", 5]
        },
        {
            type: "INSTRUCTION",
            opcode: "ADD",
            operands: ["R2", "R1", 10]
        },
        {
            type: "INSTRUCTION",
            opcode: "HLT",
            operands: []
        }
    ]
    

During `init()`, every node whose type is `INSTRUCTION` is added to the `instructions` array.

    this.instructions.push(node);
    instructionIndex++;
    

Labels are not added to `instructions`. Instead, their instruction index is stored in `labels`.

* * *

3\. Main Execution Loop
=======================

Execution starts when:

    run()
    

is called.

The execution loop is:

    while (!this.halted && this.pc < this.instructions.length) {
        const inst = this.instructions[this.pc];
        this.pc++;
        this.execute(inst);
    }
    

For every instruction:

1.  The instruction at `instructions[pc]` is fetched.
2.  `pc` is incremented.
3.  The instruction is passed to `execute()`.
4.  `execute()` determines the opcode.
5.  The corresponding instruction implementation is executed.
6.  Execution continues with the instruction at the current `pc`.

Therefore, if the instructions are:

    0: MOV R1, 5
    1: MOV R2, 10
    2: ADD R3, R1, R2
    3: HLT
    

execution initially starts with:

    PC = 0
    

The executor fetches instruction `0`, increments `PC` to `1`, and executes `MOV`.

It then fetches instruction `1`, increments `PC` to `2`, and executes the next instruction.

* * *

4\. Operand Resolution
======================

Before most instructions perform an operation, operands are processed using:

    resolveValue(operand)
    

The method resolves an operand according to its type.

### Direct Number

If the operand is already a number:

    5
    

the value returned is:

    5
    

### Register

If the operand is a register such as:

    R1
    

the value stored in that register is returned.

For example:

    R1 = 25
    

then:

    resolveValue("R1")
    

returns:

    25
    

### Variable

If the operand is a variable name, the executor looks up the variable's memory address and returns the value stored at that address.

### Numeric String

A string containing a number, such as:

    "100"
    

is converted into:

    100
    

### Invalid Operand

If the operand cannot be resolved, the executor throws:

    Runtime Error: Undefined value '<operand>'
    

* * *

5\. Writing Values
==================

Instructions that modify registers or variables use:

    setValue(operand, value)
    

A target beginning with `R` is treated as a register.

For example:

    setValue("R1", 25)
    

stores:

    R1 = 25
    

If the target is a variable, its corresponding memory location is modified.

A numeric target is treated as a direct memory address.

* * *

6\. Data Movement Instructions
==============================

MOV — Move
----------

### Syntax

    MOV destination, source
    

### Execution

The executor executes:

    this.setValue(
        operands[0],
        this.resolveValue(operands[1])
    );
    

The source operand is resolved first. The resulting value is then written to the destination.

### Example

    MOV R1, 5
    

Execution:

    resolveValue(5)
            ↓
           5
            ↓
    setValue(R1, 5)
            ↓
    R1 = 5
    

Another example:

    MOV R1, R2
    

If:

    R2 = 20
    

then:

    R1 = 20
    

* * *

7\. LOAD — Load from Memory
===========================

### Syntax

    LOAD destination, address
    

### Execution

The executor resolves the second operand and uses the resulting value as a memory address:

    this.setValue(
        operands[0],
        this.memory[this.resolveValue(operands[1])]
    );
    

### Example

If:

    memory[100] = 50
    

then:

    LOAD R1, 100
    

performs:

    resolveValue(100)
            ↓
           100
            ↓
    memory[100]
            ↓
           50
            ↓
    setValue(R1, 50)
            ↓
    R1 = 50
    

> **Important:** `LOAD` uses the resolved value of the second operand as the memory address.

* * *

8\. STORE — Store to Memory
===========================

### Syntax

    STORE address, value
    

### Execution

The first operand is resolved as a memory address.

The second operand is resolved as the value to store.

    const storeAddr = this.resolveValue(operands[0]);
    
    this.memory[storeAddr] =
        this.resolveValue(operands[1]);
    

### Example

If:

    R1 = 50
    

then:

    STORE 100, R1
    

performs:

    resolveValue(100)
            ↓
           100
    
    resolveValue(R1)
            ↓
            50
    
    memory[100] = 50
    

The instruction only writes if the address is between `0` and `MEMORY_SIZE - 1`.

* * *

9\. LOADI — Load Indirectly
===========================

### Syntax

    LOADI destination, pointer
    

The second operand is resolved to obtain a memory address.

    const ptrLoadAddr = this.resolveValue(operands[1]);
    
    this.setValue(
        operands[0],
        this.memory[ptrLoadAddr]
    );
    

### Example

Suppose:

    R2 = 100
    memory[100] = 75
    

Then:

    LOADI R1, R2
    

performs:

    R2
     ↓
    100
     ↓
    memory[100]
     ↓
    75
     ↓
    R1
    

Result:

    R1 = 75
    

* * *

10\. STOREI — Store Indirectly
==============================

### Syntax

    STOREI pointer, value
    

The first operand is resolved to obtain the memory address.

The second operand is resolved to obtain the value.

    const ptrStoreAddr = this.resolveValue(operands[0]);
    
    this.memory[ptrStoreAddr] =
        this.resolveValue(operands[1]);
    

### Example

If:

    R1 = 100
    R2 = 75
    

then:

    STOREI R1, R2
    

performs:

    R1
     ↓
    100
     ↓
    memory[100]
    
    R2
     ↓
    75
    
    memory[100] = 75
    

* * *

11\. Arithmetic Instructions
============================

Arithmetic instructions use `resolveValue()` to obtain their operands and `setValue()` to store the result.

ADD — Addition
--------------

### Syntax

    ADD destination, value1, value2
    

Execution:

    this.setValue(
        operands[0],
        this.resolveValue(operands[1]) +
        this.resolveValue(operands[2])
    );
    

### Example

    ADD R3, R1, R2
    

If:

    R1 = 5
    R2 = 10
    

then:

    R3 = 15
    

* * *

SUB — Subtraction
-----------------

### Syntax

    SUB destination, value1, value2
    

Execution:

    value1 - value2
    

Example:

    SUB R3, R1, R2
    

If:

    R1 = 20
    R2 = 5
    

then:

    R3 = 15
    

* * *

MUL — Multiplication
--------------------

### Syntax

    MUL destination, value1, value2
    

Execution:

    value1 * value2
    

Example:

    MUL R3, R1, R2
    

If:

    R1 = 5
    R2 = 4
    

then:

    R3 = 20
    

* * *

DIV — Division
--------------

### Syntax

    DIV destination, value1, value2
    

Execution:

    Math.floor(value1 / value2)
    

Example:

    DIV R3, R1, R2
    

If:

    R1 = 10
    R2 = 3
    

then:

    R3 = Math.floor(10 / 3)
    R3 = 3
    

* * *

INCR — Increment
----------------

### Syntax

    INCR target
    

The executor resolves the target's current value and adds `1`.

    this.setValue(
        operands[0],
        this.resolveValue(operands[0]) + 1
    );
    

Example:

    R1 = 5
    
    INCR R1
    

Result:

    R1 = 6
    

* * *

DECR — Decrement
----------------

### Syntax

    DECR target
    

The executor resolves the target's current value and subtracts `1`.

Example:

    R1 = 5
    
    DECR R1
    

Result:

    R1 = 4
    

* * *

12\. Logical Instructions
=========================

The logical instructions perform JavaScript bitwise operations.

AND
---

### Syntax

    AND destination, value1, value2
    

Execution:

    value1 & value2
    

Example:

    AND R3, R1, R2
    

Result:

    R3 = R1 & R2
    

* * *

OR
--

### Syntax

    OR destination, value1, value2
    

Execution:

    value1 | value2
    

Example:

    OR R3, R1, R2
    

Result:

    R3 = R1 | R2
    

* * *

XOR
---

### Syntax

    XOR destination, value1, value2
    

Execution:

    value1 ^ value2
    

Example:

    XOR R3, R1, R2
    

Result:

    R3 = R1 ^ R2
    

* * *

NOT
---

### Syntax

    NOT destination, source
    

Execution:

    ~source
    

Example:

    NOT R1, R2
    

results in:

    R1 = ~R2
    

* * *

13\. Comparison Instructions
============================

CMPR — Compare
--------------

### Syntax

    CMPR value1, value2
    

The executor does not store a numerical comparison result.

Instead, it updates:

    equalFlag
    

using:

    this.equalFlag =
        this.resolveValue(operands[0]) ===
        this.resolveValue(operands[1]);
    

### Example

    CMPR R1, R2
    

If:

    R1 = 10
    R2 = 10
    

then:

    equalFlag = true
    

If:

    R1 = 10
    R2 = 20
    

then:

    equalFlag = false
    

The value of `equalFlag` is then used by `JMPE` and `JMPNE`.

* * *

14\. Control Flow Instructions
==============================

JMP — Unconditional Jump
------------------------

### Syntax

    JMP label
    

During `init()`, labels are stored in the `labels` object.

For example:

    LOOP:
        INCR R1
    

may result in:

    labels["LOOP"] = 0;
    

When:

    JMP LOOP
    

is executed:

    this.pc = this.labels[operands[0]];
    

The PC is changed to the instruction index associated with `LOOP`.

Therefore, the next iteration of `run()` fetches the instruction at the label.

* * *

15\. JMPE — Jump if Equal
=========================

### Syntax

    JMPE label
    

The executor checks:

    if (this.equalFlag)
    

If `equalFlag` is `true`, the PC is changed to the label's instruction index.

Example:

    CMPR R1, R2
    JMPE EQUAL
    

If:

    R1 == R2
    

then:

    equalFlag = true
    

and:

    PC = address of EQUAL
    

Otherwise, execution continues normally.

* * *

16\. JMPNE — Jump if Not Equal
==============================

### Syntax

    JMPNE label
    

The executor checks:

    if (!this.equalFlag)
    

If `equalFlag` is `false`, the PC is changed to the label's instruction index.

Example:

    CMPR R1, R2
    JMPNE DIFFERENT
    

If:

    R1 != R2
    

then:

    equalFlag = false
    

and execution jumps to `DIFFERENT`.

* * *

17\. Stack Instructions
=======================

The executor maintains a stack:

    this.stack = [];
    

The stack is used for both normal stack operations and subroutine return addresses.

PUSH
----

### Syntax

    PUSH value
    

The value is resolved and pushed onto the stack:

    this.stack.push(
        this.resolveValue(operands[0])
    );
    

Example:

    R1 = 25
    
    PUSH R1
    

Stack becomes:

    [25]
    

* * *

POP
---

### Syntax

    POP destination
    

The top value is removed from the stack and stored in the destination.

    this.setValue(
        operands[0],
        this.stack.pop()
    );
    

Example:

    Stack = [25]
    
    POP R1
    

Result:

    R1 = 25
    Stack = []
    

If the stack is empty, the executor throws:

    Runtime Error: Stack Underflow
    

* * *

18\. Subroutine Instructions
============================

CALL
----

### Syntax

    CALL label
    

`CALL` performs two operations.

First, it saves the current `pc`:

    this.stack.push(this.pc);
    

Then it changes `pc` to the instruction index of the specified label:

    this.pc = this.labels[operands[0]];
    

Example:

    CALL FUNCTION
    
    ...
    
    FUNCTION:
        ADD R3, R1, R2
        RET
    

Execution:

    CALL FUNCTION
           ↓
    Save return PC on stack
           ↓
    Set PC to FUNCTION
           ↓
    Execute FUNCTION
    

The saved PC allows `RET` to return to the instruction following the `CALL`.

* * *

19\. RET — Return from Subroutine
=================================

### Syntax

    RET
    

`RET` removes the saved return address from the stack:

    this.pc = this.stack.pop();
    

Execution becomes:

    CALL FUNCTION
           ↓
    Save return address
           ↓
    Jump to FUNCTION
           ↓
    Execute FUNCTION
           ↓
    RET
           ↓
    Pop return address
           ↓
    Restore PC
           ↓
    Continue execution
    

If the stack is empty when `RET` executes, the executor throws:

    Runtime Error: Stack Underflow on RET
    

* * *

20\. System Instructions
========================

NOP — No Operation
------------------

### Syntax

    NOP
    

The `execute()` method does nothing for this instruction:

    case "NOP":
        break;
    

However, the PC has already been incremented by `run()` before `execute()` is called.

Therefore, `NOP` simply consumes one instruction position and execution continues with the next instruction.

* * *

21\. HLT — Halt
===============

### Syntax

    HLT
    

The executor sets:

    this.halted = true;
    

The `run()` loop checks:

    while (!this.halted && ...)
    

Therefore, after `HLT` is executed, the loop terminates.

Execution stops.

* * *

22\. PRINT — Output
===================

### Syntax

    PRINT value
    

`PRINT` behaves differently depending on whether the operand is a variable.

### Printing a Register or Number

For:

    PRINT R1
    

the executor calls:

    console.log(this.resolveValue(target));
    

If:

    R1 = 25
    

the output is:

    25
    

### Printing a String Variable

If the operand is a variable, the executor obtains the variable's memory address:

    let addr = this.variables[target];
    

It then reads memory one location at a time until it finds a `0` value:

    while (
        addr < MEMORY_SIZE &&
        this.memory[addr] !== 0
    ) {
        resultStr += String.fromCharCode(this.memory[addr]);
        addr++;
    }
    

Each memory value is converted into a character using:

    String.fromCharCode()
    

For example, if memory contains:

    72 69 76 76 79 0
    

the result becomes:

    HELLO
    

and is printed using:

    console.log(resultStr);
    

* * *

23\. Complete Instruction Execution Example
===========================================

Consider this MD program:

    MOV R1, 5
    MOV R2, 10
    ADD R3, R1, R2
    CMPR R3, 15
    JMPE SUCCESS
    HLT
    
    SUCCESS:
    PRINT R3
    HLT
    

After parsing and initialization, the executable instructions can be viewed conceptually as:

    0: MOV R1, 5
    1: MOV R2, 10
    2: ADD R3, R1, R2
    3: CMPR R3, 15
    4: JMPE SUCCESS
    5: HLT
    6: PRINT R3
    7: HLT
    

The label is stored separately:

    SUCCESS → instruction 6
    

Execution occurs as follows.

### Step 1

    PC = 0
    
    MOV R1, 5
    

Result:

    R1 = 5
    PC = 1
    

### Step 2

    MOV R2, 10
    

Result:

    R2 = 10
    PC = 2
    

### Step 3

    ADD R3, R1, R2
    

The executor resolves:

    R1 → 5
    R2 → 10
    

and calculates:

    5 + 10 = 15
    

Result:

    R3 = 15
    PC = 3
    

### Step 4

    CMPR R3, 15
    

The executor compares:

    15 === 15
    

Therefore:

    equalFlag = true
    PC = 4
    

### Step 5

    JMPE SUCCESS
    

Since:

    equalFlag = true
    

the executor changes:

    PC = 6
    

The instruction at index `5` (`HLT`) is skipped.

### Step 6

    PRINT R3
    

`resolveValue(R3)` returns:

    15
    

Therefore the output is:

    15
    

### Step 7

    HLT
    

The executor sets:

    halted = true
    

The `run()` loop stops.

* * *

24\. Overall Execution Model
============================

The `Executor` therefore follows this model for every instruction:

                        PC
                        │
                        ▼
              instructions[PC]
                        │
                        ▼
                 Fetch instruction
                        │
                        ▼
                    PC++
                        │
                        ▼
                execute(instruction)
                        │
                        ▼
                  Read opcode
                        │
                        ▼
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
          resolveValue()      Direct operation
              │                   │
              └─────────┬─────────┘
                        ▼
                 Perform operation
                        │
                        ▼
           Register / Memory / Stack
                        │
                        ▼
                 Modify PC if needed
                        │
                        ▼
              Fetch next instruction
    

The only instructions that normally modify the flow of execution by changing `pc` are:

    JMP
    JMPE
    JMPNE
    CALL
    RET
    

`HLT` instead sets `halted = true`, causing the execution loop to stop.

All other instructions perform their operation and execution continues with the current `pc`.
