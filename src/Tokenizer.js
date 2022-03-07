
const token_classes = [
  { re: /^(\s+)/, tag: "SPACE" },
  { re: /^(vrai|true|⊤)/, tag: "TRUE" },
  { re: /^(faux|false|⊥)/, tag: "FALSE" },
  { re: /^("[^"]*")/, tag: "ID" },
  { re: /^([a-zA-Z][a-zA-Z0-9]*)/, tag: "META_ID" },
  { re: /^(&|⋀|\/\\)/, tag: "AND"},
  { re: /^(\||⋁|\\\/)/, tag: "OR"},
  { re: /^(=>|⇒)/, tag: "IMPLIES"},
  { re: /^(<=>|⇔)/, tag: "IFF"},
  { re: /^(~|¬)/, tag: "NOT"},
  { re: /^(\()/, tag: "OPEN" },
  { re: /^(\))/, tag: "CLOSE" }
];

export function tokenize(string) {
  let current = string;
  const tokens = [];
  while (current.length > 0) {
    let max_length = null;
    let max_tag = null;
    
    token_classes.forEach(function(token_class) {
      const res = current.match(token_class.re);
      if (res != null) {
        const match = res[0];
        const match_length = match.length;
        if (max_length == null || match_length > max_length) {
          max_length = match_length;
          max_tag = token_class.tag;
        }
      }
    });

    if (max_length == null) {
      max_length = 1;
      max_tag = "ERROR";
    }

    const max_content = current.slice(0, max_length);
    current = current.slice(max_length);
    tokens.push({
      tag: max_tag,
      content: max_content
    });
  }

  return tokens;
}