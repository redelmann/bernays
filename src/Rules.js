// Copyright 2022 Romain Edelmann
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import {constant, and, or, implies, not, iff, metaVariable} from './Expr.js';

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
  conclusion: metaVariable("a")
};

export const notI = {
  code: "notI",
  name: "¬I",
  hypotheses: [constant(false)],
  discharge: metaVariable("a"), 
  conclusion: not(metaVariable("a"))
};

export const notE = {
  code: "notE",
  name: "¬E",
  hypotheses: [not(metaVariable("a")), metaVariable("a")],
  discharge: null,
  conclusion: constant(false)
};

export const andI = {
  code: "andI",
  name: "⋀I",
  hypotheses: [metaVariable("a"), metaVariable("b")],
  discharge: null,
  conclusion: and(metaVariable("a"), metaVariable("b"))
};

export const andE1 = {
  code: "andE1",
  name: "⋀E1",
  hypotheses: [and(metaVariable("a"), metaVariable("b"))],
  discharge: null, 
  conclusion: metaVariable("a")
};

export const andE2 = {
  code: "andE2",
  name: "⋀E2",
  hypotheses: [and(metaVariable("a"), metaVariable("b"))],
  discharge: null, 
  conclusion: metaVariable("b")
};

export const orI1 = {
  code: "orI1",
  name: "⋁I1",
  hypotheses: [metaVariable("a")],
  discharge: null, 
  conclusion: or(metaVariable("a"), metaVariable("b"))
};

export const orI2 = {
  code: "orI2",
  name: "⋁I2",
  hypotheses: [metaVariable("b")],
  discharge: null, 
  conclusion: or(metaVariable("a"), metaVariable("b"))
};

export const orE = {
  code: "orE",
  name: "⋁E",
  hypotheses: [or(metaVariable("a"), metaVariable("b")), implies(metaVariable("a"), metaVariable("c")), implies(metaVariable("b"), metaVariable("c"))],
  discharge: null, 
  conclusion: metaVariable("c")
};

export const implI = {
  code: "implI",
  name: "⇒I",
  hypotheses: [metaVariable("b")],
  discharge: metaVariable("a"), 
  conclusion: implies(metaVariable("a"), metaVariable("b"))
};

export const implE = {
  code: "implE",
  name: "⇒E",
  hypotheses: [implies(metaVariable("a"), metaVariable("b")), metaVariable("a")],
  discharge: null, 
  conclusion: metaVariable("b")
};

export const iffI = {
  code: "iffI",
  name: "⇔I",
  hypotheses: [implies(metaVariable("a"), metaVariable("b")), implies(metaVariable("b"), metaVariable("a"))],
  discharge: null,
  conclusion: iff(metaVariable("a"), metaVariable("b"))
};

export const iffE1 = {
  code: "iffE1",
  name: "⇔E1",
  hypotheses: [iff(metaVariable("a"), metaVariable("b"))],
  discharge: null,
  conclusion: implies(metaVariable("a"), metaVariable("b"))
};

export const iffE2 = {
  code: "iffE2",
  name: "⇔E2",
  hypotheses: [iff(metaVariable("a"), metaVariable("b"))],
  discharge: null,
  conclusion: implies(metaVariable("b"), metaVariable("a"))
};

export const notNotE = {
  code: "notNotE",
  name: "¬¬E",
  hypotheses: [not(not(metaVariable("a")))],
  discharge: null,
  conclusion: metaVariable("a")
};

export const tnd = {
  code: "tnd",
  name: "TND",
  hypotheses: [],
  discharge: null,
  conclusion: or(metaVariable("a"), not(metaVariable("a")))
};

export const raa = {
  code: "raa",
  name: "RAA",
  hypotheses: [constant(false)],
  discharge: not(metaVariable("a")),
  conclusion: metaVariable("a")
};

export function axiom(expr) {
  return {
    code: "axiom",
    name: "AX",
    hypotheses: [],
    discharge: null,
    conclusion: expr
  };
}

export const rules = [
  trueI, falseE,
  notI, notE,
  andI, andE1, andE2,
  orI1, orI2, orE,
  implI, implE,
  iffI, iffE1, iffE2,
  notNotE, tnd, raa];
