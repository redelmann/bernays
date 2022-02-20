import {constant, ands, ors, impliess, not, variable} from './Expr.js';

export class ParseError extends Error {
    constructor(code, ...params) {
        super(params);

        if(Error.captureStackTrace) {
            Error.captureStackTrace(this, ParseError);
        }
        this.name = 'ParseError';
        this.code = code;
    }
}

export function parse(input) {
    const tokens = input.filter(token => token.tag != "SPACE");

    function consume(tag) {
        if (tokens.length > 0 && tokens[0].tag === tag) {
            return tokens.shift();
        }
        return null;
    }

    function parseLiteral() {
        if (consume("TRUE")) {
            return constant(true);
        }
        if (consume("FALSE")) {
            return constant(false);
        }
        const token = consume("ID");
        if (token) {
            return variable(token.content);
        }
        return null;
    }

    function parseAtom() {
        const res = parseLiteral() || parseExprWithParentheses();
        if (!res) {
            throw new ParseError("EXPECTED_ATOM");
        }
        return res;
    }

    function parseNegation() {
        let n = 0;
        while (consume("NOT")) {
            n++;
        }
        var res = parseAtom();
        for(var i = 0; i < n; i++) {
            res = not(res);
        }
        return res;
    }

    function parseBinary(op, below, constr) {
        const exprs = [];
        exprs.push(below());
        while (consume(op)) {
            exprs.push(below());
        }
        return constr(exprs);
    }

    function parseConjunction() {
        return parseBinary("AND", parseNegation, ands);
    }

    function parseDisjunction() {
        return parseBinary("OR", parseConjunction, ors);
    }

    function parseExpr() {
        return parseBinary("IMPLIES", parseDisjunction, impliess);
    }

    function parseExprWithParentheses() {
        if (consume("OPEN")) {
            const expr = parseExpr();
            if (!consume("CLOSE")) {
                throw new ParseError("CLOSE_PARENS");
            }
            return expr;
        }
    }

    const expr = parseExpr();
    if (tokens.length > 0) {
        throw new ParseError("EXTRA_TOKENS");
    }
    return expr;
}