use std::{cell::RefCell, collections::HashSet, rc::Rc};

use super::models::{
    LuauDocEntry, LuauFileAnalysis, LuauFileSymbol, LuauScanMode, LuauSymbolKind, ScopeFrame,
};

const CURRENT_FILE_DOC_SOURCE: &str = "Current File";

type SharedScope = Rc<RefCell<ScopeFrame>>;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum TokenKind {
    Identifier,
    Newline,
    Number,
    Symbol,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct LuauToken {
    kind: TokenKind,
    value: String,
    start: usize,
    end: usize,
    start_byte: usize,
    end_byte: usize,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct TokenBoundary {
    start: usize,
    end: usize,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct PendingLuauFileSymbol {
    label: String,
    kind: LuauSymbolKind,
    detail: String,
    declaration: TokenBoundary,
    is_lexical: bool,
    owner_function: Option<SharedScope>,
    scope: SharedScope,
    visible_start: usize,
    doc_summary: String,
    signature: Option<String>,
    insert_text: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct ParsedParameter {
    declaration: TokenBoundary,
    detail: String,
    kind: LuauSymbolKind,
    label: String,
    summary: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct ParsedBinding {
    declaration: TokenBoundary,
    label: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct CursorPosition {
    byte: usize,
    utf16: usize,
}

struct LuauSymbolScanner<'content> {
    content: &'content str,
    mode: LuauScanMode,
    tokens: Vec<LuauToken>,
    index: usize,
    function_scopes: Vec<SharedScope>,
    pending_symbols: Vec<PendingLuauFileSymbol>,
    root_scope: SharedScope,
}

pub(crate) fn scan_luau_file_analysis(content: &str, mode: LuauScanMode) -> LuauFileAnalysis {
    LuauSymbolScanner::new(content, mode).scan()
}

impl<'content> LuauSymbolScanner<'content> {
    fn new(content: &'content str, mode: LuauScanMode) -> Self {
        let content_length = content.encode_utf16().count();

        Self {
            content,
            mode,
            tokens: tokenize_luau(content),
            index: 0,
            function_scopes: Vec::new(),
            pending_symbols: Vec::new(),
            root_scope: Rc::new(RefCell::new(ScopeFrame {
                start: 0,
                end: content_length,
            })),
        }
    }

    fn scan(mut self) -> LuauFileAnalysis {
        self.parse_block(self.root_scope.clone(), &HashSet::new(), None);

        LuauFileAnalysis {
            function_scopes: self
                .function_scopes
                .into_iter()
                .map(|scope| *scope.borrow())
                .collect(),
            symbols: self
                .pending_symbols
                .into_iter()
                .map(|symbol| {
                    let scope = *symbol.scope.borrow();
                    let owner_function =
                        symbol.owner_function.as_ref().map(|value| *value.borrow());

                    LuauFileSymbol {
                        label: symbol.label,
                        kind: symbol.kind,
                        detail: symbol.detail,
                        declaration_start: symbol.declaration.start,
                        declaration_end: symbol.declaration.end,
                        is_lexical: symbol.is_lexical,
                        owner_function_start: owner_function.map(|value| value.start),
                        owner_function_end: owner_function.map(|value| value.end),
                        scope_start: scope.start,
                        scope_end: scope.end,
                        visible_start: symbol.visible_start,
                        visible_end: scope.end,
                        doc: LuauDocEntry {
                            summary: symbol.doc_summary,
                            source: CURRENT_FILE_DOC_SOURCE.to_string(),
                            signature: symbol.signature,
                        },
                        insert_text: symbol.insert_text,
                        score: Some(2000),
                    }
                })
                .collect(),
        }
    }

    fn add_symbol(
        &mut self,
        declaration: TokenBoundary,
        detail: &str,
        doc_summary: &str,
        is_lexical: bool,
        kind: LuauSymbolKind,
        label: impl Into<String>,
        owner_function: Option<SharedScope>,
        scope: SharedScope,
        signature: Option<String>,
        insert_text: Option<String>,
        visible_start: Option<usize>,
    ) {
        self.pending_symbols.push(PendingLuauFileSymbol {
            label: label.into(),
            kind,
            detail: detail.to_string(),
            declaration,
            is_lexical,
            owner_function,
            scope,
            visible_start: visible_start.unwrap_or(declaration.end),
            doc_summary: doc_summary.to_string(),
            signature,
            insert_text,
        });
    }

    fn current(&self) -> Option<&LuauToken> {
        self.tokens.get(self.index)
    }

    fn peek_non_newline(&self, offset: usize) -> Option<&LuauToken> {
        let mut token_index = self.index + offset;

        while let Some(token) = self.tokens.get(token_index) {
            if token.kind != TokenKind::Newline {
                return Some(token);
            }

            token_index += 1;
        }

        None
    }

    fn root_scope_end(&self) -> usize {
        self.root_scope.borrow().end
    }

    fn is_current_keyword(&self, keyword: &str) -> bool {
        matches!(
            self.current(),
            Some(token) if token.kind == TokenKind::Identifier && token.value == keyword
        )
    }

    fn is_keyword_token(token: Option<&LuauToken>, keyword: &str) -> bool {
        matches!(
            token,
            Some(value) if value.kind == TokenKind::Identifier && value.value == keyword
        )
    }

    fn is_block_terminator(&self, token: Option<&LuauToken>, end_keywords: &HashSet<&str>) -> bool {
        matches!(
            token,
            Some(value)
                if value.kind == TokenKind::Identifier && end_keywords.contains(value.value.as_str())
        )
    }

    fn match_keyword(&mut self, keyword: &str) -> bool {
        if !self.is_current_keyword(keyword) {
            return false;
        }

        self.index += 1;
        true
    }

    fn match_symbol(&mut self, symbol: &str) -> bool {
        let Some(token) = self.current() else {
            return false;
        };

        if token.kind != TokenKind::Symbol || token.value != symbol {
            return false;
        }

        self.index += 1;
        true
    }

    fn can_start_bare_assignment(&self) -> bool {
        matches!(
            (self.current(), self.peek_non_newline(1)),
            (
                Some(current_token),
                Some(next_token)
            ) if current_token.kind == TokenKind::Identifier
                && next_token.kind == TokenKind::Symbol
                && next_token.value == "="
        )
    }

    fn consume_end_keyword(&mut self) -> TokenBoundary {
        let Some(token) = self.current().cloned() else {
            let end = self.root_scope_end();

            return TokenBoundary { start: end, end };
        };

        self.index += 1;

        TokenBoundary {
            start: token.start,
            end: token.end,
        }
    }

    fn parse_block(
        &mut self,
        scope: SharedScope,
        end_keywords: &HashSet<&str>,
        current_function_scope: Option<SharedScope>,
    ) {
        while self.index < self.tokens.len() {
            self.skip_newlines_and_semicolons();

            let token = self.current();

            if token.is_none() || self.is_block_terminator(token, end_keywords) {
                return;
            }

            if self.match_keyword("do") {
                self.parse_scoped_block(
                    hash_set(["end"]),
                    current_function_scope.clone(),
                    None,
                    None,
                );
                continue;
            }

            if self.match_keyword("while") {
                self.skip_until_keyword("do");

                if self.match_keyword("do") {
                    self.parse_scoped_block(
                        hash_set(["end"]),
                        current_function_scope.clone(),
                        None,
                        None,
                    );
                }

                continue;
            }

            if self.match_keyword("repeat") {
                self.parse_repeat_block(current_function_scope.clone());
                continue;
            }

            if self.match_keyword("if") {
                self.parse_if_statement(current_function_scope.clone());
                continue;
            }

            if self.match_keyword("for") {
                self.parse_for_statement(current_function_scope.clone());
                continue;
            }

            if self.match_keyword("local") {
                if self.match_keyword("function") {
                    self.parse_function_declaration(
                        scope.clone(),
                        current_function_scope.clone(),
                        true,
                    );
                } else {
                    self.parse_local_bindings(scope.clone(), current_function_scope.clone());
                }

                continue;
            }

            if self.match_keyword("function") {
                self.parse_function_declaration(
                    scope.clone(),
                    current_function_scope.clone(),
                    false,
                );
                continue;
            }

            if self.match_keyword("export") {
                self.skip_simple_statement();
                continue;
            }

            if self.can_start_bare_assignment() {
                self.parse_bare_assignment();
                continue;
            }

            self.skip_simple_statement();
        }
    }

    fn parse_bare_assignment(&mut self) {
        if self.mode == LuauScanMode::Functions {
            self.skip_simple_statement();
            return;
        }

        let Some(identifier_token) = self.current().cloned() else {
            return;
        };

        if identifier_token.kind != TokenKind::Identifier {
            return;
        }

        self.index += 1;

        let equals_token = self.peek_non_newline(0).cloned();

        if let Some(equals_token) = equals_token {
            if equals_token.kind == TokenKind::Symbol && equals_token.value == "=" {
                if let Some(equals_index) = self.tokens.iter().position(|candidate| {
                    candidate.start == equals_token.start && candidate.end == equals_token.end
                }) {
                    self.index = equals_index + 1;
                    self.add_symbol(
                        TokenBoundary {
                            start: identifier_token.start,
                            end: identifier_token.end,
                        },
                        "global variable",
                        "Global variable assigned in the current file.",
                        false,
                        LuauSymbolKind::Constant,
                        identifier_token.value,
                        None,
                        self.root_scope.clone(),
                        None,
                        None,
                        Some(identifier_token.end),
                    );
                }
            }
        }

        self.skip_simple_statement();
    }

    fn parse_bindings(&mut self) -> Vec<ParsedBinding> {
        let mut bindings = Vec::new();

        loop {
            let Some(binding_token) = self.current().cloned() else {
                break;
            };

            if binding_token.kind != TokenKind::Identifier {
                break;
            }

            bindings.push(ParsedBinding {
                label: binding_token.value,
                declaration: TokenBoundary {
                    start: binding_token.start,
                    end: binding_token.end,
                },
            });
            self.index += 1;

            if self.match_symbol(":") {
                self.skip_type_expression(hash_set([",", "=", "\n", ")"]));
            }

            if !self.match_symbol(",") {
                break;
            }
        }

        bindings
    }

    fn parse_for_bindings(&mut self) -> Vec<ParsedBinding> {
        let mut bindings = Vec::new();

        loop {
            let Some(token) = self.current().cloned() else {
                break;
            };

            if token.kind != TokenKind::Identifier {
                break;
            }

            bindings.push(ParsedBinding {
                label: token.value,
                declaration: TokenBoundary {
                    start: token.start,
                    end: token.end,
                },
            });
            self.index += 1;

            if self.match_symbol(":") {
                self.skip_type_expression(hash_set([",", "=", "in", "do"]));
            }

            if !self.match_symbol(",") {
                break;
            }
        }

        bindings
    }

    fn parse_for_statement(&mut self, current_function_scope: Option<SharedScope>) {
        let bindings = self.parse_for_bindings();

        while let Some(token) = self.current() {
            if self.is_current_keyword("do") || token.kind == TokenKind::Newline {
                break;
            }

            self.index += 1;
        }

        if !self.match_keyword("do") {
            return;
        }

        let loop_scope_start = self
            .current()
            .map_or(self.root_scope_end(), |token| token.start);

        self.parse_scoped_block(
            hash_set(["end"]),
            current_function_scope.clone(),
            Some(Box::new(move |scope, scanner| {
                scope.borrow_mut().start = loop_scope_start;

                if scanner.mode == LuauScanMode::Functions {
                    return;
                }

                for binding in &bindings {
                    scanner.add_symbol(
                        binding.declaration,
                        "loop variable",
                        "Loop variable declared in the current file.",
                        true,
                        LuauSymbolKind::Constant,
                        binding.label.clone(),
                        current_function_scope.clone(),
                        scope.clone(),
                        None,
                        None,
                        None,
                    );
                }
            })),
            None,
        );
    }

    fn parse_function_declaration(
        &mut self,
        parent_scope: SharedScope,
        current_function_scope: Option<SharedScope>,
        is_local: bool,
    ) {
        let mut name_segments = Vec::new();
        let mut uses_method_syntax = false;
        let mut function_label = None;
        let mut function_kind = LuauSymbolKind::Function;
        let declaration_start = self
            .current()
            .map_or(self.root_scope_end(), |token| token.start);
        let declaration_start_byte = self
            .current()
            .map_or(self.content.len(), |token| token.start_byte);

        while let Some(token) = self.current().cloned() {
            if token.kind == TokenKind::Identifier {
                name_segments.push(token);
                self.index += 1;
                continue;
            }

            if token.kind == TokenKind::Symbol && (token.value == "." || token.value == ":") {
                uses_method_syntax = uses_method_syntax || token.value == ":";
                self.index += 1;
                continue;
            }

            break;
        }

        if !name_segments.is_empty() {
            function_label = if is_local {
                name_segments.last().map(|token| token.value.clone())
            } else {
                name_segments.first().map(|token| token.value.clone())
            };
            function_kind = if name_segments.len() == 1 {
                LuauSymbolKind::Function
            } else {
                LuauSymbolKind::Namespace
            };
        }

        while self.match_symbol("<") {
            self.skip_balanced_type_parameters("<", ">");
        }

        if !self.match_symbol("(") {
            return;
        }

        let parameter_tokens = self.parse_function_parameters();

        if self.match_symbol(":") {
            self.skip_type_expression(hash_set(["\n"]));
        }

        let function_scope_start = self
            .current()
            .map_or(self.root_scope_end(), |token| token.start);
        let function_scope_start_byte = self
            .current()
            .map_or(self.content.len(), |token| token.start_byte);
        let function_scope = Rc::new(RefCell::new(ScopeFrame {
            start: function_scope_start,
            end: self.root_scope_end(),
        }));
        let function_scope_for_block = function_scope.clone();

        self.function_scopes.push(function_scope.clone());

        self.parse_scoped_block(
            hash_set(["end"]),
            Some(function_scope.clone()),
            Some(Box::new(move |scope, scanner| {
                scope.borrow_mut().start = function_scope_start;

                if scanner.mode == LuauScanMode::Functions {
                    return;
                }

                for parameter in &parameter_tokens {
                    scanner.add_symbol(
                        parameter.declaration,
                        &parameter.detail,
                        &parameter.summary,
                        true,
                        parameter.kind,
                        parameter.label.clone(),
                        Some(function_scope.clone()),
                        scope.clone(),
                        None,
                        None,
                        None,
                    );
                }

                if uses_method_syntax {
                    let scope_start = scope.borrow().start;

                    scanner.add_symbol(
                        TokenBoundary {
                            start: declaration_start,
                            end: declaration_start,
                        },
                        "parameter",
                        "Implicit method receiver parameter in the current file.",
                        true,
                        LuauSymbolKind::Constant,
                        "self",
                        Some(function_scope.clone()),
                        scope.clone(),
                        None,
                        None,
                        Some(scope_start),
                    );
                }
            })),
            Some(function_scope_for_block),
        );

        let Some(function_label) = function_label else {
            return;
        };

        let declaration_end = self
            .tokens
            .get(self.index.saturating_sub(1))
            .map_or(declaration_start, |token| token.end);
        let signature =
            normalize_whitespace(&self.content[declaration_start_byte..function_scope_start_byte]);

        self.add_symbol(
            TokenBoundary {
                start: declaration_start,
                end: declaration_end,
            },
            if function_kind == LuauSymbolKind::Namespace {
                "function namespace"
            } else if is_local {
                "local function"
            } else {
                "function"
            },
            if function_kind == LuauSymbolKind::Namespace {
                "Function namespace declared in the current file."
            } else {
                "Function declared in the current file."
            },
            is_local,
            function_kind,
            function_label,
            if is_local {
                current_function_scope
            } else {
                None
            },
            if is_local {
                parent_scope
            } else {
                self.root_scope.clone()
            },
            (!signature.is_empty()).then_some(signature),
            None,
            Some(declaration_start),
        );
    }

    fn parse_function_parameters(&mut self) -> Vec<ParsedParameter> {
        let mut parameters = Vec::new();
        let mut paren_depth = 1usize;

        while let Some(token) = self.current().cloned() {
            if token.kind == TokenKind::Symbol && token.value == "(" {
                paren_depth += 1;
                self.index += 1;
                continue;
            }

            if token.kind == TokenKind::Symbol && token.value == ")" {
                paren_depth = paren_depth.saturating_sub(1);
                self.index += 1;

                if paren_depth == 0 {
                    break;
                }

                continue;
            }

            if paren_depth == 1 && token.kind == TokenKind::Symbol && token.value == "..." {
                parameters.push(ParsedParameter {
                    declaration: TokenBoundary {
                        start: token.start,
                        end: token.end,
                    },
                    detail: "parameter".to_string(),
                    kind: LuauSymbolKind::Constant,
                    label: token.value,
                    summary: "Variadic parameter declared in the current file.".to_string(),
                });
                self.index += 1;

                if self.match_symbol(":") {
                    self.skip_type_expression(hash_set([",", ")"]));
                }

                continue;
            }

            if paren_depth == 1 && token.kind == TokenKind::Identifier {
                parameters.push(ParsedParameter {
                    declaration: TokenBoundary {
                        start: token.start,
                        end: token.end,
                    },
                    detail: "parameter".to_string(),
                    kind: LuauSymbolKind::Constant,
                    label: token.value,
                    summary: "Parameter declared in the current file.".to_string(),
                });
                self.index += 1;

                if self.match_symbol(":") {
                    self.skip_type_expression(hash_set([",", ")"]));
                }

                continue;
            }

            self.index += 1;
        }

        parameters
    }

    fn parse_if_statement(&mut self, current_function_scope: Option<SharedScope>) {
        self.skip_until_keyword("then");

        if !self.match_keyword("then") {
            return;
        }

        self.parse_scoped_block(
            hash_set(["elseif", "else", "end"]),
            current_function_scope.clone(),
            None,
            None,
        );

        while self.match_keyword("elseif") {
            self.skip_until_keyword("then");

            if !self.match_keyword("then") {
                return;
            }

            self.parse_scoped_block(
                hash_set(["elseif", "else", "end"]),
                current_function_scope.clone(),
                None,
                None,
            );
        }

        if self.match_keyword("else") {
            self.parse_scoped_block(hash_set(["end"]), current_function_scope, None, None);
        }

        let _ = self.match_keyword("end");
    }

    fn parse_local_bindings(
        &mut self,
        scope: SharedScope,
        current_function_scope: Option<SharedScope>,
    ) {
        if self.mode == LuauScanMode::Functions {
            self.skip_simple_statement();
            return;
        }

        let bindings = self.parse_bindings();
        let visible_start = self
            .current()
            .map_or(self.root_scope_end(), |token| token.start);

        self.skip_simple_statement();

        for binding in bindings {
            self.add_symbol(
                binding.declaration,
                "local variable",
                "Local variable declared in the current file.",
                true,
                LuauSymbolKind::Constant,
                binding.label,
                current_function_scope.clone(),
                scope.clone(),
                None,
                None,
                Some(visible_start),
            );
        }
    }

    fn parse_repeat_block(&mut self, current_function_scope: Option<SharedScope>) {
        let repeat_scope = Rc::new(RefCell::new(ScopeFrame {
            start: self
                .current()
                .map_or(self.root_scope_end(), |token| token.start),
            end: self.root_scope_end(),
        }));

        self.parse_block(
            repeat_scope.clone(),
            &hash_set(["until"]),
            current_function_scope,
        );

        let until_token_start = self.current().map(|token| token.start);

        if !self.match_keyword("until") {
            repeat_scope.borrow_mut().end = self
                .current()
                .map_or(self.root_scope_end(), |token| token.start);
            return;
        }

        self.skip_simple_statement();
        repeat_scope.borrow_mut().end = self.tokens.get(self.index.saturating_sub(1)).map_or_else(
            || until_token_start.unwrap_or(self.root_scope_end()),
            |token| token.end,
        );
    }

    fn parse_scoped_block(
        &mut self,
        end_keywords: HashSet<&str>,
        current_function_scope: Option<SharedScope>,
        initialize_scope: Option<Box<dyn FnOnce(&SharedScope, &mut Self)>>,
        existing_scope: Option<SharedScope>,
    ) {
        let child_scope = existing_scope.unwrap_or_else(|| {
            Rc::new(RefCell::new(ScopeFrame {
                start: self
                    .current()
                    .map_or(self.root_scope_end(), |token| token.start),
                end: self.root_scope_end(),
            }))
        });

        if let Some(initialize_scope) = initialize_scope {
            initialize_scope(&child_scope, self);
        }

        self.parse_block(child_scope.clone(), &end_keywords, current_function_scope);

        child_scope.borrow_mut().end = self
            .current()
            .map_or(self.root_scope_end(), |token| token.start);

        if self.is_current_keyword("end") {
            let _ = self.consume_end_keyword();
        }
    }

    fn skip_balanced_type_parameters(&mut self, open_symbol: &str, close_symbol: &str) {
        let mut depth = 1usize;

        while let Some(token) = self.current() {
            if token.kind == TokenKind::Symbol && token.value == open_symbol {
                depth += 1;
            } else if token.kind == TokenKind::Symbol && token.value == close_symbol {
                depth = depth.saturating_sub(1);
            }

            self.index += 1;

            if depth == 0 {
                break;
            }
        }
    }

    fn skip_newlines_and_semicolons(&mut self) {
        while let Some(token) = self.current() {
            if token.kind != TokenKind::Newline
                && !(token.kind == TokenKind::Symbol && token.value == ";")
            {
                return;
            }

            self.index += 1;
        }
    }

    fn skip_simple_statement(&mut self) {
        let mut paren_depth = 0usize;
        let mut bracket_depth = 0usize;
        let mut brace_depth = 0usize;

        while let Some(token) = self.current() {
            if token.kind == TokenKind::Newline
                && paren_depth == 0
                && bracket_depth == 0
                && brace_depth == 0
            {
                return;
            }

            if paren_depth == 0
                && bracket_depth == 0
                && brace_depth == 0
                && token.kind == TokenKind::Symbol
                && token.value == ";"
            {
                self.index += 1;
                return;
            }

            if token.kind == TokenKind::Symbol {
                match token.value.as_str() {
                    "(" => paren_depth += 1,
                    ")" if paren_depth > 0 => paren_depth -= 1,
                    "[" => bracket_depth += 1,
                    "]" if bracket_depth > 0 => bracket_depth -= 1,
                    "{" => brace_depth += 1,
                    "}" if brace_depth > 0 => brace_depth -= 1,
                    _ => {}
                }
            }

            self.index += 1;
        }
    }

    fn skip_type_expression(&mut self, stop_values: HashSet<&str>) {
        let mut paren_depth = 0usize;
        let mut bracket_depth = 0usize;
        let mut brace_depth = 0usize;
        let mut angle_depth = 0usize;

        while let Some(token) = self.current() {
            if paren_depth == 0
                && bracket_depth == 0
                && brace_depth == 0
                && angle_depth == 0
                && ((token.kind == TokenKind::Symbol && stop_values.contains(token.value.as_str()))
                    || (token.kind == TokenKind::Identifier
                        && stop_values.contains(token.value.as_str()))
                    || (token.kind == TokenKind::Newline && stop_values.contains("\n")))
            {
                return;
            }

            if token.kind == TokenKind::Symbol {
                match token.value.as_str() {
                    "(" => paren_depth += 1,
                    ")" if paren_depth > 0 => paren_depth -= 1,
                    "[" => bracket_depth += 1,
                    "]" if bracket_depth > 0 => bracket_depth -= 1,
                    "{" => brace_depth += 1,
                    "}" if brace_depth > 0 => brace_depth -= 1,
                    "<" => angle_depth += 1,
                    ">" if angle_depth > 0 => angle_depth -= 1,
                    _ => {}
                }
            }

            self.index += 1;
        }
    }

    fn skip_until_keyword(&mut self, keyword: &str) {
        let mut paren_depth = 0usize;
        let mut bracket_depth = 0usize;
        let mut brace_depth = 0usize;

        while let Some(token) = self.current() {
            if paren_depth == 0
                && bracket_depth == 0
                && brace_depth == 0
                && Self::is_keyword_token(Some(token), keyword)
            {
                return;
            }

            if token.kind == TokenKind::Symbol {
                match token.value.as_str() {
                    "(" => paren_depth += 1,
                    ")" if paren_depth > 0 => paren_depth -= 1,
                    "[" => bracket_depth += 1,
                    "]" if bracket_depth > 0 => bracket_depth -= 1,
                    "{" => brace_depth += 1,
                    "}" if brace_depth > 0 => brace_depth -= 1,
                    _ => {}
                }
            }

            self.index += 1;
        }
    }
}

fn tokenize_luau(content: &str) -> Vec<LuauToken> {
    let mut tokens = Vec::new();
    let mut cursor = CursorPosition { byte: 0, utf16: 0 };

    while cursor.byte < content.len() {
        let character = current_char(content, cursor.byte).expect("cursor remains in bounds");
        let next_character = next_char(content, cursor.byte);

        if character == '\r' {
            advance_char(content, &mut cursor);
            continue;
        }

        if character == '\n' {
            push_newline_token(&mut tokens, &cursor);
            advance_char(content, &mut cursor);
            continue;
        }

        if character.is_whitespace() {
            advance_char(content, &mut cursor);
            continue;
        }

        if character == '-' && next_character == Some('-') {
            let mut comment_cursor = cursor;
            advance_char(content, &mut comment_cursor);
            advance_char(content, &mut comment_cursor);

            if let Some((close_delimiter, delimiter_length)) =
                match_long_bracket(&content[comment_cursor.byte..])
            {
                advance_bytes(&mut comment_cursor, delimiter_length);

                while comment_cursor.byte < content.len()
                    && !content[comment_cursor.byte..].starts_with(&close_delimiter)
                {
                    if current_char(content, comment_cursor.byte) == Some('\n') {
                        push_newline_token(&mut tokens, &comment_cursor);
                    }

                    advance_char(content, &mut comment_cursor);
                }

                if content[comment_cursor.byte..].starts_with(&close_delimiter) {
                    advance_bytes(&mut comment_cursor, close_delimiter.len());
                }

                cursor = comment_cursor;
                continue;
            }

            cursor = comment_cursor;

            while cursor.byte < content.len() && current_char(content, cursor.byte) != Some('\n') {
                advance_char(content, &mut cursor);
            }

            continue;
        }

        if matches!(character, '\'' | '"' | '`') {
            let quote = character;
            advance_char(content, &mut cursor);

            while cursor.byte < content.len() {
                let value = current_char(content, cursor.byte).expect("cursor remains in bounds");

                if value == '\\' {
                    advance_char(content, &mut cursor);

                    if cursor.byte < content.len() {
                        advance_char(content, &mut cursor);
                    }

                    continue;
                }

                if value == '\n' {
                    push_newline_token(&mut tokens, &cursor);
                }

                advance_char(content, &mut cursor);

                if value == quote {
                    break;
                }
            }

            continue;
        }

        if character == '[' {
            if let Some((close_delimiter, delimiter_length)) =
                match_long_bracket(&content[cursor.byte..])
            {
                advance_bytes(&mut cursor, delimiter_length);

                while cursor.byte < content.len()
                    && !content[cursor.byte..].starts_with(&close_delimiter)
                {
                    if current_char(content, cursor.byte) == Some('\n') {
                        push_newline_token(&mut tokens, &cursor);
                    }

                    advance_char(content, &mut cursor);
                }

                if content[cursor.byte..].starts_with(&close_delimiter) {
                    advance_bytes(&mut cursor, close_delimiter.len());
                }

                continue;
            }
        }

        if content[cursor.byte..].starts_with("...") {
            tokens.push(LuauToken {
                kind: TokenKind::Symbol,
                value: "...".to_string(),
                start: cursor.utf16,
                end: cursor.utf16 + 3,
                start_byte: cursor.byte,
                end_byte: cursor.byte + 3,
            });
            cursor.byte += 3;
            cursor.utf16 += 3;
            continue;
        }

        if content[cursor.byte..].starts_with("::") {
            tokens.push(LuauToken {
                kind: TokenKind::Symbol,
                value: "::".to_string(),
                start: cursor.utf16,
                end: cursor.utf16 + 2,
                start_byte: cursor.byte,
                end_byte: cursor.byte + 2,
            });
            cursor.byte += 2;
            cursor.utf16 += 2;
            continue;
        }

        if is_identifier_start(character) {
            let start = cursor;
            advance_char(content, &mut cursor);

            while cursor.byte < content.len()
                && current_char(content, cursor.byte).is_some_and(is_identifier_part)
            {
                advance_char(content, &mut cursor);
            }

            tokens.push(LuauToken {
                kind: TokenKind::Identifier,
                value: content[start.byte..cursor.byte].to_string(),
                start: start.utf16,
                end: cursor.utf16,
                start_byte: start.byte,
                end_byte: cursor.byte,
            });
            continue;
        }

        if character.is_ascii_digit() {
            let start = cursor;
            advance_char(content, &mut cursor);

            while cursor.byte < content.len()
                && current_char(content, cursor.byte).is_some_and(is_number_part)
            {
                advance_char(content, &mut cursor);
            }

            tokens.push(LuauToken {
                kind: TokenKind::Number,
                value: content[start.byte..cursor.byte].to_string(),
                start: start.utf16,
                end: cursor.utf16,
                start_byte: start.byte,
                end_byte: cursor.byte,
            });
            continue;
        }

        let start = cursor;
        advance_char(content, &mut cursor);
        tokens.push(LuauToken {
            kind: TokenKind::Symbol,
            value: content[start.byte..cursor.byte].to_string(),
            start: start.utf16,
            end: cursor.utf16,
            start_byte: start.byte,
            end_byte: cursor.byte,
        });
    }

    tokens
}

fn current_char(content: &str, byte_index: usize) -> Option<char> {
    content.get(byte_index..)?.chars().next()
}

fn next_char(content: &str, byte_index: usize) -> Option<char> {
    let current = current_char(content, byte_index)?;
    let next_byte = byte_index + current.len_utf8();

    current_char(content, next_byte)
}

fn advance_char(content: &str, cursor: &mut CursorPosition) {
    let value = current_char(content, cursor.byte).expect("cursor remains in bounds");
    cursor.byte += value.len_utf8();
    cursor.utf16 += value.len_utf16();
}

fn advance_bytes(cursor: &mut CursorPosition, length: usize) {
    cursor.byte += length;
    cursor.utf16 += length;
}

fn push_newline_token(tokens: &mut Vec<LuauToken>, cursor: &CursorPosition) {
    tokens.push(LuauToken {
        kind: TokenKind::Newline,
        value: "\n".to_string(),
        start: cursor.utf16,
        end: cursor.utf16 + 1,
        start_byte: cursor.byte,
        end_byte: cursor.byte + 1,
    });
}

fn is_identifier_start(character: char) -> bool {
    character.is_ascii_alphabetic() || character == '_'
}

fn is_identifier_part(character: char) -> bool {
    character.is_ascii_alphanumeric() || character == '_'
}

fn is_number_part(character: char) -> bool {
    character.is_ascii_hexdigit() || matches!(character, '_' | 'x' | 'X' | '.')
}

fn match_long_bracket(content: &str) -> Option<(String, usize)> {
    let mut chars = content.chars();

    if chars.next()? != '[' {
        return None;
    }

    let mut equals_count = 0usize;

    for character in chars {
        if character == '=' {
            equals_count += 1;
            continue;
        }

        if character == '[' {
            let delimiter = format!("]{}]", "=".repeat(equals_count));
            return Some((delimiter, equals_count + 2));
        }

        return None;
    }

    None
}

fn normalize_whitespace(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn hash_set<const N: usize>(values: [&'static str; N]) -> HashSet<&'static str> {
    values.into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scan(content: &str, mode: LuauScanMode) -> LuauFileAnalysis {
        scan_luau_file_analysis(content, mode)
    }

    fn find_symbol<'analysis>(
        analysis: &'analysis LuauFileAnalysis,
        label: &str,
    ) -> &'analysis LuauFileSymbol {
        analysis
            .symbols
            .iter()
            .find(|symbol| symbol.label == label)
            .unwrap_or_else(|| panic!("missing symbol {label}"))
    }

    #[test]
    fn scans_function_signatures_and_parameters() {
        let analysis = scan(
            "local function greet(name: string, count, ...: number)\n    return name\nend\n",
            LuauScanMode::Full,
        );

        let function_symbol = find_symbol(&analysis, "greet");
        let variadic_parameter = find_symbol(&analysis, "...");

        assert_eq!(function_symbol.kind, LuauSymbolKind::Function);
        assert_eq!(function_symbol.detail, "local function");
        assert_eq!(
            function_symbol.doc.signature.as_deref(),
            Some("greet(name: string, count, ...: number)")
        );
        assert_eq!(variadic_parameter.detail, "parameter");
        assert_eq!(analysis.function_scopes.len(), 1);
    }

    #[test]
    fn scans_namespaces_and_method_self_parameters() {
        let analysis = scan(
            "function Player:attack(target)\n    return target\nend\n",
            LuauScanMode::Full,
        );

        let namespace_symbol = find_symbol(&analysis, "Player");
        let self_symbol = find_symbol(&analysis, "self");

        assert_eq!(namespace_symbol.kind, LuauSymbolKind::Namespace);
        assert_eq!(namespace_symbol.detail, "function namespace");
        assert_eq!(self_symbol.detail, "parameter");
        assert_eq!(self_symbol.visible_start, self_symbol.scope_start);
    }

    #[test]
    fn scans_locals_and_globals() {
        let analysis = scan("local foo = 1\nvalue = foo\n", LuauScanMode::Full);

        let local_symbol = find_symbol(&analysis, "foo");
        let global_symbol = find_symbol(&analysis, "value");

        assert!(local_symbol.is_lexical);
        assert!(!global_symbol.is_lexical);
        assert_eq!(global_symbol.detail, "global variable");
    }

    #[test]
    fn ignores_comment_and_string_contents() {
        let analysis = scan(
            "-- local function fake() end\nlocal text = \"function hidden() end\"\n--[=[\nfunction buried() end\n]=]\nlocal function real() end\n",
            LuauScanMode::Full,
        );

        let labels = analysis
            .symbols
            .iter()
            .map(|symbol| symbol.label.as_str())
            .collect::<Vec<_>>();

        assert!(labels.contains(&"real"));
        assert!(!labels.contains(&"fake"));
        assert!(!labels.contains(&"hidden"));
        assert!(!labels.contains(&"buried"));
    }

    #[test]
    fn ignores_long_string_contents() {
        let analysis = scan(
            "local script = [==[\nfunction fake() end\n]==]\nfunction real() end\n",
            LuauScanMode::Full,
        );

        let labels = analysis
            .symbols
            .iter()
            .map(|symbol| symbol.label.as_str())
            .collect::<Vec<_>>();

        assert!(labels.contains(&"real"));
        assert!(!labels.contains(&"fake"));
    }

    #[test]
    fn keeps_only_function_symbols_in_functions_mode() {
        let analysis = scan(
            "local function keep(alpha)\n    return alpha\nend\nlocal value = 1\ntype Alias = number\nfunction Global() end\n",
            LuauScanMode::Functions,
        );

        let labels = analysis
            .symbols
            .iter()
            .map(|symbol| symbol.label.as_str())
            .collect::<Vec<_>>();

        assert_eq!(labels, vec!["keep", "Global"]);
    }

    #[test]
    fn tracks_loop_and_repeat_scopes_without_panicking() {
        let analysis = scan(
            "for index, item in pairs(values) do\n    local inner = item\nend\nrepeat\n    local retry = true\nuntil done\n",
            LuauScanMode::Full,
        );

        let index_symbol = find_symbol(&analysis, "index");
        let retry_symbol = find_symbol(&analysis, "retry");

        assert_eq!(index_symbol.detail, "loop variable");
        assert!(retry_symbol.scope_end >= retry_symbol.scope_start);
    }
}
