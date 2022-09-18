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


const token_classes = [
  { re: /^(\s+)/, tag: "SPACE" },
  { re: /^(vrai|true|⊤)/, tag: "TRUE" },
  { re: /^(faux|false|⊥)/, tag: "FALSE" },
  { re: /^("[^"]*")/, tag: "ID" },
  { re: /^(et|&|⋀|\/\\)/, tag: "AND"},
  { re: /^(ou|\||⋁|\\\/)/, tag: "OR"},
  { re: /^(implique|=>|⇒)/, tag: "IMPLIES"},
  { re: /^(ssi|<=>|⇔)/, tag: "IFF"},
  { re: /^(non|~|¬)/, tag: "NOT"},
  { re: /^([a-z][a-zA-Z0-9]*)/, tag: "META_ID" },
  { re: /^([A-Z][a-zA-Z0-9]*)/, tag: "ID" },
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