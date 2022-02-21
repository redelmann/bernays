import {constant, and, or, implies, not, variable} from './Expr.js';

export const trueI = {
    name: "⊤I",
    hypotheses: [],
    discharge: null, 
    conclusion: constant(true)
};

export const falseE = {
    name: "⊥E",
    hypotheses: [constant(false)],
    discharge: null, 
    conclusion: variable("A")
};

export const notI = {
    name: "¬I",
    hypotheses: [constant(false)],
    discharge: variable("A"), 
    conclusion: not(variable("A"))
};

export const notE = {
    name: "¬E",
    hypotheses: [not(variable("A")), variable("A")],
    discharge: null,
    conclusion: constant(false)
};

export const andI = {
    name: "⋀I",
    hypotheses: [variable("A"), variable("B")],
    discharge: null,
    conclusion: and(variable("A"), variable("B"))
};

export const andE1 = {
    name: "⋀E1",
    hypotheses: [and(variable("A"), variable("B"))],
    discharge: null, 
    conclusion: variable("A")
};

export const andE2 = {
    name: "⋀E2",
    hypotheses: [and(variable("A"), variable("B"))],
    discharge: null, 
    conclusion: variable("B")
};

export const orI1 = {
    name: "⋁I1",
    hypotheses: [variable("A")],
    discharge: null, 
    conclusion: or(variable("A"), variable("B"))
};

export const orI2 = {
    name: "⋁I2",
    hypotheses: [variable("B")],
    discharge: null, 
    conclusion: or(variable("A"), variable("B"))
};

export const orE = {
    name: "⋁E",
    hypotheses: [or(variable("A"), variable("B")), implies(variable("A"), variable("C")), implies(variable("B"), variable("C"))],
    discharge: null, 
    conclusion: variable("C")
};

export const implI = {
    name: "⇒I",
    hypotheses: [variable("B")],
    discharge: variable("A"), 
    conclusion: implies(variable("A"), variable("B"))
};

export const implE = {
    name: "⇒E",
    hypotheses: [implies(variable("A"), variable("B")), variable("A")],
    discharge: null, 
    conclusion: variable("B")
};

export const notNotE = {
    name: "¬¬E",
    hypotheses: [not(not(variable("A")))],
    discharge: null,
    conclusion: variable("A")
};

export const tnd = {
    name: "TND",
    hypotheses: [],
    discharge: null,
    conclusion: or(variable("A"), not(variable("A")))
};

export const rules = [trueI, falseE, notI, notE, andI, andE1, andE2, orI1, orI2, orE, implI, implE, notNotE, tnd];
