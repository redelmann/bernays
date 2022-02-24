import {constant, and, or, implies, not, metaVariable} from './Expr.js';

export const trueI = {
    code: "trueI",
    name: "⊤I",
    hypotheses: [],
    discharge: null, 
    conclusion: constant(true)
};

export const falseE = {
    code: "falseE",
    name: "⊥E",
    hypotheses: [constant(false)],
    discharge: null, 
    conclusion: metaVariable("A")
};

export const notI = {
    code: "notI",
    name: "¬I",
    hypotheses: [constant(false)],
    discharge: metaVariable("A"), 
    conclusion: not(metaVariable("A"))
};

export const notE = {
    code: "notE",
    name: "¬E",
    hypotheses: [not(metaVariable("A")), metaVariable("A")],
    discharge: null,
    conclusion: constant(false)
};

export const andI = {
    code: "andI",
    name: "⋀I",
    hypotheses: [metaVariable("A"), metaVariable("B")],
    discharge: null,
    conclusion: and(metaVariable("A"), metaVariable("B"))
};

export const andE1 = {
    code: "andE1",
    name: "⋀E1",
    hypotheses: [and(metaVariable("A"), metaVariable("B"))],
    discharge: null, 
    conclusion: metaVariable("A")
};

export const andE2 = {
    code: "andE2",
    name: "⋀E2",
    hypotheses: [and(metaVariable("A"), metaVariable("B"))],
    discharge: null, 
    conclusion: metaVariable("B")
};

export const orI1 = {
    code: "orI1",
    name: "⋁I1",
    hypotheses: [metaVariable("A")],
    discharge: null, 
    conclusion: or(metaVariable("A"), metaVariable("B"))
};

export const orI2 = {
    code: "orI2",
    name: "⋁I2",
    hypotheses: [metaVariable("B")],
    discharge: null, 
    conclusion: or(metaVariable("A"), metaVariable("B"))
};

export const orE = {
    code: "orE",
    name: "⋁E",
    hypotheses: [or(metaVariable("A"), metaVariable("B")), implies(metaVariable("A"), metaVariable("C")), implies(metaVariable("B"), metaVariable("C"))],
    discharge: null, 
    conclusion: metaVariable("C")
};

export const implI = {
    code: "implI",
    name: "⇒I",
    hypotheses: [metaVariable("B")],
    discharge: metaVariable("A"), 
    conclusion: implies(metaVariable("A"), metaVariable("B"))
};

export const implE = {
    code: "implE",
    name: "⇒E",
    hypotheses: [implies(metaVariable("A"), metaVariable("B")), metaVariable("A")],
    discharge: null, 
    conclusion: metaVariable("B")
};

export const notNotE = {
    code: "notNotE",
    name: "¬¬E",
    hypotheses: [not(not(metaVariable("A")))],
    discharge: null,
    conclusion: metaVariable("A")
};

export const tnd = {
    code: "tnd",
    name: "TND",
    hypotheses: [],
    discharge: null,
    conclusion: or(metaVariable("A"), not(metaVariable("A")))
};

export const raa = {
    code: "raa",
    name: "RAA",
    hypotheses: [constant(false)],
    discharge: not(metaVariable("A")),
    conclusion: metaVariable("A")
};

export const rules = [trueI, falseE, notI, notE, andI, andE1, andE2, orI1, orI2, orE, implI, implE, notNotE, tnd, raa];
