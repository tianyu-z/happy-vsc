__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diagram = void 0;
  var _Class, _Class2, _Uid2;
  // src/diagrams/sankey/parser/sankey.jison
  var parser = function () {
    var o = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function (k, v, o2, l) {
        for (o2 = o2 || {}, l = k.length; l--; o2[k[l]] = v);
        return o2;
      }, "o"),
      $V0 = [1, 9],
      $V1 = [1, 10],
      $V2 = [1, 5, 10, 12];
    var parser2 = {
      trace: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function trace() {}, "trace"),
      yy: {},
      symbols_: {
        "error": 2,
        "start": 3,
        "SANKEY": 4,
        "NEWLINE": 5,
        "csv": 6,
        "opt_eof": 7,
        "record": 8,
        "csv_tail": 9,
        "EOF": 10,
        "field[source]": 11,
        "COMMA": 12,
        "field[target]": 13,
        "field[value]": 14,
        "field": 15,
        "escaped": 16,
        "non_escaped": 17,
        "DQUOTE": 18,
        "ESCAPED_TEXT": 19,
        "NON_ESCAPED_TEXT": 20,
        "$accept": 0,
        "$end": 1
      },
      terminals_: {
        2: "error",
        4: "SANKEY",
        5: "NEWLINE",
        10: "EOF",
        11: "field[source]",
        12: "COMMA",
        13: "field[target]",
        14: "field[value]",
        18: "DQUOTE",
        19: "ESCAPED_TEXT",
        20: "NON_ESCAPED_TEXT"
      },
      productions_: [0, [3, 4], [6, 2], [9, 2], [9, 0], [7, 1], [7, 0], [8, 5], [15, 1], [15, 1], [16, 3], [17, 1]],
      performAction: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
        var $0 = $$.length - 1;
        switch (yystate) {
          case 7:
            const source = yy.findOrCreateNode($$[$0 - 4].trim().replaceAll('""', '"'));
            const target = yy.findOrCreateNode($$[$0 - 2].trim().replaceAll('""', '"'));
            const value = parseFloat($$[$0].trim());
            yy.addLink(source, target, value);
            break;
          case 8:
          case 9:
          case 11:
            this.$ = $$[$0];
            break;
          case 10:
            this.$ = $$[$0 - 1];
            break;
        }
      }, "anonymous"),
      table: [{
        3: 1,
        4: [1, 2]
      }, {
        1: [3]
      }, {
        5: [1, 3]
      }, {
        6: 4,
        8: 5,
        15: 6,
        16: 7,
        17: 8,
        18: $V0,
        20: $V1
      }, {
        1: [2, 6],
        7: 11,
        10: [1, 12]
      }, o($V1, [2, 4], {
        9: 13,
        5: [1, 14]
      }), {
        12: [1, 15]
      }, o($V2, [2, 8]), o($V2, [2, 9]), {
        19: [1, 16]
      }, o($V2, [2, 11]), {
        1: [2, 1]
      }, {
        1: [2, 5]
      }, o($V1, [2, 2]), {
        6: 17,
        8: 5,
        15: 6,
        16: 7,
        17: 8,
        18: $V0,
        20: $V1
      }, {
        15: 18,
        16: 7,
        17: 8,
        18: $V0,
        20: $V1
      }, {
        18: [1, 19]
      }, o($V1, [2, 3]), {
        12: [1, 20]
      }, o($V2, [2, 10]), {
        15: 21,
        16: 7,
        17: 8,
        18: $V0,
        20: $V1
      }, o([1, 5, 10], [2, 7])],
      defaultActions: {
        11: [2, 1],
        12: [2, 5]
      },
      parseError: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function parseError(str, hash) {
        if (hash.recoverable) {
          this.trace(str);
        } else {
          var error = new Error(str);
          error.hash = hash;
          throw error;
        }
      }, "parseError"),
      parse: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function parse(input) {
        var self = this,
          stack = [0],
          tstack = [],
          vstack = [null],
          lstack = [],
          table = this.table,
          yytext = "",
          yylineno = 0,
          yyleng = 0,
          recovering = 0,
          TERROR = 2,
          EOF = 1;
        var args = lstack.slice.call(arguments, 1);
        var lexer2 = Object.create(this.lexer);
        var sharedState = {
          yy: {}
        };
        for (var k in this.yy) {
          if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
          }
        }
        lexer2.setInput(input, sharedState.yy);
        sharedState.yy.lexer = lexer2;
        sharedState.yy.parser = this;
        if (typeof lexer2.yylloc == "undefined") {
          lexer2.yylloc = {};
        }
        var yyloc = lexer2.yylloc;
        lstack.push(yyloc);
        var ranges = lexer2.options && lexer2.options.ranges;
        if (typeof sharedState.yy.parseError === "function") {
          this.parseError = sharedState.yy.parseError;
        } else {
          this.parseError = Object.getPrototypeOf(this).parseError;
        }
        function popStack(n) {
          stack.length = stack.length - 2 * n;
          vstack.length = vstack.length - n;
          lstack.length = lstack.length - n;
        }
        (0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(popStack, "popStack");
        function lex() {
          var token;
          token = tstack.pop() || lexer2.lex() || EOF;
          if (typeof token !== "number") {
            if (token instanceof Array) {
              tstack = token;
              token = tstack.pop();
            }
            token = self.symbols_[token] || token;
          }
          return token;
        }
        (0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(lex, "lex");
        var symbol,
          preErrorSymbol,
          state,
          action,
          a,
          r,
          yyval = {},
          p,
          len,
          newState,
          expected;
        while (true) {
          state = stack[stack.length - 1];
          if (this.defaultActions[state]) {
            action = this.defaultActions[state];
          } else {
            if (symbol === null || typeof symbol == "undefined") {
              symbol = lex();
            }
            action = table[state] && table[state][symbol];
          }
          if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            expected = [];
            for (p in table[state]) {
              if (this.terminals_[p] && p > TERROR) {
                expected.push("'" + this.terminals_[p] + "'");
              }
            }
            if (lexer2.showPosition) {
              errStr = "Parse error on line " + (yylineno + 1) + ":\n" + lexer2.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
            } else {
              errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == EOF ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
            }
            this.parseError(errStr, {
              text: lexer2.match,
              token: this.terminals_[symbol] || symbol,
              line: lexer2.yylineno,
              loc: yyloc,
              expected
            });
          }
          if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
          }
          switch (action[0]) {
            case 1:
              stack.push(symbol);
              vstack.push(lexer2.yytext);
              lstack.push(lexer2.yylloc);
              stack.push(action[1]);
              symbol = null;
              if (!preErrorSymbol) {
                yyleng = lexer2.yyleng;
                yytext = lexer2.yytext;
                yylineno = lexer2.yylineno;
                yyloc = lexer2.yylloc;
                if (recovering > 0) {
                  recovering--;
                }
              } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
              }
              break;
            case 2:
              len = this.productions_[action[1]][1];
              yyval.$ = vstack[vstack.length - len];
              yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
              };
              if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
              }
              r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));
              if (typeof r !== "undefined") {
                return r;
              }
              if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
              }
              stack.push(this.productions_[action[1]][0]);
              vstack.push(yyval.$);
              lstack.push(yyval._$);
              newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
              stack.push(newState);
              break;
            case 3:
              return true;
          }
        }
        return true;
      }, "parse")
    };
    var lexer = /* @__PURE__ */function () {
      var lexer2 = {
        EOF: 1,
        parseError: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function parseError(str, hash) {
          if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
          } else {
            throw new Error(str);
          }
        }, "parseError"),
        // resets the lexer, sets new input
        setInput: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function (input, yy) {
          this.yy = yy || this.yy || {};
          this._input = input;
          this._more = this._backtrack = this.done = false;
          this.yylineno = this.yyleng = 0;
          this.yytext = this.matched = this.match = "";
          this.conditionStack = ["INITIAL"];
          this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
          };
          if (this.options.ranges) {
            this.yylloc.range = [0, 0];
          }
          this.offset = 0;
          return this;
        }, "setInput"),
        // consumes and returns one char from the input
        input: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          var ch = this._input[0];
          this.yytext += ch;
          this.yyleng++;
          this.offset++;
          this.match += ch;
          this.matched += ch;
          var lines = ch.match(/(?:\r\n?|\n).*/g);
          if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
          } else {
            this.yylloc.last_column++;
          }
          if (this.options.ranges) {
            this.yylloc.range[1]++;
          }
          this._input = this._input.slice(1);
          return ch;
        }, "input"),
        // unshifts one char (or a string) into the input
        unput: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function (ch) {
          var len = ch.length;
          var lines = ch.split(/(?:\r\n?|\n)/g);
          this._input = ch + this._input;
          this.yytext = this.yytext.substr(0, this.yytext.length - len);
          this.offset -= len;
          var oldLines = this.match.split(/(?:\r\n?|\n)/g);
          this.match = this.match.substr(0, this.match.length - 1);
          this.matched = this.matched.substr(0, this.matched.length - 1);
          if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
          }
          var r = this.yylloc.range;
          this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
          };
          if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
          }
          this.yyleng = this.yytext.length;
          return this;
        }, "unput"),
        // When called from action, caches matched text and appends it on next action
        more: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          this._more = true;
          return this;
        }, "more"),
        // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
        reject: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          if (this.options.backtrack_lexer) {
            this._backtrack = true;
          } else {
            return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n" + this.showPosition(), {
              text: "",
              token: null,
              line: this.yylineno
            });
          }
          return this;
        }, "reject"),
        // retain first n characters of the match
        less: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function (n) {
          this.unput(this.match.slice(n));
        }, "less"),
        // displays already matched input, i.e. for error messages
        pastInput: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          var past = this.matched.substr(0, this.matched.length - this.match.length);
          return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
        }, "pastInput"),
        // displays upcoming input, i.e. for error messages
        upcomingInput: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          var next = this.match;
          if (next.length < 20) {
            next += this._input.substr(0, 20 - next.length);
          }
          return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
        }, "upcomingInput"),
        // displays the character position where the lexing error occurred, i.e. for error messages
        showPosition: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          var pre = this.pastInput();
          var c = new Array(pre.length + 1).join("-");
          return pre + this.upcomingInput() + "\n" + c + "^";
        }, "showPosition"),
        // test the lexed token: return FALSE when not a match, otherwise return token
        test_match: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function (match, indexed_rule) {
          var token, lines, backup;
          if (this.options.backtrack_lexer) {
            backup = {
              yylineno: this.yylineno,
              yylloc: {
                first_line: this.yylloc.first_line,
                last_line: this.last_line,
                first_column: this.yylloc.first_column,
                last_column: this.yylloc.last_column
              },
              yytext: this.yytext,
              match: this.match,
              matches: this.matches,
              matched: this.matched,
              yyleng: this.yyleng,
              offset: this.offset,
              _more: this._more,
              _input: this._input,
              yy: this.yy,
              conditionStack: this.conditionStack.slice(0),
              done: this.done
            };
            if (this.options.ranges) {
              backup.yylloc.range = this.yylloc.range.slice(0);
            }
          }
          lines = match[0].match(/(?:\r\n?|\n).*/g);
          if (lines) {
            this.yylineno += lines.length;
          }
          this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
          };
          this.yytext += match[0];
          this.match += match[0];
          this.matches = match;
          this.yyleng = this.yytext.length;
          if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
          }
          this._more = false;
          this._backtrack = false;
          this._input = this._input.slice(match[0].length);
          this.matched += match[0];
          token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
          if (this.done && this._input) {
            this.done = false;
          }
          if (token) {
            return token;
          } else if (this._backtrack) {
            for (var k in backup) {
              this[k] = backup[k];
            }
            return false;
          }
          return false;
        }, "test_match"),
        // return next match in input
        next: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function () {
          if (this.done) {
            return this.EOF;
          }
          if (!this._input) {
            this.done = true;
          }
          var token, match, tempMatch, index;
          if (!this._more) {
            this.yytext = "";
            this.match = "";
          }
          var rules = this._currentRules();
          for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
              match = tempMatch;
              index = i;
              if (this.options.backtrack_lexer) {
                token = this.test_match(tempMatch, rules[i]);
                if (token !== false) {
                  return token;
                } else if (this._backtrack) {
                  match = false;
                  continue;
                } else {
                  return false;
                }
              } else if (!this.options.flex) {
                break;
              }
            }
          }
          if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
              return token;
            }
            return false;
          }
          if (this._input === "") {
            return this.EOF;
          } else {
            return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
              text: "",
              token: null,
              line: this.yylineno
            });
          }
        }, "next"),
        // return next match that has a token
        lex: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function lex() {
          var r = this.next();
          if (r) {
            return r;
          } else {
            return this.lex();
          }
        }, "lex"),
        // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
        begin: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function begin(condition) {
          this.conditionStack.push(condition);
        }, "begin"),
        // pop the previously active lexer condition state off the condition stack
        popState: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function popState() {
          var n = this.conditionStack.length - 1;
          if (n > 0) {
            return this.conditionStack.pop();
          } else {
            return this.conditionStack[0];
          }
        }, "popState"),
        // produce the lexer rule set which is active for the currently active lexer condition state
        _currentRules: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function _currentRules() {
          if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
          } else {
            return this.conditions["INITIAL"].rules;
          }
        }, "_currentRules"),
        // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
        topState: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function topState(n) {
          n = this.conditionStack.length - 1 - Math.abs(n || 0);
          if (n >= 0) {
            return this.conditionStack[n];
          } else {
            return "INITIAL";
          }
        }, "topState"),
        // alias for begin(condition)
        pushState: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function pushState(condition) {
          this.begin(condition);
        }, "pushState"),
        // return the number of states currently on the stack
        stateStackSize: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function stateStackSize() {
          return this.conditionStack.length;
        }, "stateStackSize"),
        options: {
          "case-insensitive": true
        },
        performAction: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
          var YYSTATE = YY_START;
          switch ($avoiding_name_collisions) {
            case 0:
              this.pushState("csv");
              return 4;
              break;
            case 1:
              this.pushState("csv");
              return 4;
              break;
            case 2:
              return 10;
              break;
            case 3:
              return 5;
              break;
            case 4:
              return 12;
              break;
            case 5:
              this.pushState("escaped_text");
              return 18;
              break;
            case 6:
              return 20;
              break;
            case 7:
              this.popState("escaped_text");
              return 18;
              break;
            case 8:
              return 19;
              break;
          }
        }, "anonymous"),
        rules: [/^(?:sankey-beta\b)/i, /^(?:sankey\b)/i, /^(?:$)/i, /^(?:((\u000D\u000A)|(\u000A)))/i, /^(?:(\u002C))/i, /^(?:(\u0022))/i, /^(?:([\u0020-\u0021\u0023-\u002B\u002D-\u007E])*)/i, /^(?:(\u0022)(?!(\u0022)))/i, /^(?:(([\u0020-\u0021\u0023-\u002B\u002D-\u007E])|(\u002C)|(\u000D)|(\u000A)|(\u0022)(\u0022))*)/i],
        conditions: {
          "csv": {
            "rules": [2, 3, 4, 5, 6, 7, 8],
            "inclusive": false
          },
          "escaped_text": {
            "rules": [7, 8],
            "inclusive": false
          },
          "INITIAL": {
            "rules": [0, 1, 2, 3, 4, 5, 6, 7, 8],
            "inclusive": true
          }
        }
      };
      return lexer2;
    }();
    parser2.lexer = lexer;
    function Parser() {
      this.yy = {};
    }
    (0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(Parser, "Parser");
    Parser.prototype = parser2;
    parser2.Parser = Parser;
    return new Parser();
  }();
  parser.parser = parser;
  var sankey_default = parser;

  // src/diagrams/sankey/sankeyDB.ts
  var links = [];
  var nodes = [];
  var nodesMap = /* @__PURE__ */new Map();
  var clear2 = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(() => {
    links = [];
    nodes = [];
    nodesMap = /* @__PURE__ */new Map();
    (0, require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").clear)();
  }, "clear");
  var SankeyLink = (_Class = class SankeyLink {
    constructor(source, target, value = 0) {
      this.source = source;
      this.target = target;
      this.value = value;
    }
  }, (0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(_Class, "SankeyLink"), _Class);
  var addLink = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)((source, target, value) => {
    links.push(new SankeyLink(source, target, value));
  }, "addLink");
  var SankeyNode = (_Class2 = class SankeyNode {
    constructor(ID) {
      this.ID = ID;
    }
  }, (0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(_Class2, "SankeyNode"), _Class2);
  var findOrCreateNode = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(ID => {
    ID = require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").common_default.sanitizeText(ID, (0, require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").getConfig2)());
    let node = nodesMap.get(ID);
    if (node === void 0) {
      node = new SankeyNode(ID);
      nodesMap.set(ID, node);
      nodes.push(node);
    }
    return node;
  }, "findOrCreateNode");
  var getNodes = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(() => nodes, "getNodes");
  var getLinks = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(() => links, "getLinks");
  var getGraph = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(() => ({
    nodes: nodes.map(node => ({
      id: node.ID
    })),
    links: links.map(link => ({
      source: link.source.ID,
      target: link.target.ID,
      value: link.value
    }))
  }), "getGraph");
  var sankeyDB_default = {
    nodesMap,
    getConfig: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(() => (0, require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").getConfig2)().sankey, "getConfig"),
    getNodes,
    getLinks,
    getGraph,
    addLink,
    findOrCreateNode,
    getAccTitle: require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").getAccTitle,
    setAccTitle: require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").setAccTitle,
    getAccDescription: require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").getAccDescription,
    setAccDescription: require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").setAccDescription,
    getDiagramTitle: require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").getDiagramTitle,
    setDiagramTitle: require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").setDiagramTitle,
    clear: clear2
  };

  // src/diagrams/sankey/sankeyRenderer.ts

  // src/rendering-util/uid.ts
  var Uid = (_Uid2 = class _Uid {
    static next(name) {
      return new _Uid(name + ++_Uid.count);
    }
    constructor(id) {
      this.id = id;
      this.href = `#${id}`;
    }
    toString() {
      return "url(" + this.href + ")";
    }
  }, (0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(_Uid2, "Uid"), _Uid2.count = 0, _Uid2);

  // src/diagrams/sankey/sankeyRenderer.ts
  var alignmentsMap = {
    left: require(_dependencyMap[2], "d3-sankey").sankeyLeft,
    right: require(_dependencyMap[2], "d3-sankey").sankeyRight,
    center: require(_dependencyMap[2], "d3-sankey").sankeyCenter,
    justify: require(_dependencyMap[2], "d3-sankey").sankeyJustify
  };
  var draw = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(function (text, id, _version, diagObj) {
    const {
      securityLevel,
      sankey: conf
    } = (0, require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").getConfig2)();
    const defaultSankeyConfig = require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").defaultConfig2.sankey;
    let sandboxElement;
    if (securityLevel === "sandbox") {
      sandboxElement = (0, require(_dependencyMap[3], "d3").select)("#i" + id);
    }
    const root = securityLevel === "sandbox" ? (0, require(_dependencyMap[3], "d3").select)(sandboxElement.nodes()[0].contentDocument.body) : (0, require(_dependencyMap[3], "d3").select)("body");
    const svg = securityLevel === "sandbox" ? root.select(`[id="${id}"]`) : (0, require(_dependencyMap[3], "d3").select)(`[id="${id}"]`);
    const width = conf?.width ?? defaultSankeyConfig.width;
    const height = conf?.height ?? defaultSankeyConfig.width;
    const useMaxWidth = conf?.useMaxWidth ?? defaultSankeyConfig.useMaxWidth;
    const nodeAlignment = conf?.nodeAlignment ?? defaultSankeyConfig.nodeAlignment;
    const prefix = conf?.prefix ?? defaultSankeyConfig.prefix;
    const suffix = conf?.suffix ?? defaultSankeyConfig.suffix;
    const showValues = conf?.showValues ?? defaultSankeyConfig.showValues;
    const graph = diagObj.db.getGraph();
    const nodeAlign = alignmentsMap[nodeAlignment];
    const nodeWidth = 10;
    const sankey = (0, require(_dependencyMap[2], "d3-sankey").sankey)().nodeId(d => d.id).nodeWidth(nodeWidth).nodePadding(10 + (showValues ? 15 : 0)).nodeAlign(nodeAlign).extent([[0, 0], [width, height]]);
    sankey(graph);
    const colorScheme = (0, require(_dependencyMap[3], "d3").scaleOrdinal)(require(_dependencyMap[3], "d3").schemeTableau10);
    svg.append("g").attr("class", "nodes").selectAll(".node").data(graph.nodes).join("g").attr("class", "node").attr("id", d => (d.uid = Uid.next("node-")).id).attr("transform", function (d) {
      return "translate(" + d.x0 + "," + d.y0 + ")";
    }).attr("x", d => d.x0).attr("y", d => d.y0).append("rect").attr("height", d => {
      return d.y1 - d.y0;
    }).attr("width", d => d.x1 - d.x0).attr("fill", d => colorScheme(d.id));
    const getText = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(({
      id: id2,
      value
    }) => {
      if (!showValues) {
        return id2;
      }
      return `${id2}
${prefix}${Math.round(value * 100) / 100}${suffix}`;
    }, "getText");
    svg.append("g").attr("class", "node-labels").attr("font-size", 14).selectAll("text").data(graph.nodes).join("text").attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6).attr("y", d => (d.y1 + d.y0) / 2).attr("dy", `${showValues ? "0" : "0.35"}em`).attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end").text(getText);
    const link = svg.append("g").attr("class", "links").attr("fill", "none").attr("stroke-opacity", 0.5).selectAll(".link").data(graph.links).join("g").attr("class", "link").style("mix-blend-mode", "multiply");
    const linkColor = conf?.linkColor ?? "gradient";
    if (linkColor === "gradient") {
      const gradient = link.append("linearGradient").attr("id", d => (d.uid = Uid.next("linearGradient-")).id).attr("gradientUnits", "userSpaceOnUse").attr("x1", d => d.source.x1).attr("x2", d => d.target.x0);
      gradient.append("stop").attr("offset", "0%").attr("stop-color", d => colorScheme(d.source.id));
      gradient.append("stop").attr("offset", "100%").attr("stop-color", d => colorScheme(d.target.id));
    }
    let coloring;
    switch (linkColor) {
      case "gradient":
        coloring = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(d => d.uid, "coloring");
        break;
      case "source":
        coloring = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(d => colorScheme(d.source.id), "coloring");
        break;
      case "target":
        coloring = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(d => colorScheme(d.target.id), "coloring");
        break;
      default:
        coloring = linkColor;
    }
    link.append("path").attr("d", (0, require(_dependencyMap[2], "d3-sankey").sankeyLinkHorizontal)()).attr("stroke", coloring).attr("stroke-width", d => Math.max(1, d.width));
    (0, require(_dependencyMap[1], "./chunk-ABZYJK2D.mjs").setupGraphViewbox)(void 0, svg, 0, useMaxWidth);
  }, "draw");
  var sankeyRenderer_default = {
    draw
  };

  // src/diagrams/sankey/sankeyUtils.ts
  var prepareTextForParsing = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(text => {
    const textToParse = text.replaceAll(/^[^\S\n\r]+|[^\S\n\r]+$/g, "").replaceAll(/([\n\r])+/g, "\n").trim();
    return textToParse;
  }, "prepareTextForParsing");

  // src/diagrams/sankey/styles.js
  var getStyles = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(options => `.label {
      font-family: ${options.fontFamily};
    }`, "getStyles");
  var styles_default = getStyles;

  // src/diagrams/sankey/sankeyDiagram.ts
  var originalParse = sankey_default.parse.bind(sankey_default);
  sankey_default.parse = text => originalParse(prepareTextForParsing(text));
  var diagram = exports.diagram = {
    styles: styles_default,
    parser: sankey_default,
    db: sankeyDB_default,
    renderer: sankeyRenderer_default
  };
},3876,[3854,3872,3959,3884],"../../node_modules/mermaid/dist/chunks/mermaid.core/sankeyDiagram-TZEHDZUN.mjs");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "sankey", {
    enumerable: true,
    get: function () {
      return _sankey.default;
    }
  });
  Object.defineProperty(exports, "sankeyCenter", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./align.js").center;
    }
  });
  Object.defineProperty(exports, "sankeyJustify", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./align.js").justify;
    }
  });
  Object.defineProperty(exports, "sankeyLeft", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./align.js").left;
    }
  });
  Object.defineProperty(exports, "sankeyLinkHorizontal", {
    enumerable: true,
    get: function () {
      return _sankeyLinkHorizontal.default;
    }
  });
  Object.defineProperty(exports, "sankeyRight", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./align.js").right;
    }
  });
  var _sankey = _interopRequireDefault(require(_dependencyMap[2], "./sankey.js"));
  var _sankeyLinkHorizontal = _interopRequireDefault(require(_dependencyMap[3], "./sankeyLinkHorizontal.js"));
},3959,[10,3960,4021,4023],"../../node_modules/d3-sankey/src/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.center = center;
  exports.justify = justify;
  exports.left = left;
  exports.right = right;
  function targetDepth(d) {
    return d.target.depth;
  }
  function left(node) {
    return node.depth;
  }
  function right(node, n) {
    return n - 1 - node.height;
  }
  function justify(node, n) {
    return node.sourceLinks.length ? node.depth : n - 1;
  }
  function center(node) {
    return node.targetLinks.length ? node.depth : node.sourceLinks.length ? (0, require(_dependencyMap[0], "d3-array").min)(node.sourceLinks, targetDepth) - 1 : 0;
  }
},3960,[3961],"../../node_modules/d3-sankey/src/align.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "Adder", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./fsum.js").Adder;
    }
  });
  Object.defineProperty(exports, "InternMap", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[2], "internmap").InternMap;
    }
  });
  Object.defineProperty(exports, "InternSet", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[2], "internmap").InternSet;
    }
  });
  Object.defineProperty(exports, "ascending", {
    enumerable: true,
    get: function () {
      return _ascending.default;
    }
  });
  Object.defineProperty(exports, "bin", {
    enumerable: true,
    get: function () {
      return _bin.default;
    }
  });
  Object.defineProperty(exports, "bisect", {
    enumerable: true,
    get: function () {
      return _bisect.default;
    }
  });
  Object.defineProperty(exports, "bisectCenter", {
    enumerable: true,
    get: function () {
      return _bisect.bisectCenter;
    }
  });
  Object.defineProperty(exports, "bisectLeft", {
    enumerable: true,
    get: function () {
      return _bisect.bisectLeft;
    }
  });
  Object.defineProperty(exports, "bisectRight", {
    enumerable: true,
    get: function () {
      return _bisect.bisectRight;
    }
  });
  Object.defineProperty(exports, "bisector", {
    enumerable: true,
    get: function () {
      return _bisector.default;
    }
  });
  Object.defineProperty(exports, "count", {
    enumerable: true,
    get: function () {
      return _count.default;
    }
  });
  Object.defineProperty(exports, "cross", {
    enumerable: true,
    get: function () {
      return _cross.default;
    }
  });
  Object.defineProperty(exports, "cumsum", {
    enumerable: true,
    get: function () {
      return _cumsum.default;
    }
  });
  Object.defineProperty(exports, "descending", {
    enumerable: true,
    get: function () {
      return _descending.default;
    }
  });
  Object.defineProperty(exports, "deviation", {
    enumerable: true,
    get: function () {
      return _deviation.default;
    }
  });
  Object.defineProperty(exports, "difference", {
    enumerable: true,
    get: function () {
      return _difference.default;
    }
  });
  Object.defineProperty(exports, "disjoint", {
    enumerable: true,
    get: function () {
      return _disjoint.default;
    }
  });
  Object.defineProperty(exports, "every", {
    enumerable: true,
    get: function () {
      return _every.default;
    }
  });
  Object.defineProperty(exports, "extent", {
    enumerable: true,
    get: function () {
      return _extent.default;
    }
  });
  Object.defineProperty(exports, "fcumsum", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./fsum.js").fcumsum;
    }
  });
  Object.defineProperty(exports, "filter", {
    enumerable: true,
    get: function () {
      return _filter.default;
    }
  });
  Object.defineProperty(exports, "fsum", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./fsum.js").fsum;
    }
  });
  Object.defineProperty(exports, "greatest", {
    enumerable: true,
    get: function () {
      return _greatest.default;
    }
  });
  Object.defineProperty(exports, "greatestIndex", {
    enumerable: true,
    get: function () {
      return _greatestIndex.default;
    }
  });
  Object.defineProperty(exports, "group", {
    enumerable: true,
    get: function () {
      return _group.default;
    }
  });
  Object.defineProperty(exports, "groupSort", {
    enumerable: true,
    get: function () {
      return _groupSort.default;
    }
  });
  Object.defineProperty(exports, "groups", {
    enumerable: true,
    get: function () {
      return _group.groups;
    }
  });
  Object.defineProperty(exports, "histogram", {
    enumerable: true,
    get: function () {
      return _bin.default;
    }
  });
  Object.defineProperty(exports, "index", {
    enumerable: true,
    get: function () {
      return _group.index;
    }
  });
  Object.defineProperty(exports, "indexes", {
    enumerable: true,
    get: function () {
      return _group.indexes;
    }
  });
  Object.defineProperty(exports, "intersection", {
    enumerable: true,
    get: function () {
      return _intersection.default;
    }
  });
  Object.defineProperty(exports, "least", {
    enumerable: true,
    get: function () {
      return _least.default;
    }
  });
  Object.defineProperty(exports, "leastIndex", {
    enumerable: true,
    get: function () {
      return _leastIndex.default;
    }
  });
  Object.defineProperty(exports, "map", {
    enumerable: true,
    get: function () {
      return _map.default;
    }
  });
  Object.defineProperty(exports, "max", {
    enumerable: true,
    get: function () {
      return _max.default;
    }
  });
  Object.defineProperty(exports, "maxIndex", {
    enumerable: true,
    get: function () {
      return _maxIndex.default;
    }
  });
  Object.defineProperty(exports, "mean", {
    enumerable: true,
    get: function () {
      return _mean.default;
    }
  });
  Object.defineProperty(exports, "median", {
    enumerable: true,
    get: function () {
      return _median.default;
    }
  });
  Object.defineProperty(exports, "merge", {
    enumerable: true,
    get: function () {
      return _merge.default;
    }
  });
  Object.defineProperty(exports, "min", {
    enumerable: true,
    get: function () {
      return _min.default;
    }
  });
  Object.defineProperty(exports, "minIndex", {
    enumerable: true,
    get: function () {
      return _minIndex.default;
    }
  });
  Object.defineProperty(exports, "nice", {
    enumerable: true,
    get: function () {
      return _nice.default;
    }
  });
  Object.defineProperty(exports, "pairs", {
    enumerable: true,
    get: function () {
      return _pairs.default;
    }
  });
  Object.defineProperty(exports, "permute", {
    enumerable: true,
    get: function () {
      return _permute.default;
    }
  });
  Object.defineProperty(exports, "quantile", {
    enumerable: true,
    get: function () {
      return _quantile.default;
    }
  });
  Object.defineProperty(exports, "quantileSorted", {
    enumerable: true,
    get: function () {
      return _quantile.quantileSorted;
    }
  });
  Object.defineProperty(exports, "quickselect", {
    enumerable: true,
    get: function () {
      return _quickselect.default;
    }
  });
  Object.defineProperty(exports, "range", {
    enumerable: true,
    get: function () {
      return _range.default;
    }
  });
  Object.defineProperty(exports, "reduce", {
    enumerable: true,
    get: function () {
      return _reduce.default;
    }
  });
  Object.defineProperty(exports, "reverse", {
    enumerable: true,
    get: function () {
      return _reverse.default;
    }
  });
  Object.defineProperty(exports, "rollup", {
    enumerable: true,
    get: function () {
      return _group.rollup;
    }
  });
  Object.defineProperty(exports, "rollups", {
    enumerable: true,
    get: function () {
      return _group.rollups;
    }
  });
  Object.defineProperty(exports, "scan", {
    enumerable: true,
    get: function () {
      return _scan.default;
    }
  });
  Object.defineProperty(exports, "shuffle", {
    enumerable: true,
    get: function () {
      return _shuffle.default;
    }
  });
  Object.defineProperty(exports, "shuffler", {
    enumerable: true,
    get: function () {
      return _shuffle.shuffler;
    }
  });
  Object.defineProperty(exports, "some", {
    enumerable: true,
    get: function () {
      return _some.default;
    }
  });
  Object.defineProperty(exports, "sort", {
    enumerable: true,
    get: function () {
      return _sort.default;
    }
  });
  Object.defineProperty(exports, "subset", {
    enumerable: true,
    get: function () {
      return _subset.default;
    }
  });
  Object.defineProperty(exports, "sum", {
    enumerable: true,
    get: function () {
      return _sum.default;
    }
  });
  Object.defineProperty(exports, "superset", {
    enumerable: true,
    get: function () {
      return _superset.default;
    }
  });
  Object.defineProperty(exports, "thresholdFreedmanDiaconis", {
    enumerable: true,
    get: function () {
      return _freedmanDiaconis.default;
    }
  });
  Object.defineProperty(exports, "thresholdScott", {
    enumerable: true,
    get: function () {
      return _scott.default;
    }
  });
  Object.defineProperty(exports, "thresholdSturges", {
    enumerable: true,
    get: function () {
      return _sturges.default;
    }
  });
  Object.defineProperty(exports, "tickIncrement", {
    enumerable: true,
    get: function () {
      return _ticks.tickIncrement;
    }
  });
  Object.defineProperty(exports, "tickStep", {
    enumerable: true,
    get: function () {
      return _ticks.tickStep;
    }
  });
  Object.defineProperty(exports, "ticks", {
    enumerable: true,
    get: function () {
      return _ticks.default;
    }
  });
  Object.defineProperty(exports, "transpose", {
    enumerable: true,
    get: function () {
      return _transpose.default;
    }
  });
  Object.defineProperty(exports, "union", {
    enumerable: true,
    get: function () {
      return _union.default;
    }
  });
  Object.defineProperty(exports, "variance", {
    enumerable: true,
    get: function () {
      return _variance.default;
    }
  });
  Object.defineProperty(exports, "zip", {
    enumerable: true,
    get: function () {
      return _zip.default;
    }
  });
  var _bisect = _interopRequireWildcard(require(_dependencyMap[3], "./bisect.js"));
  var _ascending = _interopRequireDefault(require(_dependencyMap[4], "./ascending.js"));
  var _bisector = _interopRequireDefault(require(_dependencyMap[5], "./bisector.js"));
  var _count = _interopRequireDefault(require(_dependencyMap[6], "./count.js"));
  var _cross = _interopRequireDefault(require(_dependencyMap[7], "./cross.js"));
  var _cumsum = _interopRequireDefault(require(_dependencyMap[8], "./cumsum.js"));
  var _descending = _interopRequireDefault(require(_dependencyMap[9], "./descending.js"));
  var _deviation = _interopRequireDefault(require(_dependencyMap[10], "./deviation.js"));
  var _extent = _interopRequireDefault(require(_dependencyMap[11], "./extent.js"));
  var _group = _interopRequireWildcard(require(_dependencyMap[12], "./group.js"));
  var _groupSort = _interopRequireDefault(require(_dependencyMap[13], "./groupSort.js"));
  var _bin = _interopRequireDefault(require(_dependencyMap[14], "./bin.js"));
  var _freedmanDiaconis = _interopRequireDefault(require(_dependencyMap[15], "./threshold/freedmanDiaconis.js"));
  var _scott = _interopRequireDefault(require(_dependencyMap[16], "./threshold/scott.js"));
  var _sturges = _interopRequireDefault(require(_dependencyMap[17], "./threshold/sturges.js"));
  var _max = _interopRequireDefault(require(_dependencyMap[18], "./max.js"));
  var _maxIndex = _interopRequireDefault(require(_dependencyMap[19], "./maxIndex.js"));
  var _mean = _interopRequireDefault(require(_dependencyMap[20], "./mean.js"));
  var _median = _interopRequireDefault(require(_dependencyMap[21], "./median.js"));
  var _merge = _interopRequireDefault(require(_dependencyMap[22], "./merge.js"));
  var _min = _interopRequireDefault(require(_dependencyMap[23], "./min.js"));
  var _minIndex = _interopRequireDefault(require(_dependencyMap[24], "./minIndex.js"));
  var _nice = _interopRequireDefault(require(_dependencyMap[25], "./nice.js"));
  var _pairs = _interopRequireDefault(require(_dependencyMap[26], "./pairs.js"));
  var _permute = _interopRequireDefault(require(_dependencyMap[27], "./permute.js"));
  var _quantile = _interopRequireWildcard(require(_dependencyMap[28], "./quantile.js"));
  var _quickselect = _interopRequireDefault(require(_dependencyMap[29], "./quickselect.js"));
  var _range = _interopRequireDefault(require(_dependencyMap[30], "./range.js"));
  var _least = _interopRequireDefault(require(_dependencyMap[31], "./least.js"));
  var _leastIndex = _interopRequireDefault(require(_dependencyMap[32], "./leastIndex.js"));
  var _greatest = _interopRequireDefault(require(_dependencyMap[33], "./greatest.js"));
  var _greatestIndex = _interopRequireDefault(require(_dependencyMap[34], "./greatestIndex.js"));
  var _scan = _interopRequireDefault(require(_dependencyMap[35], "./scan.js"));
  var _shuffle = _interopRequireWildcard(require(_dependencyMap[36], "./shuffle.js"));
  var _sum = _interopRequireDefault(require(_dependencyMap[37], "./sum.js"));
  var _ticks = _interopRequireWildcard(require(_dependencyMap[38], "./ticks.js"));
  var _transpose = _interopRequireDefault(require(_dependencyMap[39], "./transpose.js"));
  var _variance = _interopRequireDefault(require(_dependencyMap[40], "./variance.js"));
  var _zip = _interopRequireDefault(require(_dependencyMap[41], "./zip.js"));
  var _every = _interopRequireDefault(require(_dependencyMap[42], "./every.js"));
  var _some = _interopRequireDefault(require(_dependencyMap[43], "./some.js"));
  var _filter = _interopRequireDefault(require(_dependencyMap[44], "./filter.js"));
  var _map = _interopRequireDefault(require(_dependencyMap[45], "./map.js"));
  var _reduce = _interopRequireDefault(require(_dependencyMap[46], "./reduce.js"));
  var _reverse = _interopRequireDefault(require(_dependencyMap[47], "./reverse.js"));
  var _sort = _interopRequireDefault(require(_dependencyMap[48], "./sort.js"));
  var _difference = _interopRequireDefault(require(_dependencyMap[49], "./difference.js"));
  var _disjoint = _interopRequireDefault(require(_dependencyMap[50], "./disjoint.js"));
  var _intersection = _interopRequireDefault(require(_dependencyMap[51], "./intersection.js"));
  var _subset = _interopRequireDefault(require(_dependencyMap[52], "./subset.js"));
  var _superset = _interopRequireDefault(require(_dependencyMap[53], "./superset.js"));
  var _union = _interopRequireDefault(require(_dependencyMap[54], "./union.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
},3961,[10,3962,3963,3964,3965,3966,3968,3969,3970,3971,3972,3974,3975,3977,3980,3986,3991,3984,3988,3992,3993,3994,3995,3989,3996,3982,3997,3979,3987,3990,3998,3999,4000,4001,4002,4003,4004,4005,3983,4006,3973,4007,4008,4009,4010,4011,4012,4013,3978,4014,4015,4016,4018,4019,4020],"../../node_modules/d3-sankey/node_modules/d3-array/src/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Adder = void 0;
  exports.fcumsum = fcumsum;
  exports.fsum = fsum;
  // https://github.com/python/cpython/blob/a74eea238f5baba15797e2e8b570d153bc8690a7/Modules/mathmodule.c#L1423
  class Adder {
    constructor() {
      this._partials = new Float64Array(32);
      this._n = 0;
    }
    add(x) {
      const p = this._partials;
      let i = 0;
      for (let j = 0; j < this._n && j < 32; j++) {
        const y = p[j],
          hi = x + y,
          lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x);
        if (lo) p[i++] = lo;
        x = hi;
      }
      p[i] = x;
      this._n = i + 1;
      return this;
    }
    valueOf() {
      const p = this._partials;
      let n = this._n,
        x,
        y,
        lo,
        hi = 0;
      if (n > 0) {
        hi = p[--n];
        while (n > 0) {
          x = hi;
          y = p[--n];
          hi = x + y;
          lo = y - (hi - x);
          if (lo) break;
        }
        if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
          y = lo * 2;
          x = hi + y;
          if (y == x - hi) hi = x;
        }
      }
      return hi;
    }
  }
  exports.Adder = Adder;
  function fsum(values, valueof) {
    const adder = new Adder();
    if (valueof === undefined) {
      for (let value of values) {
        if (value = +value) {
          adder.add(value);
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if (value = +valueof(value, ++index, values)) {
          adder.add(value);
        }
      }
    }
    return +adder;
  }
  function fcumsum(values, valueof) {
    const adder = new Adder();
    let index = -1;
    return Float64Array.from(values, valueof === undefined ? v => adder.add(+v || 0) : v => adder.add(+valueof(v, ++index, values) || 0));
  }
},3962,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/fsum.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.InternSet = exports.InternMap = void 0;
  class InternMap extends Map {
    constructor(entries, key = keyof) {
      super();
      Object.defineProperties(this, {
        _intern: {
          value: new Map()
        },
        _key: {
          value: key
        }
      });
      if (entries != null) for (const [key, value] of entries) this.set(key, value);
    }
    get(key) {
      return super.get(intern_get(this, key));
    }
    has(key) {
      return super.has(intern_get(this, key));
    }
    set(key, value) {
      return super.set(intern_set(this, key), value);
    }
    delete(key) {
      return super.delete(intern_delete(this, key));
    }
  }
  exports.InternMap = InternMap;
  class InternSet extends Set {
    constructor(values, key = keyof) {
      super();
      Object.defineProperties(this, {
        _intern: {
          value: new Map()
        },
        _key: {
          value: key
        }
      });
      if (values != null) for (const value of values) this.add(value);
    }
    has(value) {
      return super.has(intern_get(this, value));
    }
    add(value) {
      return super.add(intern_set(this, value));
    }
    delete(value) {
      return super.delete(intern_delete(this, value));
    }
  }
  exports.InternSet = InternSet;
  function intern_get({
    _intern,
    _key
  }, value) {
    const key = _key(value);
    return _intern.has(key) ? _intern.get(key) : value;
  }
  function intern_set({
    _intern,
    _key
  }, value) {
    const key = _key(value);
    if (_intern.has(key)) return _intern.get(key);
    _intern.set(key, value);
    return value;
  }
  function intern_delete({
    _intern,
    _key
  }, value) {
    const key = _key(value);
    if (_intern.has(key)) {
      value = _intern.get(value);
      _intern.delete(key);
    }
    return value;
  }
  function keyof(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }
},3963,[],"../../node_modules/d3-sankey/node_modules/internmap/src/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = exports.bisectRight = exports.bisectLeft = exports.bisectCenter = void 0;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  var _bisector = _interopRequireDefault(require(_dependencyMap[2], "./bisector.js"));
  var _number = _interopRequireDefault(require(_dependencyMap[3], "./number.js"));
  const ascendingBisect = (0, _bisector.default)(_ascending.default);
  const bisectRight = exports.bisectRight = ascendingBisect.right;
  const bisectLeft = exports.bisectLeft = ascendingBisect.left;
  const bisectCenter = exports.bisectCenter = (0, _bisector.default)(_number.default).center;
  var _default = exports.default = bisectRight;
},3964,[10,3965,3966,3967],"../../node_modules/d3-sankey/node_modules/d3-array/src/bisect.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
},3965,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/ascending.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  function _default(f) {
    let delta = f;
    let compare = f;
    if (f.length === 1) {
      delta = (d, x) => f(d) - x;
      compare = ascendingComparator(f);
    }
    function left(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        const mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;else hi = mid;
      }
      return lo;
    }
    function right(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        const mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;else lo = mid + 1;
      }
      return lo;
    }
    function center(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      const i = left(a, x, lo, hi - 1);
      return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
    }
    return {
      left,
      center,
      right
    };
  }
  function ascendingComparator(f) {
    return (d, x) => (0, _ascending.default)(f(d), x);
  }
},3966,[10,3965],"../../node_modules/d3-sankey/node_modules/d3-array/src/bisector.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  exports.numbers = numbers;
  function _default(x) {
    return x === null ? NaN : +x;
  }
  function* numbers(values, valueof) {
    if (valueof === undefined) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          yield value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
          yield value;
        }
      }
    }
  }
},3967,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/number.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = count;
  function count(values, valueof) {
    let count = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          ++count;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
          ++count;
        }
      }
    }
    return count;
  }
},3968,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/count.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = cross;
  function length(array) {
    return array.length | 0;
  }
  function empty(length) {
    return !(length > 0);
  }
  function arrayify(values) {
    return typeof values !== "object" || "length" in values ? values : Array.from(values);
  }
  function reducer(reduce) {
    return values => reduce(...values);
  }
  function cross(...values) {
    const reduce = typeof values[values.length - 1] === "function" && reducer(values.pop());
    values = values.map(arrayify);
    const lengths = values.map(length);
    const j = values.length - 1;
    const index = new Array(j + 1).fill(0);
    const product = [];
    if (j < 0 || lengths.some(empty)) return product;
    while (true) {
      product.push(index.map((j, i) => values[i][j]));
      let i = j;
      while (++index[i] === lengths[i]) {
        if (i === 0) return reduce ? product.map(reduce) : product;
        index[i--] = 0;
      }
    }
  }
},3969,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/cross.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = cumsum;
  function cumsum(values, valueof) {
    var sum = 0,
      index = 0;
    return Float64Array.from(values, valueof === undefined ? v => sum += +v || 0 : v => sum += +valueof(v, index++, values) || 0);
  }
},3970,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/cumsum.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }
},3971,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/descending.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = deviation;
  var _variance = _interopRequireDefault(require(_dependencyMap[1], "./variance.js"));
  function deviation(values, valueof) {
    const v = (0, _variance.default)(values, valueof);
    return v ? Math.sqrt(v) : v;
  }
},3972,[10,3973],"../../node_modules/d3-sankey/node_modules/d3-array/src/deviation.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = variance;
  function variance(values, valueof) {
    let count = 0;
    let delta;
    let mean = 0;
    let sum = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          delta = value - mean;
          mean += delta / ++count;
          sum += delta * (value - mean);
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
          delta = value - mean;
          mean += delta / ++count;
          sum += delta * (value - mean);
        }
      }
    }
    if (count > 1) return sum / (count - 1);
  }
},3973,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/variance.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(values, valueof) {
    let min;
    let max;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
    return [min, max];
  }
},3974,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/extent.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = group;
  exports.groups = groups;
  exports.index = index;
  exports.indexes = indexes;
  exports.rollup = rollup;
  exports.rollups = rollups;
  var _identity = _interopRequireDefault(require(_dependencyMap[1], "./identity.js"));
  function group(values, ...keys) {
    return nest(values, _identity.default, _identity.default, keys);
  }
  function groups(values, ...keys) {
    return nest(values, Array.from, _identity.default, keys);
  }
  function rollup(values, reduce, ...keys) {
    return nest(values, _identity.default, reduce, keys);
  }
  function rollups(values, reduce, ...keys) {
    return nest(values, Array.from, reduce, keys);
  }
  function index(values, ...keys) {
    return nest(values, _identity.default, unique, keys);
  }
  function indexes(values, ...keys) {
    return nest(values, Array.from, unique, keys);
  }
  function unique(values) {
    if (values.length !== 1) throw new Error("duplicate key");
    return values[0];
  }
  function nest(values, map, reduce, keys) {
    return function regroup(values, i) {
      if (i >= keys.length) return reduce(values);
      const groups = new (require(_dependencyMap[2], "internmap").InternMap)();
      const keyof = keys[i++];
      let index = -1;
      for (const value of values) {
        const key = keyof(value, ++index, values);
        const group = groups.get(key);
        if (group) group.push(value);else groups.set(key, [value]);
      }
      for (const [key, values] of groups) {
        groups.set(key, regroup(values, i));
      }
      return map(groups);
    }(values, 0);
  }
},3975,[10,3976,3963],"../../node_modules/d3-sankey/node_modules/d3-array/src/group.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(x) {
    return x;
  }
},3976,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/identity.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = groupSort;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  var _group = _interopRequireWildcard(require(_dependencyMap[2], "./group.js"));
  var _sort = _interopRequireDefault(require(_dependencyMap[3], "./sort.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  function groupSort(values, reduce, key) {
    return (reduce.length === 1 ? (0, _sort.default)((0, _group.rollup)(values, reduce, key), ([ak, av], [bk, bv]) => (0, _ascending.default)(av, bv) || (0, _ascending.default)(ak, bk)) : (0, _sort.default)((0, _group.default)(values, key), ([ak, av], [bk, bv]) => reduce(av, bv) || (0, _ascending.default)(ak, bk))).map(([key]) => key);
  }
},3977,[10,3965,3975,3978],"../../node_modules/d3-sankey/node_modules/d3-array/src/groupSort.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = sort;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  var _permute = _interopRequireDefault(require(_dependencyMap[2], "./permute.js"));
  function sort(values, ...F) {
    if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
    values = Array.from(values);
    let [f = _ascending.default] = F;
    if (f.length === 1 || F.length > 1) {
      const index = Uint32Array.from(values, (d, i) => i);
      if (F.length > 1) {
        F = F.map(f => values.map(f));
        index.sort((i, j) => {
          for (const f of F) {
            const c = (0, _ascending.default)(f[i], f[j]);
            if (c) return c;
          }
        });
      } else {
        f = values.map(f);
        index.sort((i, j) => (0, _ascending.default)(f[i], f[j]));
      }
      return (0, _permute.default)(values, index);
    }
    return values.sort(f);
  }
},3978,[10,3965,3979],"../../node_modules/d3-sankey/node_modules/d3-array/src/sort.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(source, keys) {
    return Array.from(keys, key => source[key]);
  }
},3979,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/permute.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _bisect = _interopRequireDefault(require(_dependencyMap[1], "./bisect.js"));
  var _constant = _interopRequireDefault(require(_dependencyMap[2], "./constant.js"));
  var _extent = _interopRequireDefault(require(_dependencyMap[3], "./extent.js"));
  var _identity = _interopRequireDefault(require(_dependencyMap[4], "./identity.js"));
  var _nice = _interopRequireDefault(require(_dependencyMap[5], "./nice.js"));
  var _ticks = _interopRequireWildcard(require(_dependencyMap[6], "./ticks.js"));
  var _sturges = _interopRequireDefault(require(_dependencyMap[7], "./threshold/sturges.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  function _default() {
    var value = _identity.default,
      domain = _extent.default,
      threshold = _sturges.default;
    function histogram(data) {
      if (!Array.isArray(data)) data = Array.from(data);
      var i,
        n = data.length,
        x,
        values = new Array(n);
      for (i = 0; i < n; ++i) {
        values[i] = value(data[i], i, data);
      }
      var xz = domain(values),
        x0 = xz[0],
        x1 = xz[1],
        tz = threshold(values, x0, x1);

      // Convert number of thresholds into uniform thresholds, and nice the
      // default domain accordingly.
      if (!Array.isArray(tz)) {
        const max = x1,
          tn = +tz;
        if (domain === _extent.default) [x0, x1] = (0, _nice.default)(x0, x1, tn);
        tz = (0, _ticks.default)(x0, x1, tn);

        // If the last threshold is coincident with the domain’s upper bound, the
        // last bin will be zero-width. If the default domain is used, and this
        // last threshold is coincident with the maximum input value, we can
        // extend the niced upper bound by one tick to ensure uniform bin widths;
        // otherwise, we simply remove the last threshold. Note that we don’t
        // coerce values or the domain to numbers, and thus must be careful to
        // compare order (>=) rather than strict equality (===)!
        if (tz[tz.length - 1] >= x1) {
          if (max >= x1 && domain === _extent.default) {
            const step = (0, _ticks.tickIncrement)(x0, x1, tn);
            if (isFinite(step)) {
              if (step > 0) {
                x1 = (Math.floor(x1 / step) + 1) * step;
              } else if (step < 0) {
                x1 = (Math.ceil(x1 * -step) + 1) / -step;
              }
            }
          } else {
            tz.pop();
          }
        }
      }

      // Remove any thresholds outside the domain.
      var m = tz.length;
      while (tz[0] <= x0) tz.shift(), --m;
      while (tz[m - 1] > x1) tz.pop(), --m;
      var bins = new Array(m + 1),
        bin;

      // Initialize bins.
      for (i = 0; i <= m; ++i) {
        bin = bins[i] = [];
        bin.x0 = i > 0 ? tz[i - 1] : x0;
        bin.x1 = i < m ? tz[i] : x1;
      }

      // Assign data to bins by value, ignoring any outside the domain.
      for (i = 0; i < n; ++i) {
        x = values[i];
        if (x0 <= x && x <= x1) {
          bins[(0, _bisect.default)(tz, x, 0, m)].push(data[i]);
        }
      }
      return bins;
    }
    histogram.value = function (_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : (0, _constant.default)(_), histogram) : value;
    };
    histogram.domain = function (_) {
      return arguments.length ? (domain = typeof _ === "function" ? _ : (0, _constant.default)([_[0], _[1]]), histogram) : domain;
    };
    histogram.thresholds = function (_) {
      return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? (0, _constant.default)(require(_dependencyMap[8], "./array.js").slice.call(_)) : (0, _constant.default)(_), histogram) : threshold;
    };
    return histogram;
  }
},3980,[10,3964,3981,3974,3976,3982,3983,3984,3985],"../../node_modules/d3-sankey/node_modules/d3-array/src/bin.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(x) {
    return function () {
      return x;
    };
  }
},3981,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/constant.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = nice;
  function nice(start, stop, count) {
    let prestep;
    while (true) {
      const step = (0, require(_dependencyMap[0], "./ticks.js").tickIncrement)(start, stop, count);
      if (step === prestep || step === 0 || !isFinite(step)) {
        return [start, stop];
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      }
      prestep = step;
    }
  }
},3982,[3983],"../../node_modules/d3-sankey/node_modules/d3-array/src/nice.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  exports.tickIncrement = tickIncrement;
  exports.tickStep = tickStep;
  var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);
  function _default(start, stop, count) {
    var reverse,
      i = -1,
      n,
      ticks,
      step;
    stop = +stop, start = +start, count = +count;
    if (start === stop && count > 0) return [start];
    if (reverse = stop < start) n = start, start = stop, stop = n;
    if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];
    if (step > 0) {
      let r0 = Math.round(start / step),
        r1 = Math.round(stop / step);
      if (r0 * step < start) ++r0;
      if (r1 * step > stop) --r1;
      ticks = new Array(n = r1 - r0 + 1);
      while (++i < n) ticks[i] = (r0 + i) * step;
    } else {
      step = -step;
      let r0 = Math.round(start * step),
        r1 = Math.round(stop * step);
      if (r0 / step < start) ++r0;
      if (r1 / step > stop) --r1;
      ticks = new Array(n = r1 - r0 + 1);
      while (++i < n) ticks[i] = (r0 + i) / step;
    }
    if (reverse) ticks.reverse();
    return ticks;
  }
  function tickIncrement(start, stop, count) {
    var step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log(step) / Math.LN10),
      error = step / Math.pow(10, power);
    return power >= 0 ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power) : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
  }
  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
    if (error >= e10) step1 *= 10;else if (error >= e5) step1 *= 5;else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
  }
},3983,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/ticks.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _count = _interopRequireDefault(require(_dependencyMap[1], "../count.js"));
  function _default(values) {
    return Math.ceil(Math.log((0, _count.default)(values)) / Math.LN2) + 1;
  }
},3984,[10,3968],"../../node_modules/d3-sankey/node_modules/d3-array/src/threshold/sturges.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.slice = exports.map = void 0;
  var array = Array.prototype;
  var slice = exports.slice = array.slice;
  var map = exports.map = array.map;
},3985,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/array.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _count = _interopRequireDefault(require(_dependencyMap[1], "../count.js"));
  var _quantile = _interopRequireDefault(require(_dependencyMap[2], "../quantile.js"));
  function _default(values, min, max) {
    return Math.ceil((max - min) / (2 * ((0, _quantile.default)(values, 0.75) - (0, _quantile.default)(values, 0.25)) * Math.pow((0, _count.default)(values), -1 / 3)));
  }
},3986,[10,3968,3987],"../../node_modules/d3-sankey/node_modules/d3-array/src/threshold/freedmanDiaconis.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = quantile;
  exports.quantileSorted = quantileSorted;
  var _max = _interopRequireDefault(require(_dependencyMap[1], "./max.js"));
  var _min = _interopRequireDefault(require(_dependencyMap[2], "./min.js"));
  var _quickselect = _interopRequireDefault(require(_dependencyMap[3], "./quickselect.js"));
  var _number = _interopRequireWildcard(require(_dependencyMap[4], "./number.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  function quantile(values, p, valueof) {
    values = Float64Array.from((0, _number.numbers)(values, valueof));
    if (!(n = values.length)) return;
    if ((p = +p) <= 0 || n < 2) return (0, _min.default)(values);
    if (p >= 1) return (0, _max.default)(values);
    var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = (0, _max.default)((0, _quickselect.default)(values, i0).subarray(0, i0 + 1)),
      value1 = (0, _min.default)(values.subarray(i0 + 1));
    return value0 + (value1 - value0) * (i - i0);
  }
  function quantileSorted(values, p, valueof = _number.default) {
    if (!(n = values.length)) return;
    if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
    if (p >= 1) return +valueof(values[n - 1], n - 1, values);
    var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = +valueof(values[i0], i0, values),
      value1 = +valueof(values[i0 + 1], i0 + 1, values);
    return value0 + (value1 - value0) * (i - i0);
  }
},3987,[10,3988,3989,3990,3967],"../../node_modules/d3-sankey/node_modules/d3-array/src/quantile.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = max;
  function max(values, valueof) {
    let max;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null && (max < value || max === undefined && value >= value)) {
          max = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (max < value || max === undefined && value >= value)) {
          max = value;
        }
      }
    }
    return max;
  }
},3988,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/max.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = min;
  function min(values, valueof) {
    let min;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null && (min > value || min === undefined && value >= value)) {
          min = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (min > value || min === undefined && value >= value)) {
          min = value;
        }
      }
    }
    return min;
  }
},3989,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/min.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = quickselect;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  // Based on https://github.com/mourner/quickselect
  // ISC license, Copyright 2018 Vladimir Agafonkin.
  function quickselect(array, k, left = 0, right = array.length - 1, compare = _ascending.default) {
    while (right > left) {
      if (right - left > 600) {
        const n = right - left + 1;
        const m = k - left + 1;
        const z = Math.log(n);
        const s = 0.5 * Math.exp(2 * z / 3);
        const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
        const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
        const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
        quickselect(array, k, newLeft, newRight, compare);
      }
      const t = array[k];
      let i = left;
      let j = right;
      swap(array, left, k);
      if (compare(array[right], t) > 0) swap(array, left, right);
      while (i < j) {
        swap(array, i, j), ++i, --j;
        while (compare(array[i], t) < 0) ++i;
        while (compare(array[j], t) > 0) --j;
      }
      if (compare(array[left], t) === 0) swap(array, left, j);else ++j, swap(array, j, right);
      if (j <= k) left = j + 1;
      if (k <= j) right = j - 1;
    }
    return array;
  }
  function swap(array, i, j) {
    const t = array[i];
    array[i] = array[j];
    array[j] = t;
  }
},3990,[10,3965],"../../node_modules/d3-sankey/node_modules/d3-array/src/quickselect.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _count = _interopRequireDefault(require(_dependencyMap[1], "../count.js"));
  var _deviation = _interopRequireDefault(require(_dependencyMap[2], "../deviation.js"));
  function _default(values, min, max) {
    return Math.ceil((max - min) / (3.5 * (0, _deviation.default)(values) * Math.pow((0, _count.default)(values), -1 / 3)));
  }
},3991,[10,3968,3972],"../../node_modules/d3-sankey/node_modules/d3-array/src/threshold/scott.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = maxIndex;
  function maxIndex(values, valueof) {
    let max;
    let maxIndex = -1;
    let index = -1;
    if (valueof === undefined) {
      for (const value of values) {
        ++index;
        if (value != null && (max < value || max === undefined && value >= value)) {
          max = value, maxIndex = index;
        }
      }
    } else {
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (max < value || max === undefined && value >= value)) {
          max = value, maxIndex = index;
        }
      }
    }
    return maxIndex;
  }
},3992,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/maxIndex.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = mean;
  function mean(values, valueof) {
    let count = 0;
    let sum = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          ++count, sum += value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
          ++count, sum += value;
        }
      }
    }
    if (count) return sum / count;
  }
},3993,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/mean.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _quantile = _interopRequireDefault(require(_dependencyMap[1], "./quantile.js"));
  function _default(values, valueof) {
    return (0, _quantile.default)(values, 0.5, valueof);
  }
},3994,[10,3987],"../../node_modules/d3-sankey/node_modules/d3-array/src/median.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = merge;
  function* flatten(arrays) {
    for (const array of arrays) {
      yield* array;
    }
  }
  function merge(arrays) {
    return Array.from(flatten(arrays));
  }
},3995,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/merge.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = minIndex;
  function minIndex(values, valueof) {
    let min;
    let minIndex = -1;
    let index = -1;
    if (valueof === undefined) {
      for (const value of values) {
        ++index;
        if (value != null && (min > value || min === undefined && value >= value)) {
          min = value, minIndex = index;
        }
      }
    } else {
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (min > value || min === undefined && value >= value)) {
          min = value, minIndex = index;
        }
      }
    }
    return minIndex;
  }
},3996,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/minIndex.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = pairs;
  exports.pair = pair;
  function pairs(values, pairof = pair) {
    const pairs = [];
    let previous;
    let first = false;
    for (const value of values) {
      if (first) pairs.push(pairof(previous, value));
      previous = value;
      first = true;
    }
    return pairs;
  }
  function pair(a, b) {
    return [a, b];
  }
},3997,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/pairs.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
    var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);
    while (++i < n) {
      range[i] = start + i * step;
    }
    return range;
  }
},3998,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/range.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = least;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  function least(values, compare = _ascending.default) {
    let min;
    let defined = false;
    if (compare.length === 1) {
      let minValue;
      for (const element of values) {
        const value = compare(element);
        if (defined ? (0, _ascending.default)(value, minValue) < 0 : (0, _ascending.default)(value, value) === 0) {
          min = element;
          minValue = value;
          defined = true;
        }
      }
    } else {
      for (const value of values) {
        if (defined ? compare(value, min) < 0 : compare(value, value) === 0) {
          min = value;
          defined = true;
        }
      }
    }
    return min;
  }
},3999,[10,3965],"../../node_modules/d3-sankey/node_modules/d3-array/src/least.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = leastIndex;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  var _minIndex = _interopRequireDefault(require(_dependencyMap[2], "./minIndex.js"));
  function leastIndex(values, compare = _ascending.default) {
    if (compare.length === 1) return (0, _minIndex.default)(values, compare);
    let minValue;
    let min = -1;
    let index = -1;
    for (const value of values) {
      ++index;
      if (min < 0 ? compare(value, value) === 0 : compare(value, minValue) < 0) {
        minValue = value;
        min = index;
      }
    }
    return min;
  }
},4000,[10,3965,3996],"../../node_modules/d3-sankey/node_modules/d3-array/src/leastIndex.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = greatest;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  function greatest(values, compare = _ascending.default) {
    let max;
    let defined = false;
    if (compare.length === 1) {
      let maxValue;
      for (const element of values) {
        const value = compare(element);
        if (defined ? (0, _ascending.default)(value, maxValue) > 0 : (0, _ascending.default)(value, value) === 0) {
          max = element;
          maxValue = value;
          defined = true;
        }
      }
    } else {
      for (const value of values) {
        if (defined ? compare(value, max) > 0 : compare(value, value) === 0) {
          max = value;
          defined = true;
        }
      }
    }
    return max;
  }
},4001,[10,3965],"../../node_modules/d3-sankey/node_modules/d3-array/src/greatest.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = greatestIndex;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  var _maxIndex = _interopRequireDefault(require(_dependencyMap[2], "./maxIndex.js"));
  function greatestIndex(values, compare = _ascending.default) {
    if (compare.length === 1) return (0, _maxIndex.default)(values, compare);
    let maxValue;
    let max = -1;
    let index = -1;
    for (const value of values) {
      ++index;
      if (max < 0 ? compare(value, value) === 0 : compare(value, maxValue) > 0) {
        maxValue = value;
        max = index;
      }
    }
    return max;
  }
},4002,[10,3965,3992],"../../node_modules/d3-sankey/node_modules/d3-array/src/greatestIndex.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = scan;
  var _leastIndex = _interopRequireDefault(require(_dependencyMap[1], "./leastIndex.js"));
  function scan(values, compare) {
    const index = (0, _leastIndex.default)(values, compare);
    return index < 0 ? undefined : index;
  }
},4003,[10,4000],"../../node_modules/d3-sankey/node_modules/d3-array/src/scan.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  exports.shuffler = shuffler;
  var _default = exports.default = shuffler(Math.random);
  function shuffler(random) {
    return function shuffle(array, i0 = 0, i1 = array.length) {
      let m = i1 - (i0 = +i0);
      while (m) {
        const i = random() * m-- | 0,
          t = array[m + i0];
        array[m + i0] = array[i + i0];
        array[i + i0] = t;
      }
      return array;
    };
  }
},4004,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/shuffle.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = sum;
  function sum(values, valueof) {
    let sum = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value = +value) {
          sum += value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if (value = +valueof(value, ++index, values)) {
          sum += value;
        }
      }
    }
    return sum;
  }
},4005,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/sum.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _min = _interopRequireDefault(require(_dependencyMap[1], "./min.js"));
  function _default(matrix) {
    if (!(n = matrix.length)) return [];
    for (var i = -1, m = (0, _min.default)(matrix, length), transpose = new Array(m); ++i < m;) {
      for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
        row[j] = matrix[j][i];
      }
    }
    return transpose;
  }
  function length(d) {
    return d.length;
  }
},4006,[10,3989],"../../node_modules/d3-sankey/node_modules/d3-array/src/transpose.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _transpose = _interopRequireDefault(require(_dependencyMap[1], "./transpose.js"));
  function _default() {
    return (0, _transpose.default)(arguments);
  }
},4007,[10,4006],"../../node_modules/d3-sankey/node_modules/d3-array/src/zip.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = every;
  function every(values, test) {
    if (typeof test !== "function") throw new TypeError("test is not a function");
    let index = -1;
    for (const value of values) {
      if (!test(value, ++index, values)) {
        return false;
      }
    }
    return true;
  }
},4008,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/every.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = some;
  function some(values, test) {
    if (typeof test !== "function") throw new TypeError("test is not a function");
    let index = -1;
    for (const value of values) {
      if (test(value, ++index, values)) {
        return true;
      }
    }
    return false;
  }
},4009,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/some.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = filter;
  function filter(values, test) {
    if (typeof test !== "function") throw new TypeError("test is not a function");
    const array = [];
    let index = -1;
    for (const value of values) {
      if (test(value, ++index, values)) {
        array.push(value);
      }
    }
    return array;
  }
},4010,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/filter.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = map;
  function map(values, mapper) {
    if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
    if (typeof mapper !== "function") throw new TypeError("mapper is not a function");
    return Array.from(values, (value, index) => mapper(value, index, values));
  }
},4011,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/map.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = reduce;
  function reduce(values, reducer, value) {
    if (typeof reducer !== "function") throw new TypeError("reducer is not a function");
    const iterator = values[Symbol.iterator]();
    let done,
      next,
      index = -1;
    if (arguments.length < 3) {
      ({
        done,
        value
      } = iterator.next());
      if (done) return;
      ++index;
    }
    while ({
      done,
      value: next
    } = iterator.next(), !done) {
      value = reducer(value, next, ++index, values);
    }
    return value;
  }
},4012,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/reduce.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = reverse;
  function reverse(values) {
    if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
    return Array.from(values).reverse();
  }
},4013,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/reverse.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = difference;
  function difference(values, ...others) {
    values = new Set(values);
    for (const other of others) {
      for (const value of other) {
        values.delete(value);
      }
    }
    return values;
  }
},4014,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/difference.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = disjoint;
  function disjoint(values, other) {
    const iterator = other[Symbol.iterator](),
      set = new Set();
    for (const v of values) {
      if (set.has(v)) return false;
      let value, done;
      while ({
        value,
        done
      } = iterator.next()) {
        if (done) break;
        if (Object.is(v, value)) return false;
        set.add(value);
      }
    }
    return true;
  }
},4015,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/disjoint.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = intersection;
  var _set = _interopRequireDefault(require(_dependencyMap[1], "./set.js"));
  function intersection(values, ...others) {
    values = new Set(values);
    others = others.map(_set.default);
    out: for (const value of values) {
      for (const other of others) {
        if (!other.has(value)) {
          values.delete(value);
          continue out;
        }
      }
    }
    return values;
  }
},4016,[10,4017],"../../node_modules/d3-sankey/node_modules/d3-array/src/intersection.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = set;
  function set(values) {
    return values instanceof Set ? values : new Set(values);
  }
},4017,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/set.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = subset;
  var _superset = _interopRequireDefault(require(_dependencyMap[1], "./superset.js"));
  function subset(values, other) {
    return (0, _superset.default)(other, values);
  }
},4018,[10,4019],"../../node_modules/d3-sankey/node_modules/d3-array/src/subset.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = superset;
  function superset(values, other) {
    const iterator = values[Symbol.iterator](),
      set = new Set();
    for (const o of other) {
      if (set.has(o)) continue;
      let value, done;
      while ({
        value,
        done
      } = iterator.next()) {
        if (done) return false;
        set.add(value);
        if (Object.is(o, value)) break;
      }
    }
    return true;
  }
},4019,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/superset.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = union;
  function union(...others) {
    const set = new Set();
    for (const other of others) {
      for (const o of other) {
        set.add(o);
      }
    }
    return set;
  }
},4020,[],"../../node_modules/d3-sankey/node_modules/d3-array/src/union.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Sankey;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "./constant.js"));
  function ascendingSourceBreadth(a, b) {
    return ascendingBreadth(a.source, b.source) || a.index - b.index;
  }
  function ascendingTargetBreadth(a, b) {
    return ascendingBreadth(a.target, b.target) || a.index - b.index;
  }
  function ascendingBreadth(a, b) {
    return a.y0 - b.y0;
  }
  function value(d) {
    return d.value;
  }
  function defaultId(d) {
    return d.index;
  }
  function defaultNodes(graph) {
    return graph.nodes;
  }
  function defaultLinks(graph) {
    return graph.links;
  }
  function find(nodeById, id) {
    const node = nodeById.get(id);
    if (!node) throw new Error("missing: " + id);
    return node;
  }
  function computeLinkBreadths({
    nodes
  }) {
    for (const node of nodes) {
      let y0 = node.y0;
      let y1 = y0;
      for (const link of node.sourceLinks) {
        link.y0 = y0 + link.width / 2;
        y0 += link.width;
      }
      for (const link of node.targetLinks) {
        link.y1 = y1 + link.width / 2;
        y1 += link.width;
      }
    }
  }
  function Sankey() {
    let x0 = 0,
      y0 = 0,
      x1 = 1,
      y1 = 1; // extent
    let dx = 24; // nodeWidth
    let dy = 8,
      py; // nodePadding
    let id = defaultId;
    let align = require(_dependencyMap[2], "./align.js").justify;
    let sort;
    let linkSort;
    let nodes = defaultNodes;
    let links = defaultLinks;
    let iterations = 6;
    function sankey() {
      const graph = {
        nodes: nodes.apply(null, arguments),
        links: links.apply(null, arguments)
      };
      computeNodeLinks(graph);
      computeNodeValues(graph);
      computeNodeDepths(graph);
      computeNodeHeights(graph);
      computeNodeBreadths(graph);
      computeLinkBreadths(graph);
      return graph;
    }
    sankey.update = function (graph) {
      computeLinkBreadths(graph);
      return graph;
    };
    sankey.nodeId = function (_) {
      return arguments.length ? (id = typeof _ === "function" ? _ : (0, _constant.default)(_), sankey) : id;
    };
    sankey.nodeAlign = function (_) {
      return arguments.length ? (align = typeof _ === "function" ? _ : (0, _constant.default)(_), sankey) : align;
    };
    sankey.nodeSort = function (_) {
      return arguments.length ? (sort = _, sankey) : sort;
    };
    sankey.nodeWidth = function (_) {
      return arguments.length ? (dx = +_, sankey) : dx;
    };
    sankey.nodePadding = function (_) {
      return arguments.length ? (dy = py = +_, sankey) : dy;
    };
    sankey.nodes = function (_) {
      return arguments.length ? (nodes = typeof _ === "function" ? _ : (0, _constant.default)(_), sankey) : nodes;
    };
    sankey.links = function (_) {
      return arguments.length ? (links = typeof _ === "function" ? _ : (0, _constant.default)(_), sankey) : links;
    };
    sankey.linkSort = function (_) {
      return arguments.length ? (linkSort = _, sankey) : linkSort;
    };
    sankey.size = function (_) {
      return arguments.length ? (x0 = y0 = 0, x1 = +_[0], y1 = +_[1], sankey) : [x1 - x0, y1 - y0];
    };
    sankey.extent = function (_) {
      return arguments.length ? (x0 = +_[0][0], x1 = +_[1][0], y0 = +_[0][1], y1 = +_[1][1], sankey) : [[x0, y0], [x1, y1]];
    };
    sankey.iterations = function (_) {
      return arguments.length ? (iterations = +_, sankey) : iterations;
    };
    function computeNodeLinks({
      nodes,
      links
    }) {
      for (const [i, node] of nodes.entries()) {
        node.index = i;
        node.sourceLinks = [];
        node.targetLinks = [];
      }
      const nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d]));
      for (const [i, link] of links.entries()) {
        link.index = i;
        let {
          source,
          target
        } = link;
        if (typeof source !== "object") source = link.source = find(nodeById, source);
        if (typeof target !== "object") target = link.target = find(nodeById, target);
        source.sourceLinks.push(link);
        target.targetLinks.push(link);
      }
      if (linkSort != null) {
        for (const {
          sourceLinks,
          targetLinks
        } of nodes) {
          sourceLinks.sort(linkSort);
          targetLinks.sort(linkSort);
        }
      }
    }
    function computeNodeValues({
      nodes
    }) {
      for (const node of nodes) {
        node.value = node.fixedValue === undefined ? Math.max((0, require(_dependencyMap[3], "d3-array").sum)(node.sourceLinks, value), (0, require(_dependencyMap[3], "d3-array").sum)(node.targetLinks, value)) : node.fixedValue;
      }
    }
    function computeNodeDepths({
      nodes
    }) {
      const n = nodes.length;
      let current = new Set(nodes);
      let next = new Set();
      let x = 0;
      while (current.size) {
        for (const node of current) {
          node.depth = x;
          for (const {
            target
          } of node.sourceLinks) {
            next.add(target);
          }
        }
        if (++x > n) throw new Error("circular link");
        current = next;
        next = new Set();
      }
    }
    function computeNodeHeights({
      nodes
    }) {
      const n = nodes.length;
      let current = new Set(nodes);
      let next = new Set();
      let x = 0;
      while (current.size) {
        for (const node of current) {
          node.height = x;
          for (const {
            source
          } of node.targetLinks) {
            next.add(source);
          }
        }
        if (++x > n) throw new Error("circular link");
        current = next;
        next = new Set();
      }
    }
    function computeNodeLayers({
      nodes
    }) {
      const x = (0, require(_dependencyMap[3], "d3-array").max)(nodes, d => d.depth) + 1;
      const kx = (x1 - x0 - dx) / (x - 1);
      const columns = new Array(x);
      for (const node of nodes) {
        const i = Math.max(0, Math.min(x - 1, Math.floor(align.call(null, node, x))));
        node.layer = i;
        node.x0 = x0 + i * kx;
        node.x1 = node.x0 + dx;
        if (columns[i]) columns[i].push(node);else columns[i] = [node];
      }
      if (sort) for (const column of columns) {
        column.sort(sort);
      }
      return columns;
    }
    function initializeNodeBreadths(columns) {
      const ky = (0, require(_dependencyMap[3], "d3-array").min)(columns, c => (y1 - y0 - (c.length - 1) * py) / (0, require(_dependencyMap[3], "d3-array").sum)(c, value));
      for (const nodes of columns) {
        let y = y0;
        for (const node of nodes) {
          node.y0 = y;
          node.y1 = y + node.value * ky;
          y = node.y1 + py;
          for (const link of node.sourceLinks) {
            link.width = link.value * ky;
          }
        }
        y = (y1 - y + py) / (nodes.length + 1);
        for (let i = 0; i < nodes.length; ++i) {
          const node = nodes[i];
          node.y0 += y * (i + 1);
          node.y1 += y * (i + 1);
        }
        reorderLinks(nodes);
      }
    }
    function computeNodeBreadths(graph) {
      const columns = computeNodeLayers(graph);
      py = Math.min(dy, (y1 - y0) / ((0, require(_dependencyMap[3], "d3-array").max)(columns, c => c.length) - 1));
      initializeNodeBreadths(columns);
      for (let i = 0; i < iterations; ++i) {
        const alpha = Math.pow(0.99, i);
        const beta = Math.max(1 - alpha, (i + 1) / iterations);
        relaxRightToLeft(columns, alpha, beta);
        relaxLeftToRight(columns, alpha, beta);
      }
    }

    // Reposition each node based on its incoming (target) links.
    function relaxLeftToRight(columns, alpha, beta) {
      for (let i = 1, n = columns.length; i < n; ++i) {
        const column = columns[i];
        for (const target of column) {
          let y = 0;
          let w = 0;
          for (const {
            source,
            value
          } of target.targetLinks) {
            let v = value * (target.layer - source.layer);
            y += targetTop(source, target) * v;
            w += v;
          }
          if (!(w > 0)) continue;
          let dy = (y / w - target.y0) * alpha;
          target.y0 += dy;
          target.y1 += dy;
          reorderNodeLinks(target);
        }
        if (sort === undefined) column.sort(ascendingBreadth);
        resolveCollisions(column, beta);
      }
    }

    // Reposition each node based on its outgoing (source) links.
    function relaxRightToLeft(columns, alpha, beta) {
      for (let n = columns.length, i = n - 2; i >= 0; --i) {
        const column = columns[i];
        for (const source of column) {
          let y = 0;
          let w = 0;
          for (const {
            target,
            value
          } of source.sourceLinks) {
            let v = value * (target.layer - source.layer);
            y += sourceTop(source, target) * v;
            w += v;
          }
          if (!(w > 0)) continue;
          let dy = (y / w - source.y0) * alpha;
          source.y0 += dy;
          source.y1 += dy;
          reorderNodeLinks(source);
        }
        if (sort === undefined) column.sort(ascendingBreadth);
        resolveCollisions(column, beta);
      }
    }
    function resolveCollisions(nodes, alpha) {
      const i = nodes.length >> 1;
      const subject = nodes[i];
      resolveCollisionsBottomToTop(nodes, subject.y0 - py, i - 1, alpha);
      resolveCollisionsTopToBottom(nodes, subject.y1 + py, i + 1, alpha);
      resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha);
      resolveCollisionsTopToBottom(nodes, y0, 0, alpha);
    }

    // Push any overlapping nodes down.
    function resolveCollisionsTopToBottom(nodes, y, i, alpha) {
      for (; i < nodes.length; ++i) {
        const node = nodes[i];
        const dy = (y - node.y0) * alpha;
        if (dy > 1e-6) node.y0 += dy, node.y1 += dy;
        y = node.y1 + py;
      }
    }

    // Push any overlapping nodes up.
    function resolveCollisionsBottomToTop(nodes, y, i, alpha) {
      for (; i >= 0; --i) {
        const node = nodes[i];
        const dy = (node.y1 - y) * alpha;
        if (dy > 1e-6) node.y0 -= dy, node.y1 -= dy;
        y = node.y0 - py;
      }
    }
    function reorderNodeLinks({
      sourceLinks,
      targetLinks
    }) {
      if (linkSort === undefined) {
        for (const {
          source: {
            sourceLinks
          }
        } of targetLinks) {
          sourceLinks.sort(ascendingTargetBreadth);
        }
        for (const {
          target: {
            targetLinks
          }
        } of sourceLinks) {
          targetLinks.sort(ascendingSourceBreadth);
        }
      }
    }
    function reorderLinks(nodes) {
      if (linkSort === undefined) {
        for (const {
          sourceLinks,
          targetLinks
        } of nodes) {
          sourceLinks.sort(ascendingTargetBreadth);
          targetLinks.sort(ascendingSourceBreadth);
        }
      }
    }

    // Returns the target.y0 that would produce an ideal link from source to target.
    function targetTop(source, target) {
      let y = source.y0 - (source.sourceLinks.length - 1) * py / 2;
      for (const {
        target: node,
        width
      } of source.sourceLinks) {
        if (node === target) break;
        y += width + py;
      }
      for (const {
        source: node,
        width
      } of target.targetLinks) {
        if (node === source) break;
        y -= width;
      }
      return y;
    }

    // Returns the source.y0 that would produce an ideal link from source to target.
    function sourceTop(source, target) {
      let y = target.y0 - (target.targetLinks.length - 1) * py / 2;
      for (const {
        source: node,
        width
      } of target.targetLinks) {
        if (node === source) break;
        y += width + py;
      }
      for (const {
        target: node,
        width
      } of source.sourceLinks) {
        if (node === target) break;
        y -= width;
      }
      return y;
    }
    return sankey;
  }
},4021,[10,4022,3960,3961],"../../node_modules/d3-sankey/src/sankey.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = constant;
  function constant(x) {
    return function () {
      return x;
    };
  }
},4022,[],"../../node_modules/d3-sankey/src/constant.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function horizontalSource(d) {
    return [d.source.x1, d.y0];
  }
  function horizontalTarget(d) {
    return [d.target.x0, d.y1];
  }
  function _default() {
    return (0, require(_dependencyMap[0], "d3-shape").linkHorizontal)().source(horizontalSource).target(horizontalTarget);
  }
},4023,[4024],"../../node_modules/d3-sankey/src/sankeyLinkHorizontal.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "arc", {
    enumerable: true,
    get: function () {
      return _arc.default;
    }
  });
  Object.defineProperty(exports, "area", {
    enumerable: true,
    get: function () {
      return _area.default;
    }
  });
  Object.defineProperty(exports, "areaRadial", {
    enumerable: true,
    get: function () {
      return _areaRadial.default;
    }
  });
  Object.defineProperty(exports, "curveBasis", {
    enumerable: true,
    get: function () {
      return _basis.default;
    }
  });
  Object.defineProperty(exports, "curveBasisClosed", {
    enumerable: true,
    get: function () {
      return _basisClosed.default;
    }
  });
  Object.defineProperty(exports, "curveBasisOpen", {
    enumerable: true,
    get: function () {
      return _basisOpen.default;
    }
  });
  Object.defineProperty(exports, "curveBundle", {
    enumerable: true,
    get: function () {
      return _bundle.default;
    }
  });
  Object.defineProperty(exports, "curveCardinal", {
    enumerable: true,
    get: function () {
      return _cardinal.default;
    }
  });
  Object.defineProperty(exports, "curveCardinalClosed", {
    enumerable: true,
    get: function () {
      return _cardinalClosed.default;
    }
  });
  Object.defineProperty(exports, "curveCardinalOpen", {
    enumerable: true,
    get: function () {
      return _cardinalOpen.default;
    }
  });
  Object.defineProperty(exports, "curveCatmullRom", {
    enumerable: true,
    get: function () {
      return _catmullRom.default;
    }
  });
  Object.defineProperty(exports, "curveCatmullRomClosed", {
    enumerable: true,
    get: function () {
      return _catmullRomClosed.default;
    }
  });
  Object.defineProperty(exports, "curveCatmullRomOpen", {
    enumerable: true,
    get: function () {
      return _catmullRomOpen.default;
    }
  });
  Object.defineProperty(exports, "curveLinear", {
    enumerable: true,
    get: function () {
      return _linear.default;
    }
  });
  Object.defineProperty(exports, "curveLinearClosed", {
    enumerable: true,
    get: function () {
      return _linearClosed.default;
    }
  });
  Object.defineProperty(exports, "curveMonotoneX", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./curve/monotone.js").monotoneX;
    }
  });
  Object.defineProperty(exports, "curveMonotoneY", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[1], "./curve/monotone.js").monotoneY;
    }
  });
  Object.defineProperty(exports, "curveNatural", {
    enumerable: true,
    get: function () {
      return _natural.default;
    }
  });
  Object.defineProperty(exports, "curveStep", {
    enumerable: true,
    get: function () {
      return _step.default;
    }
  });
  Object.defineProperty(exports, "curveStepAfter", {
    enumerable: true,
    get: function () {
      return _step.stepAfter;
    }
  });
  Object.defineProperty(exports, "curveStepBefore", {
    enumerable: true,
    get: function () {
      return _step.stepBefore;
    }
  });
  Object.defineProperty(exports, "line", {
    enumerable: true,
    get: function () {
      return _line.default;
    }
  });
  Object.defineProperty(exports, "lineRadial", {
    enumerable: true,
    get: function () {
      return _lineRadial.default;
    }
  });
  Object.defineProperty(exports, "linkHorizontal", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[2], "./link/index.js").linkHorizontal;
    }
  });
  Object.defineProperty(exports, "linkRadial", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[2], "./link/index.js").linkRadial;
    }
  });
  Object.defineProperty(exports, "linkVertical", {
    enumerable: true,
    get: function () {
      return require(_dependencyMap[2], "./link/index.js").linkVertical;
    }
  });
  Object.defineProperty(exports, "pie", {
    enumerable: true,
    get: function () {
      return _pie.default;
    }
  });
  Object.defineProperty(exports, "pointRadial", {
    enumerable: true,
    get: function () {
      return _pointRadial.default;
    }
  });
  Object.defineProperty(exports, "radialArea", {
    enumerable: true,
    get: function () {
      return _areaRadial.default;
    }
  });
  Object.defineProperty(exports, "radialLine", {
    enumerable: true,
    get: function () {
      return _lineRadial.default;
    }
  });
  Object.defineProperty(exports, "stack", {
    enumerable: true,
    get: function () {
      return _stack.default;
    }
  });
  Object.defineProperty(exports, "stackOffsetDiverging", {
    enumerable: true,
    get: function () {
      return _diverging.default;
    }
  });
  Object.defineProperty(exports, "stackOffsetExpand", {
    enumerable: true,
    get: function () {
      return _expand.default;
    }
  });
  Object.defineProperty(exports, "stackOffsetNone", {
    enumerable: true,
    get: function () {
      return _none.default;
    }
  });
  Object.defineProperty(exports, "stackOffsetSilhouette", {
    enumerable: true,
    get: function () {
      return _silhouette.default;
    }
  });
  Object.defineProperty(exports, "stackOffsetWiggle", {
    enumerable: true,
    get: function () {
      return _wiggle.default;
    }
  });
  Object.defineProperty(exports, "stackOrderAppearance", {
    enumerable: true,
    get: function () {
      return _appearance.default;
    }
  });
  Object.defineProperty(exports, "stackOrderAscending", {
    enumerable: true,
    get: function () {
      return _ascending.default;
    }
  });
  Object.defineProperty(exports, "stackOrderDescending", {
    enumerable: true,
    get: function () {
      return _descending.default;
    }
  });
  Object.defineProperty(exports, "stackOrderInsideOut", {
    enumerable: true,
    get: function () {
      return _insideOut.default;
    }
  });
  Object.defineProperty(exports, "stackOrderNone", {
    enumerable: true,
    get: function () {
      return _none2.default;
    }
  });
  Object.defineProperty(exports, "stackOrderReverse", {
    enumerable: true,
    get: function () {
      return _reverse.default;
    }
  });
  Object.defineProperty(exports, "symbol", {
    enumerable: true,
    get: function () {
      return _symbol.default;
    }
  });
  Object.defineProperty(exports, "symbolCircle", {
    enumerable: true,
    get: function () {
      return _circle.default;
    }
  });
  Object.defineProperty(exports, "symbolCross", {
    enumerable: true,
    get: function () {
      return _cross.default;
    }
  });
  Object.defineProperty(exports, "symbolDiamond", {
    enumerable: true,
    get: function () {
      return _diamond.default;
    }
  });
  Object.defineProperty(exports, "symbolSquare", {
    enumerable: true,
    get: function () {
      return _square.default;
    }
  });
  Object.defineProperty(exports, "symbolStar", {
    enumerable: true,
    get: function () {
      return _star.default;
    }
  });
  Object.defineProperty(exports, "symbolTriangle", {
    enumerable: true,
    get: function () {
      return _triangle.default;
    }
  });
  Object.defineProperty(exports, "symbolWye", {
    enumerable: true,
    get: function () {
      return _wye.default;
    }
  });
  Object.defineProperty(exports, "symbols", {
    enumerable: true,
    get: function () {
      return _symbol.symbols;
    }
  });
  var _arc = _interopRequireDefault(require(_dependencyMap[3], "./arc.js"));
  var _area = _interopRequireDefault(require(_dependencyMap[4], "./area.js"));
  var _line = _interopRequireDefault(require(_dependencyMap[5], "./line.js"));
  var _pie = _interopRequireDefault(require(_dependencyMap[6], "./pie.js"));
  var _areaRadial = _interopRequireDefault(require(_dependencyMap[7], "./areaRadial.js"));
  var _lineRadial = _interopRequireDefault(require(_dependencyMap[8], "./lineRadial.js"));
  var _pointRadial = _interopRequireDefault(require(_dependencyMap[9], "./pointRadial.js"));
  var _symbol = _interopRequireWildcard(require(_dependencyMap[10], "./symbol.js"));
  var _circle = _interopRequireDefault(require(_dependencyMap[11], "./symbol/circle.js"));
  var _cross = _interopRequireDefault(require(_dependencyMap[12], "./symbol/cross.js"));
  var _diamond = _interopRequireDefault(require(_dependencyMap[13], "./symbol/diamond.js"));
  var _square = _interopRequireDefault(require(_dependencyMap[14], "./symbol/square.js"));
  var _star = _interopRequireDefault(require(_dependencyMap[15], "./symbol/star.js"));
  var _triangle = _interopRequireDefault(require(_dependencyMap[16], "./symbol/triangle.js"));
  var _wye = _interopRequireDefault(require(_dependencyMap[17], "./symbol/wye.js"));
  var _basisClosed = _interopRequireDefault(require(_dependencyMap[18], "./curve/basisClosed.js"));
  var _basisOpen = _interopRequireDefault(require(_dependencyMap[19], "./curve/basisOpen.js"));
  var _basis = _interopRequireDefault(require(_dependencyMap[20], "./curve/basis.js"));
  var _bundle = _interopRequireDefault(require(_dependencyMap[21], "./curve/bundle.js"));
  var _cardinalClosed = _interopRequireDefault(require(_dependencyMap[22], "./curve/cardinalClosed.js"));
  var _cardinalOpen = _interopRequireDefault(require(_dependencyMap[23], "./curve/cardinalOpen.js"));
  var _cardinal = _interopRequireDefault(require(_dependencyMap[24], "./curve/cardinal.js"));
  var _catmullRomClosed = _interopRequireDefault(require(_dependencyMap[25], "./curve/catmullRomClosed.js"));
  var _catmullRomOpen = _interopRequireDefault(require(_dependencyMap[26], "./curve/catmullRomOpen.js"));
  var _catmullRom = _interopRequireDefault(require(_dependencyMap[27], "./curve/catmullRom.js"));
  var _linearClosed = _interopRequireDefault(require(_dependencyMap[28], "./curve/linearClosed.js"));
  var _linear = _interopRequireDefault(require(_dependencyMap[29], "./curve/linear.js"));
  var _natural = _interopRequireDefault(require(_dependencyMap[30], "./curve/natural.js"));
  var _step = _interopRequireWildcard(require(_dependencyMap[31], "./curve/step.js"));
  var _stack = _interopRequireDefault(require(_dependencyMap[32], "./stack.js"));
  var _expand = _interopRequireDefault(require(_dependencyMap[33], "./offset/expand.js"));
  var _diverging = _interopRequireDefault(require(_dependencyMap[34], "./offset/diverging.js"));
  var _none = _interopRequireDefault(require(_dependencyMap[35], "./offset/none.js"));
  var _silhouette = _interopRequireDefault(require(_dependencyMap[36], "./offset/silhouette.js"));
  var _wiggle = _interopRequireDefault(require(_dependencyMap[37], "./offset/wiggle.js"));
  var _appearance = _interopRequireDefault(require(_dependencyMap[38], "./order/appearance.js"));
  var _ascending = _interopRequireDefault(require(_dependencyMap[39], "./order/ascending.js"));
  var _descending = _interopRequireDefault(require(_dependencyMap[40], "./order/descending.js"));
  var _insideOut = _interopRequireDefault(require(_dependencyMap[41], "./order/insideOut.js"));
  var _none2 = _interopRequireDefault(require(_dependencyMap[42], "./order/none.js"));
  var _reverse = _interopRequireDefault(require(_dependencyMap[43], "./order/reverse.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
},4024,[10,4025,4026,4033,4035,4037,4038,4041,4043,4028,4044,4045,4046,4047,4049,4048,4050,4051,4052,4055,4054,4056,4057,4059,4058,4060,4062,4061,4063,4036,4064,4065,4066,4069,4070,4067,4071,4072,4073,4074,4075,4076,4068,4077],"../../node_modules/d3-sankey/node_modules/d3-shape/src/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.monotoneX = monotoneX;
  exports.monotoneY = monotoneY;
  function sign(x) {
    return x < 0 ? -1 : 1;
  }

  // Calculate the slopes of the tangents (Hermite-type interpolation) based on
  // the following paper: Steffen, M. 1990. A Simple Method for Monotonic
  // Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
  // NOV(II), P. 443, 1990.
  function slope3(that, x2, y2) {
    var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }

  // Calculate a one-sided slope.
  function slope2(that, t) {
    var h = that._x1 - that._x0;
    return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
  }

  // According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
  // "you can express cubic Hermite interpolation in terms of cubic Bézier curves
  // with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
  function point(that, t0, t1) {
    var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
    that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
  }
  function MonotoneX(context) {
    this._context = context;
  }
  MonotoneX.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 2:
          this._context.lineTo(this._x1, this._y1);
          break;
        case 3:
          point(this, this._t0, slope2(this, this._t0));
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      var t1 = NaN;
      x = +x, y = +y;
      if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          point(this, slope2(this, t1 = slope3(this, x, y)), t1);
          break;
        default:
          point(this, this._t0, t1 = slope3(this, x, y));
          break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
      this._t0 = t1;
    }
  };
  function MonotoneY(context) {
    this._context = new ReflectContext(context);
  }
  (MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
    MonotoneX.prototype.point.call(this, y, x);
  };
  function ReflectContext(context) {
    this._context = context;
  }
  ReflectContext.prototype = {
    moveTo: function (x, y) {
      this._context.moveTo(y, x);
    },
    closePath: function () {
      this._context.closePath();
    },
    lineTo: function (x, y) {
      this._context.lineTo(y, x);
    },
    bezierCurveTo: function (x1, y1, x2, y2, x, y) {
      this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
    }
  };
  function monotoneX(context) {
    return new MonotoneX(context);
  }
  function monotoneY(context) {
    return new MonotoneY(context);
  }
},4025,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/monotone.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.linkHorizontal = linkHorizontal;
  exports.linkRadial = linkRadial;
  exports.linkVertical = linkVertical;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "../constant.js"));
  var _pointRadial = _interopRequireDefault(require(_dependencyMap[2], "../pointRadial.js"));
  function linkSource(d) {
    return d.source;
  }
  function linkTarget(d) {
    return d.target;
  }
  function link(curve) {
    var source = linkSource,
      target = linkTarget,
      x = require(_dependencyMap[3], "../point.js").x,
      y = require(_dependencyMap[3], "../point.js").y,
      context = null;
    function link() {
      var buffer,
        argv = require(_dependencyMap[4], "../array.js").slice.call(arguments),
        s = source.apply(this, argv),
        t = target.apply(this, argv);
      if (!context) context = buffer = (0, require(_dependencyMap[5], "d3-path").path)();
      curve(context, +x.apply(this, (argv[0] = s, argv)), +y.apply(this, argv), +x.apply(this, (argv[0] = t, argv)), +y.apply(this, argv));
      if (buffer) return context = null, buffer + "" || null;
    }
    link.source = function (_) {
      return arguments.length ? (source = _, link) : source;
    };
    link.target = function (_) {
      return arguments.length ? (target = _, link) : target;
    };
    link.x = function (_) {
      return arguments.length ? (x = typeof _ === "function" ? _ : (0, _constant.default)(+_), link) : x;
    };
    link.y = function (_) {
      return arguments.length ? (y = typeof _ === "function" ? _ : (0, _constant.default)(+_), link) : y;
    };
    link.context = function (_) {
      return arguments.length ? (context = _ == null ? null : _, link) : context;
    };
    return link;
  }
  function curveHorizontal(context, x0, y0, x1, y1) {
    context.moveTo(x0, y0);
    context.bezierCurveTo(x0 = (x0 + x1) / 2, y0, x0, y1, x1, y1);
  }
  function curveVertical(context, x0, y0, x1, y1) {
    context.moveTo(x0, y0);
    context.bezierCurveTo(x0, y0 = (y0 + y1) / 2, x1, y0, x1, y1);
  }
  function curveRadial(context, x0, y0, x1, y1) {
    var p0 = (0, _pointRadial.default)(x0, y0),
      p1 = (0, _pointRadial.default)(x0, y0 = (y0 + y1) / 2),
      p2 = (0, _pointRadial.default)(x1, y0),
      p3 = (0, _pointRadial.default)(x1, y1);
    context.moveTo(p0[0], p0[1]);
    context.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
  }
  function linkHorizontal() {
    return link(curveHorizontal);
  }
  function linkVertical() {
    return link(curveVertical);
  }
  function linkRadial() {
    var l = link(curveRadial);
    l.angle = l.x, delete l.x;
    l.radius = l.y, delete l.y;
    return l;
  }
},4026,[10,4027,4028,4029,4030,4031],"../../node_modules/d3-sankey/node_modules/d3-shape/src/link/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(x) {
    return function constant() {
      return x;
    };
  }
},4027,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/constant.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(x, y) {
    return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
  }
},4028,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/pointRadial.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.x = x;
  exports.y = y;
  function x(p) {
    return p[0];
  }
  function y(p) {
    return p[1];
  }
},4029,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/point.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.slice = void 0;
  var slice = exports.slice = Array.prototype.slice;
},4030,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/array.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "path", {
    enumerable: true,
    get: function () {
      return _path.default;
    }
  });
  var _path = _interopRequireDefault(require(_dependencyMap[1], "./path.js"));
},4031,[10,4032],"../../node_modules/d3-sankey/node_modules/d3-path/src/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var pi = Math.PI,
    tau = 2 * pi,
    epsilon = 1e-6,
    tauEpsilon = tau - epsilon;
  function Path() {
    this._x0 = this._y0 =
    // start of current subpath
    this._x1 = this._y1 = null; // end of current subpath
    this._ = "";
  }
  function path() {
    return new Path();
  }
  Path.prototype = path.prototype = {
    constructor: Path,
    moveTo: function (x, y) {
      this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
    },
    closePath: function () {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._ += "Z";
      }
    },
    lineTo: function (x, y) {
      this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    quadraticCurveTo: function (x1, y1, x, y) {
      this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    bezierCurveTo: function (x1, y1, x2, y2, x, y) {
      this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    arcTo: function (x1, y1, x2, y2, r) {
      x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
      var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: " + r);

      // Is this path empty? Move to (x1,y1).
      if (this._x1 === null) {
        this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
      }

      // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
      else if (!(l01_2 > epsilon)) ;

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
        this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
      }

      // Otherwise, draw an arc!
      else {
        var x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

        // If the start tangent is not coincident with (x0,y0), line to.
        if (Math.abs(t01 - 1) > epsilon) {
          this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
        }
        this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
      }
    },
    arc: function (x, y, r, a0, a1, ccw) {
      x = +x, y = +y, r = +r, ccw = !!ccw;
      var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: " + r);

      // Is this path empty? Move to (x0,y0).
      if (this._x1 === null) {
        this._ += "M" + x0 + "," + y0;
      }

      // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
      else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._ += "L" + x0 + "," + y0;
      }

      // Is this arc empty? We’re done.
      if (!r) return;

      // Does the angle go the wrong way? Flip the direction.
      if (da < 0) da = da % tau + tau;

      // Is this a complete circle? Draw two arcs to complete the circle.
      if (da > tauEpsilon) {
        this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
      }

      // Is this arc non-empty? Draw an arc!
      else if (da > epsilon) {
        this._ += "A" + r + "," + r + ",0," + +(da >= pi) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
    },
    rect: function (x, y, w, h) {
      this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
    },
    toString: function () {
      return this._;
    }
  };
  var _default = exports.default = path;
},4032,[],"../../node_modules/d3-sankey/node_modules/d3-path/src/path.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "./constant.js"));
  function arcInnerRadius(d) {
    return d.innerRadius;
  }
  function arcOuterRadius(d) {
    return d.outerRadius;
  }
  function arcStartAngle(d) {
    return d.startAngle;
  }
  function arcEndAngle(d) {
    return d.endAngle;
  }
  function arcPadAngle(d) {
    return d && d.padAngle; // Note: optional!
  }
  function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
    var x10 = x1 - x0,
      y10 = y1 - y0,
      x32 = x3 - x2,
      y32 = y3 - y2,
      t = y32 * x10 - x32 * y10;
    if (t * t < require(_dependencyMap[2], "./math.js").epsilon) return;
    t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
    return [x0 + t * x10, y0 + t * y10];
  }

  // Compute perpendicular offset line of length rc.
  // http://mathworld.wolfram.com/Circle-LineIntersection.html
  function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
    var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / (0, require(_dependencyMap[2], "./math.js").sqrt)(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * (0, require(_dependencyMap[2], "./math.js").sqrt)((0, require(_dependencyMap[2], "./math.js").max)(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

    // Pick the closer of the two intersection points.
    // TODO Is there a faster way to determine which intersection to use?
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;
    return {
      cx: cx0,
      cy: cy0,
      x01: -ox,
      y01: -oy,
      x11: cx0 * (r1 / r - 1),
      y11: cy0 * (r1 / r - 1)
    };
  }
  function _default() {
    var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = (0, _constant.default)(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null;
    function arc() {
      var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - require(_dependencyMap[2], "./math.js").halfPi,
        a1 = endAngle.apply(this, arguments) - require(_dependencyMap[2], "./math.js").halfPi,
        da = (0, require(_dependencyMap[2], "./math.js").abs)(a1 - a0),
        cw = a1 > a0;
      if (!context) context = buffer = (0, require(_dependencyMap[3], "d3-path").path)();

      // Ensure that the outer radius is always larger than the inner radius.
      if (r1 < r0) r = r1, r1 = r0, r0 = r;

      // Is it a point?
      if (!(r1 > require(_dependencyMap[2], "./math.js").epsilon)) context.moveTo(0, 0);

      // Or is it a circle or annulus?
      else if (da > require(_dependencyMap[2], "./math.js").tau - require(_dependencyMap[2], "./math.js").epsilon) {
        context.moveTo(r1 * (0, require(_dependencyMap[2], "./math.js").cos)(a0), r1 * (0, require(_dependencyMap[2], "./math.js").sin)(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > require(_dependencyMap[2], "./math.js").epsilon) {
          context.moveTo(r0 * (0, require(_dependencyMap[2], "./math.js").cos)(a1), r0 * (0, require(_dependencyMap[2], "./math.js").sin)(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      }

      // Or is it a circular or annular sector?
      else {
        var a01 = a0,
          a11 = a1,
          a00 = a0,
          a10 = a1,
          da0 = da,
          da1 = da,
          ap = padAngle.apply(this, arguments) / 2,
          rp = ap > require(_dependencyMap[2], "./math.js").epsilon && (padRadius ? +padRadius.apply(this, arguments) : (0, require(_dependencyMap[2], "./math.js").sqrt)(r0 * r0 + r1 * r1)),
          rc = (0, require(_dependencyMap[2], "./math.js").min)((0, require(_dependencyMap[2], "./math.js").abs)(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
          rc0 = rc,
          rc1 = rc,
          t0,
          t1;

        // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
        if (rp > require(_dependencyMap[2], "./math.js").epsilon) {
          var p0 = (0, require(_dependencyMap[2], "./math.js").asin)(rp / r0 * (0, require(_dependencyMap[2], "./math.js").sin)(ap)),
            p1 = (0, require(_dependencyMap[2], "./math.js").asin)(rp / r1 * (0, require(_dependencyMap[2], "./math.js").sin)(ap));
          if ((da0 -= p0 * 2) > require(_dependencyMap[2], "./math.js").epsilon) p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0;else da0 = 0, a00 = a10 = (a0 + a1) / 2;
          if ((da1 -= p1 * 2) > require(_dependencyMap[2], "./math.js").epsilon) p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1;else da1 = 0, a01 = a11 = (a0 + a1) / 2;
        }
        var x01 = r1 * (0, require(_dependencyMap[2], "./math.js").cos)(a01),
          y01 = r1 * (0, require(_dependencyMap[2], "./math.js").sin)(a01),
          x10 = r0 * (0, require(_dependencyMap[2], "./math.js").cos)(a10),
          y10 = r0 * (0, require(_dependencyMap[2], "./math.js").sin)(a10);

        // Apply rounded corners?
        if (rc > require(_dependencyMap[2], "./math.js").epsilon) {
          var x11 = r1 * (0, require(_dependencyMap[2], "./math.js").cos)(a11),
            y11 = r1 * (0, require(_dependencyMap[2], "./math.js").sin)(a11),
            x00 = r0 * (0, require(_dependencyMap[2], "./math.js").cos)(a00),
            y00 = r0 * (0, require(_dependencyMap[2], "./math.js").sin)(a00),
            oc;

          // Restrict the corner radius according to the sector angle.
          if (da < require(_dependencyMap[2], "./math.js").pi && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
            var ax = x01 - oc[0],
              ay = y01 - oc[1],
              bx = x11 - oc[0],
              by = y11 - oc[1],
              kc = 1 / (0, require(_dependencyMap[2], "./math.js").sin)((0, require(_dependencyMap[2], "./math.js").acos)((ax * bx + ay * by) / ((0, require(_dependencyMap[2], "./math.js").sqrt)(ax * ax + ay * ay) * (0, require(_dependencyMap[2], "./math.js").sqrt)(bx * bx + by * by))) / 2),
              lc = (0, require(_dependencyMap[2], "./math.js").sqrt)(oc[0] * oc[0] + oc[1] * oc[1]);
            rc0 = (0, require(_dependencyMap[2], "./math.js").min)(rc, (r0 - lc) / (kc - 1));
            rc1 = (0, require(_dependencyMap[2], "./math.js").min)(rc, (r1 - lc) / (kc + 1));
          }
        }

        // Is the sector collapsed to a line?
        if (!(da1 > require(_dependencyMap[2], "./math.js").epsilon)) context.moveTo(x01, y01);

        // Does the sector’s outer ring have rounded corners?
        else if (rc1 > require(_dependencyMap[2], "./math.js").epsilon) {
          t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
          t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);
          context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

          // Have the corners merged?
          if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, (0, require(_dependencyMap[2], "./math.js").atan2)(t0.y01, t0.x01), (0, require(_dependencyMap[2], "./math.js").atan2)(t1.y01, t1.x01), !cw);

          // Otherwise, draw the two corners and the ring.
          else {
            context.arc(t0.cx, t0.cy, rc1, (0, require(_dependencyMap[2], "./math.js").atan2)(t0.y01, t0.x01), (0, require(_dependencyMap[2], "./math.js").atan2)(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r1, (0, require(_dependencyMap[2], "./math.js").atan2)(t0.cy + t0.y11, t0.cx + t0.x11), (0, require(_dependencyMap[2], "./math.js").atan2)(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
            context.arc(t1.cx, t1.cy, rc1, (0, require(_dependencyMap[2], "./math.js").atan2)(t1.y11, t1.x11), (0, require(_dependencyMap[2], "./math.js").atan2)(t1.y01, t1.x01), !cw);
          }
        }

        // Or is the outer ring just a circular arc?
        else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

        // Is there no inner ring, and it’s a circular sector?
        // Or perhaps it’s an annular sector collapsed due to padding?
        if (!(r0 > require(_dependencyMap[2], "./math.js").epsilon) || !(da0 > require(_dependencyMap[2], "./math.js").epsilon)) context.lineTo(x10, y10);

        // Does the sector’s inner ring (or point) have rounded corners?
        else if (rc0 > require(_dependencyMap[2], "./math.js").epsilon) {
          t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
          t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);
          context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

          // Have the corners merged?
          if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, (0, require(_dependencyMap[2], "./math.js").atan2)(t0.y01, t0.x01), (0, require(_dependencyMap[2], "./math.js").atan2)(t1.y01, t1.x01), !cw);

          // Otherwise, draw the two corners and the ring.
          else {
            context.arc(t0.cx, t0.cy, rc0, (0, require(_dependencyMap[2], "./math.js").atan2)(t0.y01, t0.x01), (0, require(_dependencyMap[2], "./math.js").atan2)(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r0, (0, require(_dependencyMap[2], "./math.js").atan2)(t0.cy + t0.y11, t0.cx + t0.x11), (0, require(_dependencyMap[2], "./math.js").atan2)(t1.cy + t1.y11, t1.cx + t1.x11), cw);
            context.arc(t1.cx, t1.cy, rc0, (0, require(_dependencyMap[2], "./math.js").atan2)(t1.y11, t1.x11), (0, require(_dependencyMap[2], "./math.js").atan2)(t1.y01, t1.x01), !cw);
          }
        }

        // Or is the inner ring just a circular arc?
        else context.arc(0, 0, r0, a10, a00, cw);
      }
      context.closePath();
      if (buffer) return context = null, buffer + "" || null;
    }
    arc.centroid = function () {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - require(_dependencyMap[2], "./math.js").pi / 2;
      return [(0, require(_dependencyMap[2], "./math.js").cos)(a) * r, (0, require(_dependencyMap[2], "./math.js").sin)(a) * r];
    };
    arc.innerRadius = function (_) {
      return arguments.length ? (innerRadius = typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : innerRadius;
    };
    arc.outerRadius = function (_) {
      return arguments.length ? (outerRadius = typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : outerRadius;
    };
    arc.cornerRadius = function (_) {
      return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : cornerRadius;
    };
    arc.padRadius = function (_) {
      return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : padRadius;
    };
    arc.startAngle = function (_) {
      return arguments.length ? (startAngle = typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : startAngle;
    };
    arc.endAngle = function (_) {
      return arguments.length ? (endAngle = typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : endAngle;
    };
    arc.padAngle = function (_) {
      return arguments.length ? (padAngle = typeof _ === "function" ? _ : (0, _constant.default)(+_), arc) : padAngle;
    };
    arc.context = function (_) {
      return arguments.length ? (context = _ == null ? null : _, arc) : context;
    };
    return arc;
  }
},4033,[10,4027,4034,4031],"../../node_modules/d3-sankey/node_modules/d3-shape/src/arc.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.abs = void 0;
  exports.acos = acos;
  exports.asin = asin;
  exports.tau = exports.sqrt = exports.sin = exports.pi = exports.min = exports.max = exports.halfPi = exports.epsilon = exports.cos = exports.atan2 = void 0;
  var abs = exports.abs = Math.abs;
  var atan2 = exports.atan2 = Math.atan2;
  var cos = exports.cos = Math.cos;
  var max = exports.max = Math.max;
  var min = exports.min = Math.min;
  var sin = exports.sin = Math.sin;
  var sqrt = exports.sqrt = Math.sqrt;
  var epsilon = exports.epsilon = 1e-12;
  var pi = exports.pi = Math.PI;
  var halfPi = exports.halfPi = pi / 2;
  var tau = exports.tau = 2 * pi;
  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
  }
  function asin(x) {
    return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
  }
},4034,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/math.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "./constant.js"));
  var _linear = _interopRequireDefault(require(_dependencyMap[2], "./curve/linear.js"));
  var _line = _interopRequireDefault(require(_dependencyMap[3], "./line.js"));
  function _default() {
    var x0 = require(_dependencyMap[4], "./point.js").x,
      x1 = null,
      y0 = (0, _constant.default)(0),
      y1 = require(_dependencyMap[4], "./point.js").y,
      defined = (0, _constant.default)(true),
      context = null,
      curve = _linear.default,
      output = null;
    function area(data) {
      var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);
      if (context == null) output = curve(buffer = (0, require(_dependencyMap[5], "d3-path").path)());
      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) {
            j = i;
            output.areaStart();
            output.lineStart();
          } else {
            output.lineEnd();
            output.lineStart();
            for (k = i - 1; k >= j; --k) {
              output.point(x0z[k], y0z[k]);
            }
            output.lineEnd();
            output.areaEnd();
          }
        }
        if (defined0) {
          x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
          output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
        }
      }
      if (buffer) return output = null, buffer + "" || null;
    }
    function arealine() {
      return (0, _line.default)().defined(defined).curve(curve).context(context);
    }
    area.x = function (_) {
      return arguments.length ? (x0 = typeof _ === "function" ? _ : (0, _constant.default)(+_), x1 = null, area) : x0;
    };
    area.x0 = function (_) {
      return arguments.length ? (x0 = typeof _ === "function" ? _ : (0, _constant.default)(+_), area) : x0;
    };
    area.x1 = function (_) {
      return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : (0, _constant.default)(+_), area) : x1;
    };
    area.y = function (_) {
      return arguments.length ? (y0 = typeof _ === "function" ? _ : (0, _constant.default)(+_), y1 = null, area) : y0;
    };
    area.y0 = function (_) {
      return arguments.length ? (y0 = typeof _ === "function" ? _ : (0, _constant.default)(+_), area) : y0;
    };
    area.y1 = function (_) {
      return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : (0, _constant.default)(+_), area) : y1;
    };
    area.lineX0 = area.lineY0 = function () {
      return arealine().x(x0).y(y0);
    };
    area.lineY1 = function () {
      return arealine().x(x0).y(y1);
    };
    area.lineX1 = function () {
      return arealine().x(x1).y(y0);
    };
    area.defined = function (_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : (0, _constant.default)(!!_), area) : defined;
    };
    area.curve = function (_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
    };
    area.context = function (_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
    };
    return area;
  }
},4035,[10,4027,4036,4037,4029,4031],"../../node_modules/d3-sankey/node_modules/d3-shape/src/area.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function Linear(context) {
    this._context = context;
  }
  Linear.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._point = 0;
    },
    lineEnd: function () {
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
        // proceed
        default:
          this._context.lineTo(x, y);
          break;
      }
    }
  };
  function _default(context) {
    return new Linear(context);
  }
},4036,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/linear.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "./constant.js"));
  var _linear = _interopRequireDefault(require(_dependencyMap[2], "./curve/linear.js"));
  function _default() {
    var x = require(_dependencyMap[3], "./point.js").x,
      y = require(_dependencyMap[3], "./point.js").y,
      defined = (0, _constant.default)(true),
      context = null,
      curve = _linear.default,
      output = null;
    function line(data) {
      var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;
      if (context == null) output = curve(buffer = (0, require(_dependencyMap[4], "d3-path").path)());
      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) output.lineStart();else output.lineEnd();
        }
        if (defined0) output.point(+x(d, i, data), +y(d, i, data));
      }
      if (buffer) return output = null, buffer + "" || null;
    }
    line.x = function (_) {
      return arguments.length ? (x = typeof _ === "function" ? _ : (0, _constant.default)(+_), line) : x;
    };
    line.y = function (_) {
      return arguments.length ? (y = typeof _ === "function" ? _ : (0, _constant.default)(+_), line) : y;
    };
    line.defined = function (_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : (0, _constant.default)(!!_), line) : defined;
    };
    line.curve = function (_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
    };
    line.context = function (_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
    };
    return line;
  }
},4037,[10,4027,4036,4029,4031],"../../node_modules/d3-sankey/node_modules/d3-shape/src/line.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "./constant.js"));
  var _descending = _interopRequireDefault(require(_dependencyMap[2], "./descending.js"));
  var _identity = _interopRequireDefault(require(_dependencyMap[3], "./identity.js"));
  function _default() {
    var value = _identity.default,
      sortValues = _descending.default,
      sort = null,
      startAngle = (0, _constant.default)(0),
      endAngle = (0, _constant.default)(require(_dependencyMap[4], "./math.js").tau),
      padAngle = (0, _constant.default)(0);
    function pie(data) {
      var i,
        n = data.length,
        j,
        k,
        sum = 0,
        index = new Array(n),
        arcs = new Array(n),
        a0 = +startAngle.apply(this, arguments),
        da = Math.min(require(_dependencyMap[4], "./math.js").tau, Math.max(-require(_dependencyMap[4], "./math.js").tau, endAngle.apply(this, arguments) - a0)),
        a1,
        p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
        pa = p * (da < 0 ? -1 : 1),
        v;
      for (i = 0; i < n; ++i) {
        if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
          sum += v;
        }
      }

      // Optionally sort the arcs by previously-computed values or by data.
      if (sortValues != null) index.sort(function (i, j) {
        return sortValues(arcs[i], arcs[j]);
      });else if (sort != null) index.sort(function (i, j) {
        return sort(data[i], data[j]);
      });

      // Compute the arcs! They are stored in the original data's order.
      for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
        j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
          data: data[j],
          index: i,
          value: v,
          startAngle: a0,
          endAngle: a1,
          padAngle: p
        };
      }
      return arcs;
    }
    pie.value = function (_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : (0, _constant.default)(+_), pie) : value;
    };
    pie.sortValues = function (_) {
      return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
    };
    pie.sort = function (_) {
      return arguments.length ? (sort = _, sortValues = null, pie) : sort;
    };
    pie.startAngle = function (_) {
      return arguments.length ? (startAngle = typeof _ === "function" ? _ : (0, _constant.default)(+_), pie) : startAngle;
    };
    pie.endAngle = function (_) {
      return arguments.length ? (endAngle = typeof _ === "function" ? _ : (0, _constant.default)(+_), pie) : endAngle;
    };
    pie.padAngle = function (_) {
      return arguments.length ? (padAngle = typeof _ === "function" ? _ : (0, _constant.default)(+_), pie) : padAngle;
    };
    return pie;
  }
},4038,[10,4027,4039,4040,4034],"../../node_modules/d3-sankey/node_modules/d3-shape/src/pie.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }
},4039,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/descending.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(d) {
    return d;
  }
},4040,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/identity.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _radial = _interopRequireWildcard(require(_dependencyMap[1], "./curve/radial.js"));
  var _area = _interopRequireDefault(require(_dependencyMap[2], "./area.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  function _default() {
    var a = (0, _area.default)().curve(_radial.curveRadialLinear),
      c = a.curve,
      x0 = a.lineX0,
      x1 = a.lineX1,
      y0 = a.lineY0,
      y1 = a.lineY1;
    a.angle = a.x, delete a.x;
    a.startAngle = a.x0, delete a.x0;
    a.endAngle = a.x1, delete a.x1;
    a.radius = a.y, delete a.y;
    a.innerRadius = a.y0, delete a.y0;
    a.outerRadius = a.y1, delete a.y1;
    a.lineStartAngle = function () {
      return (0, require(_dependencyMap[3], "./lineRadial.js").lineRadial)(x0());
    }, delete a.lineX0;
    a.lineEndAngle = function () {
      return (0, require(_dependencyMap[3], "./lineRadial.js").lineRadial)(x1());
    }, delete a.lineX1;
    a.lineInnerRadius = function () {
      return (0, require(_dependencyMap[3], "./lineRadial.js").lineRadial)(y0());
    }, delete a.lineY0;
    a.lineOuterRadius = function () {
      return (0, require(_dependencyMap[3], "./lineRadial.js").lineRadial)(y1());
    }, delete a.lineY1;
    a.curve = function (_) {
      return arguments.length ? c((0, _radial.default)(_)) : c()._curve;
    };
    return a;
  }
},4041,[10,4042,4035,4043],"../../node_modules/d3-sankey/node_modules/d3-shape/src/areaRadial.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.curveRadialLinear = void 0;
  exports.default = curveRadial;
  var _linear = _interopRequireDefault(require(_dependencyMap[1], "./linear.js"));
  var curveRadialLinear = exports.curveRadialLinear = curveRadial(_linear.default);
  function Radial(curve) {
    this._curve = curve;
  }
  Radial.prototype = {
    areaStart: function () {
      this._curve.areaStart();
    },
    areaEnd: function () {
      this._curve.areaEnd();
    },
    lineStart: function () {
      this._curve.lineStart();
    },
    lineEnd: function () {
      this._curve.lineEnd();
    },
    point: function (a, r) {
      this._curve.point(r * Math.sin(a), r * -Math.cos(a));
    }
  };
  function curveRadial(curve) {
    function radial(context) {
      return new Radial(curve(context));
    }
    radial._curve = curve;
    return radial;
  }
},4042,[10,4036],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/radial.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  exports.lineRadial = lineRadial;
  var _radial = _interopRequireWildcard(require(_dependencyMap[1], "./curve/radial.js"));
  var _line = _interopRequireDefault(require(_dependencyMap[2], "./line.js"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  function lineRadial(l) {
    var c = l.curve;
    l.angle = l.x, delete l.x;
    l.radius = l.y, delete l.y;
    l.curve = function (_) {
      return arguments.length ? c((0, _radial.default)(_)) : c()._curve;
    };
    return l;
  }
  function _default() {
    return lineRadial((0, _line.default)().curve(_radial.curveRadialLinear));
  }
},4043,[10,4042,4037],"../../node_modules/d3-sankey/node_modules/d3-shape/src/lineRadial.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  exports.symbols = void 0;
  var _circle = _interopRequireDefault(require(_dependencyMap[1], "./symbol/circle.js"));
  var _cross = _interopRequireDefault(require(_dependencyMap[2], "./symbol/cross.js"));
  var _diamond = _interopRequireDefault(require(_dependencyMap[3], "./symbol/diamond.js"));
  var _star = _interopRequireDefault(require(_dependencyMap[4], "./symbol/star.js"));
  var _square = _interopRequireDefault(require(_dependencyMap[5], "./symbol/square.js"));
  var _triangle = _interopRequireDefault(require(_dependencyMap[6], "./symbol/triangle.js"));
  var _wye = _interopRequireDefault(require(_dependencyMap[7], "./symbol/wye.js"));
  var _constant = _interopRequireDefault(require(_dependencyMap[8], "./constant.js"));
  var symbols = exports.symbols = [_circle.default, _cross.default, _diamond.default, _square.default, _star.default, _triangle.default, _wye.default];
  function _default() {
    var type = (0, _constant.default)(_circle.default),
      size = (0, _constant.default)(64),
      context = null;
    function symbol() {
      var buffer;
      if (!context) context = buffer = (0, require(_dependencyMap[9], "d3-path").path)();
      type.apply(this, arguments).draw(context, +size.apply(this, arguments));
      if (buffer) return context = null, buffer + "" || null;
    }
    symbol.type = function (_) {
      return arguments.length ? (type = typeof _ === "function" ? _ : (0, _constant.default)(_), symbol) : type;
    };
    symbol.size = function (_) {
      return arguments.length ? (size = typeof _ === "function" ? _ : (0, _constant.default)(+_), symbol) : size;
    };
    symbol.context = function (_) {
      return arguments.length ? (context = _ == null ? null : _, symbol) : context;
    };
    return symbol;
  }
},4044,[10,4045,4046,4047,4048,4049,4050,4051,4027,4031],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var _default = exports.default = {
    draw: function (context, size) {
      var r = Math.sqrt(size / require(_dependencyMap[0], "../math.js").pi);
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, require(_dependencyMap[0], "../math.js").tau);
    }
  };
},4045,[4034],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/circle.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var _default = exports.default = {
    draw: function (context, size) {
      var r = Math.sqrt(size / 5) / 2;
      context.moveTo(-3 * r, -r);
      context.lineTo(-r, -r);
      context.lineTo(-r, -3 * r);
      context.lineTo(r, -3 * r);
      context.lineTo(r, -r);
      context.lineTo(3 * r, -r);
      context.lineTo(3 * r, r);
      context.lineTo(r, r);
      context.lineTo(r, 3 * r);
      context.lineTo(-r, 3 * r);
      context.lineTo(-r, r);
      context.lineTo(-3 * r, r);
      context.closePath();
    }
  };
},4046,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/cross.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var tan30 = Math.sqrt(1 / 3),
    tan30_2 = tan30 * 2;
  var _default = exports.default = {
    draw: function (context, size) {
      var y = Math.sqrt(size / tan30_2),
        x = y * tan30;
      context.moveTo(0, -y);
      context.lineTo(x, 0);
      context.lineTo(0, y);
      context.lineTo(-x, 0);
      context.closePath();
    }
  };
},4047,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/diamond.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var ka = 0.89081309152928522810,
    kr = Math.sin(require(_dependencyMap[0], "../math.js").pi / 10) / Math.sin(7 * require(_dependencyMap[0], "../math.js").pi / 10),
    kx = Math.sin(require(_dependencyMap[0], "../math.js").tau / 10) * kr,
    ky = -Math.cos(require(_dependencyMap[0], "../math.js").tau / 10) * kr;
  var _default = exports.default = {
    draw: function (context, size) {
      var r = Math.sqrt(size * ka),
        x = kx * r,
        y = ky * r;
      context.moveTo(0, -r);
      context.lineTo(x, y);
      for (var i = 1; i < 5; ++i) {
        var a = require(_dependencyMap[0], "../math.js").tau * i / 5,
          c = Math.cos(a),
          s = Math.sin(a);
        context.lineTo(s * r, -c * r);
        context.lineTo(c * x - s * y, s * x + c * y);
      }
      context.closePath();
    }
  };
},4048,[4034],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/star.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var _default = exports.default = {
    draw: function (context, size) {
      var w = Math.sqrt(size),
        x = -w / 2;
      context.rect(x, x, w, w);
    }
  };
},4049,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/square.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var sqrt3 = Math.sqrt(3);
  var _default = exports.default = {
    draw: function (context, size) {
      var y = -Math.sqrt(size / (sqrt3 * 3));
      context.moveTo(0, y * 2);
      context.lineTo(-sqrt3 * y, -y);
      context.lineTo(sqrt3 * y, -y);
      context.closePath();
    }
  };
},4050,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/triangle.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var c = -0.5,
    s = Math.sqrt(3) / 2,
    k = 1 / Math.sqrt(12),
    a = (k / 2 + 1) * 3;
  var _default = exports.default = {
    draw: function (context, size) {
      var r = Math.sqrt(size / a),
        x0 = r / 2,
        y0 = r * k,
        x1 = x0,
        y1 = r * k + r,
        x2 = -x1,
        y2 = y1;
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
      context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
      context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
      context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
      context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
      context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
      context.closePath();
    }
  };
},4051,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/symbol/wye.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _noop = _interopRequireDefault(require(_dependencyMap[1], "../noop.js"));
  function BasisClosed(context) {
    this._context = context;
  }
  BasisClosed.prototype = {
    areaStart: _noop.default,
    areaEnd: _noop.default,
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 1:
          {
            this._context.moveTo(this._x2, this._y2);
            this._context.closePath();
            break;
          }
        case 2:
          {
            this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
            this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
            this._context.closePath();
            break;
          }
        case 3:
          {
            this.point(this._x2, this._y2);
            this.point(this._x3, this._y3);
            this.point(this._x4, this._y4);
            break;
          }
      }
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._x2 = x, this._y2 = y;
          break;
        case 1:
          this._point = 2;
          this._x3 = x, this._y3 = y;
          break;
        case 2:
          this._point = 3;
          this._x4 = x, this._y4 = y;
          this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6);
          break;
        default:
          (0, require(_dependencyMap[2], "./basis.js").point)(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };
  function _default(context) {
    return new BasisClosed(context);
  }
},4052,[10,4053,4054],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/basisClosed.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default() {}
},4053,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/noop.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Basis = Basis;
  exports.default = _default;
  exports.point = point;
  function point(that, x, y) {
    that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
  }
  function Basis(context) {
    this._context = context;
  }
  Basis.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._y0 = this._y1 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 3:
          point(this, this._x1, this._y1);
        // proceed
        case 2:
          this._context.lineTo(this._x1, this._y1);
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
        // proceed
        default:
          point(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };
  function _default(context) {
    return new Basis(context);
  }
},4054,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/basis.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function BasisOpen(context) {
    this._context = context;
  }
  BasisOpen.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._y0 = this._y1 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          var x0 = (this._x0 + 4 * this._x1 + x) / 6,
            y0 = (this._y0 + 4 * this._y1 + y) / 6;
          this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);
          break;
        case 3:
          this._point = 4;
        // proceed
        default:
          (0, require(_dependencyMap[0], "./basis.js").point)(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };
  function _default(context) {
    return new BasisOpen(context);
  }
},4055,[4054],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/basisOpen.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  function Bundle(context, beta) {
    this._basis = new (require(_dependencyMap[0], "./basis.js").Basis)(context);
    this._beta = beta;
  }
  Bundle.prototype = {
    lineStart: function () {
      this._x = [];
      this._y = [];
      this._basis.lineStart();
    },
    lineEnd: function () {
      var x = this._x,
        y = this._y,
        j = x.length - 1;
      if (j > 0) {
        var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;
        while (++i <= j) {
          t = i / j;
          this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
        }
      }
      this._x = this._y = null;
      this._basis.lineEnd();
    },
    point: function (x, y) {
      this._x.push(+x);
      this._y.push(+y);
    }
  };
  var _default = exports.default = function custom(beta) {
    function bundle(context) {
      return beta === 1 ? new (require(_dependencyMap[0], "./basis.js").Basis)(context) : new Bundle(context, beta);
    }
    bundle.beta = function (beta) {
      return custom(+beta);
    };
    return bundle;
  }(0.85);
},4056,[4054],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/bundle.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CardinalClosed = CardinalClosed;
  exports.default = void 0;
  var _noop = _interopRequireDefault(require(_dependencyMap[1], "../noop.js"));
  function CardinalClosed(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }
  CardinalClosed.prototype = {
    areaStart: _noop.default,
    areaEnd: _noop.default,
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 1:
          {
            this._context.moveTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
        case 2:
          {
            this._context.lineTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
        case 3:
          {
            this.point(this._x3, this._y3);
            this.point(this._x4, this._y4);
            this.point(this._x5, this._y5);
            break;
          }
      }
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._x3 = x, this._y3 = y;
          break;
        case 1:
          this._point = 2;
          this._context.moveTo(this._x4 = x, this._y4 = y);
          break;
        case 2:
          this._point = 3;
          this._x5 = x, this._y5 = y;
          break;
        default:
          (0, require(_dependencyMap[2], "./cardinal.js").point)(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var _default = exports.default = function custom(tension) {
    function cardinal(context) {
      return new CardinalClosed(context, tension);
    }
    cardinal.tension = function (tension) {
      return custom(+tension);
    };
    return cardinal;
  }(0);
},4057,[10,4053,4058],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/cardinalClosed.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Cardinal = Cardinal;
  exports.default = void 0;
  exports.point = point;
  function point(that, x, y) {
    that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
  }
  function Cardinal(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }
  Cardinal.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 2:
          this._context.lineTo(this._x2, this._y2);
          break;
        case 3:
          point(this, this._x1, this._y1);
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          this._x1 = x, this._y1 = y;
          break;
        case 2:
          this._point = 3;
        // proceed
        default:
          point(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var _default = exports.default = function custom(tension) {
    function cardinal(context) {
      return new Cardinal(context, tension);
    }
    cardinal.tension = function (tension) {
      return custom(+tension);
    };
    return cardinal;
  }(0);
},4058,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/cardinal.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CardinalOpen = CardinalOpen;
  exports.default = void 0;
  function CardinalOpen(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }
  CardinalOpen.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
          break;
        case 3:
          this._point = 4;
        // proceed
        default:
          (0, require(_dependencyMap[0], "./cardinal.js").point)(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var _default = exports.default = function custom(tension) {
    function cardinal(context) {
      return new CardinalOpen(context, tension);
    }
    cardinal.tension = function (tension) {
      return custom(+tension);
    };
    return cardinal;
  }(0);
},4059,[4058],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/cardinalOpen.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var _noop = _interopRequireDefault(require(_dependencyMap[1], "../noop.js"));
  function CatmullRomClosed(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }
  CatmullRomClosed.prototype = {
    areaStart: _noop.default,
    areaEnd: _noop.default,
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 1:
          {
            this._context.moveTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
        case 2:
          {
            this._context.lineTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
        case 3:
          {
            this.point(this._x3, this._y3);
            this.point(this._x4, this._y4);
            this.point(this._x5, this._y5);
            break;
          }
      }
    },
    point: function (x, y) {
      x = +x, y = +y;
      if (this._point) {
        var x23 = this._x2 - x,
          y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }
      switch (this._point) {
        case 0:
          this._point = 1;
          this._x3 = x, this._y3 = y;
          break;
        case 1:
          this._point = 2;
          this._context.moveTo(this._x4 = x, this._y4 = y);
          break;
        case 2:
          this._point = 3;
          this._x5 = x, this._y5 = y;
          break;
        default:
          (0, require(_dependencyMap[2], "./catmullRom.js").point)(this, x, y);
          break;
      }
      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var _default = exports.default = function custom(alpha) {
    function catmullRom(context) {
      return alpha ? new CatmullRomClosed(context, alpha) : new (require(_dependencyMap[3], "./cardinalClosed.js").CardinalClosed)(context, 0);
    }
    catmullRom.alpha = function (alpha) {
      return custom(+alpha);
    };
    return catmullRom;
  }(0.5);
},4060,[10,4053,4061,4057],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/catmullRomClosed.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  exports.point = point;
  function point(that, x, y) {
    var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;
    if (that._l01_a > require(_dependencyMap[0], "../math.js").epsilon) {
      var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
      x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
      y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
    }
    if (that._l23_a > require(_dependencyMap[0], "../math.js").epsilon) {
      var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
      x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
      y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
    }
    that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
  }
  function CatmullRom(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }
  CatmullRom.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
    },
    lineEnd: function () {
      switch (this._point) {
        case 2:
          this._context.lineTo(this._x2, this._y2);
          break;
        case 3:
          this.point(this._x2, this._y2);
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      if (this._point) {
        var x23 = this._x2 - x,
          y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
        // proceed
        default:
          point(this, x, y);
          break;
      }
      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var _default = exports.default = function custom(alpha) {
    function catmullRom(context) {
      return alpha ? new CatmullRom(context, alpha) : new (require(_dependencyMap[1], "./cardinal.js").Cardinal)(context, 0);
    }
    catmullRom.alpha = function (alpha) {
      return custom(+alpha);
    };
    return catmullRom;
  }(0.5);
},4061,[4034,4058],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/catmullRom.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  function CatmullRomOpen(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }
  CatmullRomOpen.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
    },
    lineEnd: function () {
      if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      if (this._point) {
        var x23 = this._x2 - x,
          y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }
      switch (this._point) {
        case 0:
          this._point = 1;
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
          break;
        case 3:
          this._point = 4;
        // proceed
        default:
          (0, require(_dependencyMap[0], "./catmullRom.js").point)(this, x, y);
          break;
      }
      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var _default = exports.default = function custom(alpha) {
    function catmullRom(context) {
      return alpha ? new CatmullRomOpen(context, alpha) : new (require(_dependencyMap[1], "./cardinalOpen.js").CardinalOpen)(context, 0);
    }
    catmullRom.alpha = function (alpha) {
      return custom(+alpha);
    };
    return catmullRom;
  }(0.5);
},4062,[4061,4059],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/catmullRomOpen.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _noop = _interopRequireDefault(require(_dependencyMap[1], "../noop.js"));
  function LinearClosed(context) {
    this._context = context;
  }
  LinearClosed.prototype = {
    areaStart: _noop.default,
    areaEnd: _noop.default,
    lineStart: function () {
      this._point = 0;
    },
    lineEnd: function () {
      if (this._point) this._context.closePath();
    },
    point: function (x, y) {
      x = +x, y = +y;
      if (this._point) this._context.lineTo(x, y);else this._point = 1, this._context.moveTo(x, y);
    }
  };
  function _default(context) {
    return new LinearClosed(context);
  }
},4063,[10,4053],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/linearClosed.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function Natural(context) {
    this._context = context;
  }
  Natural.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x = [];
      this._y = [];
    },
    lineEnd: function () {
      var x = this._x,
        y = this._y,
        n = x.length;
      if (n) {
        this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
        if (n === 2) {
          this._context.lineTo(x[1], y[1]);
        } else {
          var px = controlPoints(x),
            py = controlPoints(y);
          for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
            this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
          }
        }
      }
      if (this._line || this._line !== 0 && n === 1) this._context.closePath();
      this._line = 1 - this._line;
      this._x = this._y = null;
    },
    point: function (x, y) {
      this._x.push(+x);
      this._y.push(+y);
    }
  };

  // See https://www.particleincell.com/2012/bezier-splines/ for derivation.
  function controlPoints(x) {
    var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
    a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
    for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
    a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
    for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
    a[n - 1] = r[n - 1] / b[n - 1];
    for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
    b[n - 1] = (x[n] + a[n - 1]) / 2;
    for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
    return [a, b];
  }
  function _default(context) {
    return new Natural(context);
  }
},4064,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/natural.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  exports.stepAfter = stepAfter;
  exports.stepBefore = stepBefore;
  function Step(context, t) {
    this._context = context;
    this._t = t;
  }
  Step.prototype = {
    areaStart: function () {
      this._line = 0;
    },
    areaEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._x = this._y = NaN;
      this._point = 0;
    },
    lineEnd: function () {
      if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
    },
    point: function (x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
        // proceed
        default:
          {
            if (this._t <= 0) {
              this._context.lineTo(this._x, y);
              this._context.lineTo(x, y);
            } else {
              var x1 = this._x * (1 - this._t) + x * this._t;
              this._context.lineTo(x1, this._y);
              this._context.lineTo(x1, y);
            }
            break;
          }
      }
      this._x = x, this._y = y;
    }
  };
  function _default(context) {
    return new Step(context, 0.5);
  }
  function stepBefore(context) {
    return new Step(context, 0);
  }
  function stepAfter(context) {
    return new Step(context, 1);
  }
},4065,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/curve/step.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _constant = _interopRequireDefault(require(_dependencyMap[1], "./constant.js"));
  var _none = _interopRequireDefault(require(_dependencyMap[2], "./offset/none.js"));
  var _none2 = _interopRequireDefault(require(_dependencyMap[3], "./order/none.js"));
  function stackValue(d, key) {
    return d[key];
  }
  function _default() {
    var keys = (0, _constant.default)([]),
      order = _none2.default,
      offset = _none.default,
      value = stackValue;
    function stack(data) {
      var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;
      for (i = 0; i < n; ++i) {
        for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
          si[j] = sij = [0, +value(data[j], ki, j, data)];
          sij.data = data[j];
        }
        si.key = ki;
      }
      for (i = 0, oz = order(sz); i < n; ++i) {
        sz[oz[i]].index = i;
      }
      offset(sz, oz);
      return sz;
    }
    stack.keys = function (_) {
      return arguments.length ? (keys = typeof _ === "function" ? _ : (0, _constant.default)(require(_dependencyMap[4], "./array.js").slice.call(_)), stack) : keys;
    };
    stack.value = function (_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : (0, _constant.default)(+_), stack) : value;
    };
    stack.order = function (_) {
      return arguments.length ? (order = _ == null ? _none2.default : typeof _ === "function" ? _ : (0, _constant.default)(require(_dependencyMap[4], "./array.js").slice.call(_)), stack) : order;
    };
    stack.offset = function (_) {
      return arguments.length ? (offset = _ == null ? _none.default : _, stack) : offset;
    };
    return stack;
  }
},4066,[10,4027,4067,4068,4030],"../../node_modules/d3-sankey/node_modules/d3-shape/src/stack.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(series, order) {
    if (!((n = series.length) > 1)) return;
    for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
      s0 = s1, s1 = series[order[i]];
      for (j = 0; j < m; ++j) {
        s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
      }
    }
  }
},4067,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/offset/none.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(series) {
    var n = series.length,
      o = new Array(n);
    while (--n >= 0) o[n] = n;
    return o;
  }
},4068,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/order/none.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _none = _interopRequireDefault(require(_dependencyMap[1], "./none.js"));
  function _default(series, order) {
    if (!((n = series.length) > 0)) return;
    for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
      for (y = i = 0; i < n; ++i) y += series[i][j][1] || 0;
      if (y) for (i = 0; i < n; ++i) series[i][j][1] /= y;
    }
    (0, _none.default)(series, order);
  }
},4069,[10,4067],"../../node_modules/d3-sankey/node_modules/d3-shape/src/offset/expand.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  function _default(series, order) {
    if (!((n = series.length) > 0)) return;
    for (var i, j = 0, d, dy, yp, yn, n, m = series[order[0]].length; j < m; ++j) {
      for (yp = yn = 0, i = 0; i < n; ++i) {
        if ((dy = (d = series[order[i]][j])[1] - d[0]) > 0) {
          d[0] = yp, d[1] = yp += dy;
        } else if (dy < 0) {
          d[1] = yn, d[0] = yn += dy;
        } else {
          d[0] = 0, d[1] = dy;
        }
      }
    }
  }
},4070,[],"../../node_modules/d3-sankey/node_modules/d3-shape/src/offset/diverging.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _none = _interopRequireDefault(require(_dependencyMap[1], "./none.js"));
  function _default(series, order) {
    if (!((n = series.length) > 0)) return;
    for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
      for (var i = 0, y = 0; i < n; ++i) y += series[i][j][1] || 0;
      s0[j][1] += s0[j][0] = -y / 2;
    }
    (0, _none.default)(series, order);
  }
},4071,[10,4067],"../../node_modules/d3-sankey/node_modules/d3-shape/src/offset/silhouette.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _none = _interopRequireDefault(require(_dependencyMap[1], "./none.js"));
  function _default(series, order) {
    if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
    for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
      for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
        var si = series[order[i]],
          sij0 = si[j][1] || 0,
          sij1 = si[j - 1][1] || 0,
          s3 = (sij0 - sij1) / 2;
        for (var k = 0; k < i; ++k) {
          var sk = series[order[k]],
            skj0 = sk[j][1] || 0,
            skj1 = sk[j - 1][1] || 0;
          s3 += skj0 - skj1;
        }
        s1 += sij0, s2 += s3 * sij0;
      }
      s0[j - 1][1] += s0[j - 1][0] = y;
      if (s1) y -= s2 / s1;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    (0, _none.default)(series, order);
  }
},4072,[10,4067],"../../node_modules/d3-sankey/node_modules/d3-shape/src/offset/wiggle.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _none = _interopRequireDefault(require(_dependencyMap[1], "./none.js"));
  function _default(series) {
    var peaks = series.map(peak);
    return (0, _none.default)(series).sort(function (a, b) {
      return peaks[a] - peaks[b];
    });
  }
  function peak(series) {
    var i = -1,
      j = 0,
      n = series.length,
      vi,
      vj = -Infinity;
    while (++i < n) if ((vi = +series[i][1]) > vj) vj = vi, j = i;
    return j;
  }
},4073,[10,4068],"../../node_modules/d3-sankey/node_modules/d3-shape/src/order/appearance.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  exports.sum = sum;
  var _none = _interopRequireDefault(require(_dependencyMap[1], "./none.js"));
  function _default(series) {
    var sums = series.map(sum);
    return (0, _none.default)(series).sort(function (a, b) {
      return sums[a] - sums[b];
    });
  }
  function sum(series) {
    var s = 0,
      i = -1,
      n = series.length,
      v;
    while (++i < n) if (v = +series[i][1]) s += v;
    return s;
  }
},4074,[10,4068],"../../node_modules/d3-sankey/node_modules/d3-shape/src/order/ascending.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _ascending = _interopRequireDefault(require(_dependencyMap[1], "./ascending.js"));
  function _default(series) {
    return (0, _ascending.default)(series).reverse();
  }
},4075,[10,4074],"../../node_modules/d3-sankey/node_modules/d3-shape/src/order/descending.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _appearance = _interopRequireDefault(require(_dependencyMap[1], "./appearance.js"));
  function _default(series) {
    var n = series.length,
      i,
      j,
      sums = series.map(require(_dependencyMap[2], "./ascending.js").sum),
      order = (0, _appearance.default)(series),
      top = 0,
      bottom = 0,
      tops = [],
      bottoms = [];
    for (i = 0; i < n; ++i) {
      j = order[i];
      if (top < bottom) {
        top += sums[j];
        tops.push(j);
      } else {
        bottom += sums[j];
        bottoms.push(j);
      }
    }
    return bottoms.reverse().concat(tops);
  }
},4076,[10,4073,4074],"../../node_modules/d3-sankey/node_modules/d3-shape/src/order/insideOut.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _default;
  var _none = _interopRequireDefault(require(_dependencyMap[1], "./none.js"));
  function _default(series) {
    return (0, _none.default)(series).reverse();
  }
},4077,[10,4068],"../../node_modules/d3-sankey/node_modules/d3-shape/src/order/reverse.js");
//# sourceMappingURL=http://localhost:8081/packages/happy-app/index.ts.map?platform=web&dev=true&hot=false&transform.routerRoot=.%2Fsources%2Fapp&resolver.exporting=true&serializer.splitChunks=true&serializer.output=static&serializer.map=true
//# debugId=28b48f53-155d-43aa-af3a-77a5df3860ad