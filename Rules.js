import {constant, and, or, implies, not, variable} from './Expr.js';

export const trueI = {
    name: "⊤I",
    hypotheses: [],
    discharges: [], 
    conclusion: constant(true)
};

export const falseE = {
    name: "⊥E",
    hypotheses: [constant(false)],
    discharges: [], 
    conclusion: variable("A")
};

export const notI = {
    name: "¬I",
    hypotheses: [constant(false)],
    discharges: [variable("A")], 
    conclusion: not(variable("A"))
};

export const notE = {
    name: "¬E",
    hypotheses: [not(variable("A")), variable("A")],
    discharges: [],
    conclusion: constant(false)
};

export const andI = {
    name: "⋀I",
    hypotheses: [variable("A"), variable("B")],
    discharges: [],
    conclusion: and(variable("A"), variable("B"))
};

export const andE1 = {
    name: "⋀E1",
    hypotheses: [and(variable("A"), variable("B"))],
    discharges: [], 
    conclusion: variable("A")
};

export const andE2 = {
    name: "⋀E2",
    hypotheses: [and(variable("A"), variable("B"))],
    discharges: [], 
    conclusion: variable("B")
};

export const orI1 = {
    name: "⋁I1",
    hypotheses: [variable("A")],
    discharges: [], 
    conclusion: or(variable("A"), variable("B"))
};

export const orI2 = {
    name: "⋁I2",
    hypotheses: [variable("B")],
    discharges: [], 
    conclusion: or(variable("A"), variable("B"))
};

export const orE = {
    name: "⋁E",
    hypotheses: [or(variable("A"), variable("B")), implies(variable("A"), variable("C")), implies(variable("B"), variable("C"))],
    discharges: [], 
    conclusion: variable("C")
};

export const implI = {
    name: "⇒I",
    hypotheses: [variable("B")],
    discharges: [variable("A")], 
    conclusion: implies(variable("A"), variable("B"))
};

export const implE = {
    name: "⇒E",
    hypotheses: [implies(variable("A"), variable("B")), variable("A")],
    discharges: [], 
    conclusion: variable("B")
};

export const notNotE = {
    name: "¬¬E",
    hypotheses: [not(not(variable("A")))],
    discharges: [],
    conclusion: variable("A")
};

export const tnd = {
    name: "TND",
    hypotheses: [],
    discharges: [],
    conclusion: or(variable("A"), not(variable("A")))
};

export const rules = [trueI, falseE, notI, notE, andI, andE1, andE2, orI1, orI2, orE, implI, implE, notNotE, tnd];
