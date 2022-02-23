
export function pretty(expression) {

    function prettyAtom(expr) {
        switch (expr.kind) {
            case "Variable": {
                return expr.name;
            }
            case "MetaVariable": {
                return expr.name;
            }
            case "Constant": {
                if (expr.value) {
                    return "⊤";
                }
                else {
                    return "⊥";
                }
            }
            default: {
                return "(" + prettyExpr(expr) + ")";
            }
        }
    }

    function prettyNegation(expr) {
        var current = expr;
        let pre = ""
        while (current.kind === "Not") {
            current = current.inner;
            pre = pre + "¬";
        }
        return pre + prettyAtom(current);
    }

    function prettyBinary(expr, kind, op, below) {
        if (expr.kind === kind) {
            const left = below(expr.left);
            // Change here to remove unnecessary parentheses due to right associativity rule.
            // const right = prettyBinary(expr.right, kind, op, below);
            const right = below(expr.right);
            return left + " " + op + " " + right;
        }
        else {
            return below(expr);
        }
    }

    function prettyConjunction(expr) {
        return prettyBinary(expr, "And", "⋀", prettyNegation);
    }

    function prettyDisjunction(expr) {
        return prettyBinary(expr, "Or", "⋁", prettyConjunction);
    }

    function prettyExpr(expr) {
        return prettyBinary(expr, "Implies", "⇒", prettyDisjunction);
    }

    return prettyExpr(expression);
}