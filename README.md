# Bernays

*Bernays* is a visual proof assistant for propositional logic based on natural deduction. The tool is named after [Paul Bernays (1888 - 1977)](https://en.wikipedia.org/wiki/Paul_Bernays), a Swiss mathematician who made important contributions to the field of logic.

## Trying Bernays

The tool is available online at [bernays.redelmann.ch](https://bernays.redelmann.ch/).

### Syntax for propositions

Propositional variables are written as double quoted strings (e.g. `"it rains"`), while metavariables identifiers are written using letters followed by numbers and letters (e.g. `A`, `X1`). Constants *true* and *false* are written `true` and `false` respectively.

| Operator | Meaning            |
| -------- | ------------------ |
| `~`      | Unary negation     |
| `/\`     | Binary conjunction |
| `\/`     | Binary disjunction |
| `=>`     | Binary implication |
| `<=>`    | Binary equivalence |

Operators are given in order of decreasing priority.
Binary operators are right-associative. Parentheses can be used.

#### Example

`(A => B) /\ ~B => ~A`

## License

*Bernays*' source code is available under the Apache 2.0 license. See the [LICENSE](LICENSE) file.
