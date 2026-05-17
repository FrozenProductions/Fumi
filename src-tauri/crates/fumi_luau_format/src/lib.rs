//! Internal Luau beautifier used by Fumi's Tauri backend.

#[cfg(test)]
mod tests;

use std::{collections::HashSet, fmt::Display};

use luau_lexer::prelude::{
    Comment, Keyword, Lexer, Literal, LuauString, Operator, PartialKeyword, Symbol, Token,
    TokenType, Trivia,
};
use luau_parser::prelude::{Parser, Position};
use luau_parser::types::AstStatus;
use thiserror::Error;

const DEFAULT_INDENT_WIDTH: u8 = 4;
const MAX_COMPACT_CURLY_ENTRIES: usize = 2;
const SOURCE_URI: &str = "<fumi-luau-format>";

/// Formatting configuration for Luau source.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct FormatOptions {
    /// Number of spaces per indentation level.
    pub indent_width: u8,
    /// Whether the returned source should end with a line feed.
    pub trailing_newline: bool,
}

impl Default for FormatOptions {
    fn default() -> Self {
        Self {
            indent_width: DEFAULT_INDENT_WIDTH,
            trailing_newline: true,
        }
    }
}

/// Result of formatting Luau source.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FormatResult {
    /// Formatted source text using LF line endings.
    pub formatted: String,
}

/// One-based source location attached to parse/lex errors when available.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SourceLocation {
    /// One-based line.
    pub line: u32,
    /// One-based UTF-16 column, matching `lsp_types::Position` semantics.
    pub column: u32,
}

/// Luau formatting failure.
#[derive(Clone, Debug, Error, PartialEq, Eq)]
pub enum FormatError {
    /// Source is not valid Luau.
    #[error("invalid luau at {location}: {message}")]
    Parse {
        /// Human-readable parse error.
        message: String,
        /// Best-known source location.
        location: SourceLocation,
    },
    /// Lexer found a token it could not classify.
    #[error("invalid token at {location}: {message}")]
    Lex {
        /// Human-readable lexer error.
        message: String,
        /// Best-known source location.
        location: SourceLocation,
    },
    /// Formatter options are invalid.
    #[error("invalid format options: {message}")]
    Options {
        /// Human-readable options error.
        message: String,
    },
}

impl Display for SourceLocation {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}:{}", self.line, self.column)
    }
}

/// Format valid Luau source without changing semantics.
///
/// # Errors
///
/// Returns [`FormatError`] when the source is invalid or options are outside
/// supported V1 bounds.
pub fn format_luau(source: &str, options: FormatOptions) -> Result<FormatResult, FormatError> {
    validate_options(options)?;
    validate_source(source)?;

    let normalized_source = source.replace("\r\n", "\n").replace('\r', "\n");
    let tokens = lex_tokens(&normalized_source)?;
    let formatted = Formatter::new(options, compact_curly_token_indices(&tokens)).format(&tokens);

    Ok(FormatResult { formatted })
}

fn validate_options(options: FormatOptions) -> Result<(), FormatError> {
    if options.indent_width == 0 {
        return Err(FormatError::Options {
            message: "indent width must be greater than zero".to_string(),
        });
    }

    if options.indent_width > 8 {
        return Err(FormatError::Options {
            message: "indent width must be at most eight".to_string(),
        });
    }

    Ok(())
}

fn validate_source(source: &str) -> Result<(), FormatError> {
    let normalized_source = source.replace("\r\n", "\n").replace('\r', "\n");
    let parser_source = mask_comments_for_parser(&normalized_source);
    let mut parser = Parser::new(&parser_source);
    let cst = parser.parse(SOURCE_URI);

    if cst.status == AstStatus::Complete
        || cst.errors.iter().all(|error| {
            is_ignorable_parser_eof_error(error.message(), error.start(), &parser_source)
        })
    {
        return Ok(());
    }

    let Some(error) = cst.errors.first() else {
        return Err(FormatError::Parse {
            message: "source contains syntax errors".to_string(),
            location: SourceLocation { line: 1, column: 1 },
        });
    };

    Err(FormatError::Parse {
        message: error.message().to_string(),
        location: SourceLocation {
            line: error.start().line + 1,
            column: error.start().character + 1,
        },
    })
}

fn lex_tokens(source: &str) -> Result<Vec<Token>, FormatError> {
    let mut lexer = Lexer::new(source);
    let mut tokens = Vec::new();

    loop {
        let token = lexer.next_token();
        if let TokenType::Error(error) = &token.token_type {
            return Err(FormatError::Lex {
                message: error.message().to_string(),
                location: SourceLocation {
                    line: error.start().line + 1,
                    column: error.start().character + 1,
                },
            });
        }

        let is_end = token.token_type == TokenType::EndOfFile;
        tokens.push(token);

        if is_end {
            return Ok(tokens);
        }
    }
}

fn is_ignorable_parser_eof_error(message: &str, position: Position, source: &str) -> bool {
    message == "Statements after a termination statement are not allowed."
        && source
            .get(position_to_byte_index(source, position)..)
            .map(str::trim)
            .is_some_and(str::is_empty)
}

fn position_to_byte_index(source: &str, position: Position) -> usize {
    let mut line = 0;
    let mut character = 0;

    for (index, value) in source.char_indices() {
        if line == position.line && character == position.character {
            return index;
        }

        if value == '\n' {
            line += 1;
            character = 0;
        } else {
            character += 1;
        }
    }

    source.len()
}

fn mask_comments_for_parser(source: &str) -> String {
    let mut lexer = Lexer::new(source);
    let mut masked = source.to_string();

    loop {
        let token = lexer.next_token();
        mask_comments_in_trivia(&mut masked, &token.leading_trivia);
        mask_comments_in_trivia(&mut masked, &token.trailing_trivia);

        if let TokenType::Comment(comment) = &token.token_type {
            mask_comment_text(&mut masked, comment);
        }

        if token.token_type == TokenType::EndOfFile {
            return masked;
        }
    }
}

fn mask_comments_in_trivia(source: &mut String, trivia: &[Trivia]) {
    for item in trivia {
        if let Trivia::Comment(comment) = item {
            mask_comment_text(source, comment);
        }
    }
}

fn mask_comment_text(source: &mut String, comment: &Comment) {
    let text = comment_text(comment);
    let Some(start) = source.find(&text) else {
        return;
    };
    let mask = text
        .chars()
        .map(|character| if character == '\n' { '\n' } else { ' ' })
        .collect::<String>();
    source.replace_range(start..start + text.len(), &mask);
}

fn compact_curly_token_indices(tokens: &[Token]) -> HashSet<usize> {
    let mut stack = Vec::new();
    let mut compact_tokens = HashSet::new();

    for (index, token) in tokens.iter().enumerate() {
        match token.token_type {
            TokenType::Symbol(Symbol::OpeningCurlyBrackets) => stack.push(index),
            TokenType::Symbol(Symbol::ClosingCurlyBrackets) => {
                let Some(start) = stack.pop() else {
                    continue;
                };

                if is_compact_curly_range(tokens, start, index) {
                    compact_tokens.insert(start);
                }
            }
            _ => {}
        }
    }

    compact_tokens
}

fn is_compact_curly_range(tokens: &[Token], start: usize, end: usize) -> bool {
    if end <= start + 1 {
        return true;
    }

    let mut paren_depth = 0_usize;
    let mut bracket_depth = 0_usize;
    let mut curly_depth = 0_usize;
    let mut angle_depth = 0_usize;
    let mut separators = 0_usize;
    let mut has_value = false;

    for token in &tokens[start + 1..end] {
        if token_has_comment(token) || token_has_newline(token) {
            return false;
        }

        match token.token_type {
            TokenType::Symbol(Symbol::OpeningParenthesis) => paren_depth += 1,
            TokenType::Symbol(Symbol::ClosingParenthesis) => {
                paren_depth = paren_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::OpeningBrackets) => bracket_depth += 1,
            TokenType::Symbol(Symbol::ClosingBrackets) => {
                bracket_depth = bracket_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::OpeningCurlyBrackets) => curly_depth += 1,
            TokenType::Symbol(Symbol::ClosingCurlyBrackets) => {
                curly_depth = curly_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::OpeningAngleBrackets) => angle_depth += 1,
            TokenType::Symbol(Symbol::ClosingAngleBrackets) => {
                angle_depth = angle_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::Comma | Symbol::Semicolon)
                if paren_depth == 0
                    && bracket_depth == 0
                    && curly_depth == 0
                    && angle_depth == 0 =>
            {
                separators += 1;
            }
            TokenType::EndOfFile => {}
            _ => has_value = true,
        }
    }

    has_value && separators < MAX_COMPACT_CURLY_ENTRIES
}

fn token_has_comment(token: &Token) -> bool {
    token
        .leading_trivia
        .iter()
        .chain(token.trailing_trivia.iter())
        .any(|trivia| matches!(trivia, Trivia::Comment(_)))
}

fn token_has_newline(token: &Token) -> bool {
    token
        .leading_trivia
        .iter()
        .chain(token.trailing_trivia.iter())
        .any(|trivia| matches!(trivia, Trivia::Spaces(spaces) if newline_count(spaces) > 0))
        || token.start.line != token.end.line
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum PendingBlock {
    Function {
        paren_depth: usize,
        has_params: bool,
        is_waiting_for_body: bool,
        return_type_start: Option<TypeDepth>,
    },
}

#[derive(Debug)]
struct Formatter {
    options: FormatOptions,
    compact_curly_tokens: HashSet<usize>,
    output: String,
    indent_level: usize,
    paren_depth: usize,
    bracket_depth: usize,
    curly_depth: usize,
    angle_depth: usize,
    curly_stack: Vec<bool>,
    is_line_start: bool,
    previous_token: Option<TokenType>,
    pending_block: Option<PendingBlock>,
    last_comment_text: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct TypeDepth {
    paren: usize,
    bracket: usize,
    curly: usize,
    angle: usize,
}

impl Formatter {
    fn new(options: FormatOptions, compact_curly_tokens: HashSet<usize>) -> Self {
        Self {
            options,
            compact_curly_tokens,
            output: String::new(),
            indent_level: 0,
            paren_depth: 0,
            bracket_depth: 0,
            curly_depth: 0,
            angle_depth: 0,
            curly_stack: Vec::new(),
            is_line_start: true,
            previous_token: None,
            pending_block: None,
            last_comment_text: None,
        }
    }

    fn format(mut self, tokens: &[Token]) -> String {
        for (index, token) in tokens.iter().enumerate() {
            if token.token_type == TokenType::EndOfFile {
                self.write_trivia(&token.leading_trivia);
                break;
            }

            self.write_trivia(&token.leading_trivia);
            self.write_token(
                index,
                token,
                tokens.get(index + 1).map(|next| &next.token_type),
                tokens.get(index + 2).map(|next| &next.token_type),
            );
            self.write_trivia(&token.trailing_trivia);
        }

        self.finish()
    }

    fn write_token(
        &mut self,
        index: usize,
        token: &Token,
        next_token: Option<&TokenType>,
        next_next_token: Option<&TokenType>,
    ) {
        if self.should_start_pending_function_body_before(&token.token_type) {
            self.start_pending_function_body();
        }

        if self.should_insert_trailing_comma_before(&token.token_type) {
            self.output.push(',');
        }

        if self.should_space_before_compact_curly_close(&token.token_type) {
            self.space();
        }

        if self.should_dedent_before(&token.token_type) {
            self.dedent();
        }

        if self.should_start_line_before(&token.token_type) && !self.is_line_start {
            self.newline();
        }

        if self.needs_space_before(&token.token_type, next_token) {
            self.space();
        }

        self.write_indent_if_needed();

        if let Some(text) = self.token_text(index, &token.token_type) {
            self.output.push_str(text.as_str());
        }
        self.last_comment_text = None;

        self.update_depth_after_write(index, &token.token_type);
        self.update_pending_block(&token.token_type, next_token);

        if self.should_newline_after(&token.token_type, next_token) {
            self.newline();
        } else if self.should_space_after(&token.token_type, next_token, next_next_token) {
            self.space();
        }

        self.previous_token = Some(token.token_type.clone());
    }

    fn write_trivia(&mut self, trivia: &[Trivia]) {
        for item in trivia {
            match item {
                Trivia::Spaces(spaces) => {
                    let lines = newline_count(spaces);
                    if lines > 1 {
                        self.blank_line();
                    } else if lines == 1 {
                        self.newline();
                    }
                }
                Trivia::Comment(comment) => self.write_comment(comment),
            }
        }
    }

    fn write_comment(&mut self, comment: &Comment) {
        let text = comment_text(comment);
        if self.last_comment_text.as_deref() == Some(text.as_str()) {
            return;
        }

        if !self.is_line_start && self.can_write_trailing_comment(&text) {
            self.space();
            self.output.push_str(&text);
            self.last_comment_text = Some(text);
            self.newline();
            return;
        }

        if !self.is_line_start {
            self.newline();
        }

        self.write_indent_if_needed();
        self.output.push_str(&text);
        self.last_comment_text = Some(text);
        self.newline();
    }

    fn can_write_trailing_comment(&self, text: &str) -> bool {
        !text.contains('\n') && self.previous_token.is_some()
    }

    fn update_depth_after_write(&mut self, index: usize, token_type: &TokenType) {
        match token_type {
            TokenType::Symbol(Symbol::OpeningParenthesis) => {
                self.paren_depth += 1;
            }
            TokenType::Symbol(Symbol::ClosingParenthesis) => {
                self.paren_depth = self.paren_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::OpeningBrackets) => {
                self.bracket_depth += 1;
            }
            TokenType::Symbol(Symbol::ClosingBrackets) => {
                self.bracket_depth = self.bracket_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::OpeningCurlyBrackets) => {
                let is_compact = self.compact_curly_tokens.contains(&index);
                self.curly_stack.push(is_compact);
                self.curly_depth += 1;
                if !is_compact {
                    self.indent();
                }
            }
            TokenType::Symbol(Symbol::ClosingCurlyBrackets) => {
                self.curly_stack.pop();
                self.curly_depth = self.curly_depth.saturating_sub(1);
            }
            TokenType::Symbol(Symbol::OpeningAngleBrackets) => {
                self.angle_depth += 1;
            }
            TokenType::Symbol(Symbol::ClosingAngleBrackets) => {
                self.angle_depth = self.angle_depth.saturating_sub(1);
            }
            _ => {}
        }
    }

    fn token_text(&self, index: usize, token_type: &TokenType) -> Option<String> {
        if matches!(token_type, TokenType::Symbol(Symbol::Semicolon)) && self.curly_depth > 0 {
            return Some(",".to_string());
        }

        if matches!(token_type, TokenType::Symbol(Symbol::Semicolon)) {
            return None;
        }

        if matches!(token_type, TokenType::Symbol(Symbol::OpeningCurlyBrackets))
            && self.compact_curly_tokens.contains(&index)
        {
            return Some("{".to_string());
        }

        token_type.try_as_string()
    }

    fn update_pending_block(&mut self, token_type: &TokenType, next_token: Option<&TokenType>) {
        match token_type {
            TokenType::Keyword(Keyword::Function) => {
                self.pending_block = Some(PendingBlock::Function {
                    paren_depth: self.paren_depth,
                    has_params: false,
                    is_waiting_for_body: false,
                    return_type_start: None,
                });
            }
            TokenType::Symbol(Symbol::OpeningParenthesis) => {
                if let Some(PendingBlock::Function {
                    paren_depth,
                    has_params,
                    ..
                }) = self.pending_block.as_mut()
                {
                    if !*has_params {
                        *paren_depth = self.paren_depth;
                        *has_params = true;
                    }
                }
            }
            TokenType::Symbol(Symbol::ClosingParenthesis) => {
                if matches!(
                    self.pending_block,
                    Some(PendingBlock::Function {
                        paren_depth,
                        has_params: true,
                        is_waiting_for_body: false,
                        ..
                    }) if paren_depth == self.paren_depth + 1
                ) {
                    if matches!(next_token, Some(TokenType::Symbol(Symbol::Colon))) {
                        self.mark_pending_function_return_type();
                    } else {
                        self.start_pending_function_body();
                    }
                }
            }
            TokenType::Symbol(Symbol::Colon) => {
                if let Some(PendingBlock::Function {
                    is_waiting_for_body,
                    return_type_start,
                    ..
                }) = self.pending_block.as_mut()
                {
                    if *is_waiting_for_body && return_type_start.is_none() {
                        *return_type_start = Some(TypeDepth {
                            paren: self.paren_depth,
                            bracket: self.bracket_depth,
                            curly: self.curly_depth,
                            angle: self.angle_depth,
                        });
                    }
                }
            }
            _ => {}
        }
    }

    fn mark_pending_function_return_type(&mut self) {
        if let Some(PendingBlock::Function {
            is_waiting_for_body,
            return_type_start,
            ..
        }) = self.pending_block.as_mut()
        {
            *is_waiting_for_body = true;
            *return_type_start = None;
        }
    }

    fn should_start_pending_function_body_before(&self, token_type: &TokenType) -> bool {
        let Some(PendingBlock::Function {
            is_waiting_for_body: true,
            return_type_start: Some(start),
            ..
        }) = self.pending_block
        else {
            return false;
        };

        if self.type_depth() != start {
            return false;
        }

        self.previous_token
            .as_ref()
            .is_some_and(can_end_type_annotation)
            && starts_statement_after_type(token_type)
    }

    fn start_pending_function_body(&mut self) {
        if self.pending_block.is_none() {
            return;
        }

        self.pending_block = None;
        self.newline();
        self.indent();
    }

    fn type_depth(&self) -> TypeDepth {
        TypeDepth {
            paren: self.paren_depth,
            bracket: self.bracket_depth,
            curly: self.curly_depth,
            angle: self.angle_depth,
        }
    }

    fn should_insert_trailing_comma_before(&self, token_type: &TokenType) -> bool {
        if !matches!(token_type, TokenType::Symbol(Symbol::ClosingCurlyBrackets)) {
            return false;
        }

        if self.is_in_compact_curly() {
            return false;
        }

        if self.is_line_start || self.output.ends_with('\n') {
            return false;
        }

        !matches!(
            self.previous_token,
            None | Some(TokenType::Symbol(
                Symbol::OpeningCurlyBrackets | Symbol::Comma
            ))
        )
    }

    fn should_space_before_compact_curly_close(&self, token_type: &TokenType) -> bool {
        matches!(token_type, TokenType::Symbol(Symbol::ClosingCurlyBrackets))
            && self.is_in_compact_curly()
            && !matches!(
                self.previous_token,
                None | Some(TokenType::Symbol(Symbol::OpeningCurlyBrackets))
            )
    }

    fn should_dedent_before(&self, token_type: &TokenType) -> bool {
        if matches!(token_type, TokenType::Symbol(Symbol::ClosingCurlyBrackets))
            && self.is_in_compact_curly()
        {
            return false;
        }

        matches!(
            token_type,
            TokenType::Keyword(Keyword::End)
                | TokenType::Keyword(Keyword::Else)
                | TokenType::Keyword(Keyword::Elseif)
                | TokenType::Keyword(Keyword::Until)
                | TokenType::Symbol(Symbol::ClosingCurlyBrackets)
        )
    }

    fn should_start_line_before(&self, token_type: &TokenType) -> bool {
        if matches!(token_type, TokenType::Symbol(Symbol::ClosingCurlyBrackets))
            && self.is_in_compact_curly()
        {
            return false;
        }

        matches!(
            token_type,
            TokenType::Keyword(Keyword::End)
                | TokenType::Keyword(Keyword::Else)
                | TokenType::Keyword(Keyword::Elseif)
                | TokenType::Keyword(Keyword::Until)
                | TokenType::Symbol(Symbol::ClosingCurlyBrackets)
        )
    }

    fn should_newline_after(
        &mut self,
        token_type: &TokenType,
        next_token: Option<&TokenType>,
    ) -> bool {
        match token_type {
            TokenType::Keyword(Keyword::Then)
            | TokenType::Keyword(Keyword::Do)
            | TokenType::Keyword(Keyword::Repeat)
            | TokenType::Keyword(Keyword::Else) => {
                self.indent();
                true
            }
            TokenType::Keyword(Keyword::End) => !matches!(
                next_token,
                Some(TokenType::Symbol(
                    Symbol::ClosingParenthesis | Symbol::ClosingCurlyBrackets
                )) | Some(TokenType::Symbol(Symbol::Comma))
            ),
            TokenType::Keyword(Keyword::Return)
            | TokenType::Keyword(Keyword::Break)
            | TokenType::PartialKeyword(PartialKeyword::Continue) => next_token
                .map(|next| starts_new_statement(next) || is_block_end(next))
                .unwrap_or(true),
            TokenType::Symbol(Symbol::Semicolon) => !self.is_in_compact_curly(),
            TokenType::Symbol(Symbol::OpeningCurlyBrackets) => {
                !self.is_in_compact_curly()
                    && !matches!(
                        next_token,
                        Some(TokenType::Symbol(Symbol::ClosingCurlyBrackets))
                    )
            }
            TokenType::Symbol(Symbol::Comma) => self.curly_depth > 0 && !self.is_in_compact_curly(),
            _ => false,
        }
    }

    fn should_space_after(
        &self,
        token_type: &TokenType,
        next_token: Option<&TokenType>,
        next_next_token: Option<&TokenType>,
    ) -> bool {
        let Some(next) = next_token else {
            return false;
        };

        if matches!(next, TokenType::EndOfFile) {
            return false;
        }

        match token_type {
            TokenType::Keyword(Keyword::Local | Keyword::If | Keyword::While | Keyword::For) => {
                true
            }
            TokenType::Keyword(Keyword::Return) => !is_block_end(next),
            TokenType::Keyword(Keyword::Function) => !matches!(
                next,
                TokenType::Symbol(Symbol::OpeningParenthesis | Symbol::OpeningAngleBrackets)
            ),
            TokenType::Keyword(Keyword::Until) => true,
            TokenType::PartialKeyword(PartialKeyword::Type | PartialKeyword::Export) => true,
            TokenType::Operator(Operator::Not) => true,
            TokenType::Operator(operator) => is_spaced_operator(*operator),
            TokenType::CompoundOperator(_) => true,
            TokenType::Symbol(Symbol::Equal | Symbol::Arrow | Symbol::Typecast) => true,
            TokenType::Symbol(Symbol::Comma | Symbol::Semicolon) => {
                self.curly_depth == 0 || self.is_in_compact_curly()
            }
            TokenType::Symbol(Symbol::OpeningCurlyBrackets) => {
                self.is_in_compact_curly()
                    && !matches!(next, TokenType::Symbol(Symbol::ClosingCurlyBrackets))
            }
            TokenType::Symbol(Symbol::Colon) => {
                is_type_colon(self.previous_token.as_ref(), next, next_next_token)
            }
            _ => false,
        }
    }

    fn needs_space_before(&self, token_type: &TokenType, next_token: Option<&TokenType>) -> bool {
        let Some(previous) = self.previous_token.as_ref() else {
            return false;
        };

        if self.is_line_start {
            return false;
        }

        if never_space_before(token_type) || never_space_after(previous) {
            return false;
        }

        if is_spaced_pair(previous, token_type, next_token) {
            return true;
        }

        adjacent_words(previous, token_type)
    }

    fn write_indent_if_needed(&mut self) {
        if !self.is_line_start {
            return;
        }

        for _ in 0..self.indent_level * usize::from(self.options.indent_width) {
            self.output.push(' ');
        }
        self.is_line_start = false;
    }

    fn space(&mut self) {
        if self.is_line_start || self.output.ends_with([' ', '\n']) {
            return;
        }

        self.output.push(' ');
    }

    fn newline(&mut self) {
        trim_trailing_spaces(&mut self.output);
        if !self.output.ends_with('\n') {
            self.output.push('\n');
        }
        self.is_line_start = true;
    }

    fn blank_line(&mut self) {
        trim_trailing_spaces(&mut self.output);
        if self.output.is_empty() {
            return;
        }
        if !self.output.ends_with("\n\n") {
            self.output.push('\n');
            self.output.push('\n');
        }
        self.is_line_start = true;
    }

    fn indent(&mut self) {
        self.indent_level += 1;
    }

    fn dedent(&mut self) {
        self.indent_level = self.indent_level.saturating_sub(1);
    }

    fn is_in_compact_curly(&self) -> bool {
        self.curly_stack.last().copied().unwrap_or(false)
    }

    fn finish(mut self) -> String {
        trim_trailing_spaces(&mut self.output);
        while self.output.ends_with("\n\n") {
            self.output.pop();
        }

        if self.options.trailing_newline {
            if !self.output.ends_with('\n') {
                self.output.push('\n');
            }
        } else {
            while self.output.ends_with('\n') {
                self.output.pop();
            }
        }

        self.output
    }
}

fn newline_count(text: &str) -> usize {
    text.bytes().filter(|byte| *byte == b'\n').count()
}

fn trim_trailing_spaces(output: &mut String) {
    while output.ends_with(' ') || output.ends_with('\t') {
        output.pop();
    }
}

fn comment_text(comment: &Comment) -> String {
    match comment {
        Comment::MultiLine(text) | Comment::SingleLine(text) => text.to_string(),
    }
}

fn starts_new_statement(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Keyword(
            Keyword::Local
                | Keyword::Function
                | Keyword::If
                | Keyword::While
                | Keyword::For
                | Keyword::Repeat
                | Keyword::Return
                | Keyword::Break
        ) | TokenType::PartialKeyword(PartialKeyword::Continue | PartialKeyword::Export)
    )
}

fn is_block_end(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Keyword(Keyword::End | Keyword::Else | Keyword::Elseif | Keyword::Until)
            | TokenType::EndOfFile
    )
}

fn is_spaced_operator(operator: Operator) -> bool {
    !matches!(
        operator,
        Operator::Length | Operator::Optional | Operator::Not
    )
}

fn never_space_before(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Symbol(
            Symbol::Comma
                | Symbol::Semicolon
                | Symbol::ClosingParenthesis
                | Symbol::ClosingBrackets
                | Symbol::ClosingCurlyBrackets
                | Symbol::Dot
                | Symbol::Colon
                | Symbol::Ellipses
        ) | TokenType::Operator(Operator::Optional)
    )
}

fn never_space_after(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Symbol(Symbol::OpeningParenthesis | Symbol::OpeningBrackets | Symbol::Dot)
    )
}

fn is_spaced_pair(previous: &TokenType, current: &TokenType, next: Option<&TokenType>) -> bool {
    matches!(
        previous,
        TokenType::Operator(operator) if is_spaced_operator(*operator)
    ) || matches!(previous, TokenType::CompoundOperator(_))
        || matches!(previous, TokenType::Symbol(Symbol::Equal | Symbol::Arrow))
        || is_comparison_angle(previous, current, next)
        || is_block_clause_pair(previous, current)
        || matches!(current, TokenType::Operator(operator) if is_spaced_operator(*operator))
        || matches!(current, TokenType::CompoundOperator(_))
        || matches!(
            current,
            TokenType::Symbol(Symbol::Equal | Symbol::Arrow | Symbol::Typecast)
        )
}

fn is_comparison_angle(
    previous: &TokenType,
    current: &TokenType,
    next: Option<&TokenType>,
) -> bool {
    match (previous, current) {
        (left, TokenType::Symbol(Symbol::OpeningAngleBrackets)) => is_runtime_value(left),
        (TokenType::Symbol(Symbol::OpeningAngleBrackets), right) => is_runtime_value(right),
        (left, TokenType::Symbol(Symbol::ClosingAngleBrackets)) => {
            is_runtime_value(left) || next.is_some_and(is_runtime_value)
        }
        (TokenType::Symbol(Symbol::ClosingAngleBrackets), right) => is_runtime_value(right),
        _ => false,
    }
}

fn is_runtime_value(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Literal(Literal::Number(_) | Literal::Boolean(_))
            | TokenType::Symbol(Symbol::ClosingParenthesis | Symbol::ClosingBrackets)
    )
}

fn is_block_clause_pair(previous: &TokenType, current: &TokenType) -> bool {
    matches!(
        (previous, current),
        (
            TokenType::Identifier(_)
                | TokenType::Literal(_)
                | TokenType::Symbol(Symbol::ClosingParenthesis | Symbol::ClosingBrackets),
            TokenType::Keyword(Keyword::Then | Keyword::Do)
        )
    )
}

fn adjacent_words(previous: &TokenType, current: &TokenType) -> bool {
    is_word_like(previous) && is_word_like(current)
}

fn is_word_like(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Identifier(_)
            | TokenType::Keyword(_)
            | TokenType::PartialKeyword(_)
            | TokenType::Literal(Literal::Number(_))
            | TokenType::Literal(Literal::Boolean(_))
            | TokenType::Literal(Literal::String(LuauString::Backticks(_)))
    )
}

fn can_end_type_annotation(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Identifier(_)
            | TokenType::Keyword(Keyword::Nil)
            | TokenType::PartialKeyword(PartialKeyword::TypeOf)
            | TokenType::Literal(Literal::String(_) | Literal::Boolean(_))
            | TokenType::Operator(Operator::Optional)
            | TokenType::Symbol(
                Symbol::ClosingParenthesis
                    | Symbol::ClosingBrackets
                    | Symbol::ClosingCurlyBrackets
                    | Symbol::ClosingAngleBrackets
            )
    )
}

fn starts_statement_after_type(token_type: &TokenType) -> bool {
    matches!(
        token_type,
        TokenType::Identifier(_)
            | TokenType::Keyword(
                Keyword::Local
                    | Keyword::Function
                    | Keyword::If
                    | Keyword::While
                    | Keyword::For
                    | Keyword::Repeat
                    | Keyword::Return
                    | Keyword::Break
            )
            | TokenType::PartialKeyword(
                PartialKeyword::Type | PartialKeyword::Export | PartialKeyword::Continue
            )
    )
}

fn is_type_colon(
    previous: Option<&TokenType>,
    next: &TokenType,
    next_next: Option<&TokenType>,
) -> bool {
    matches!(
        previous,
        Some(TokenType::Identifier(_))
            | Some(TokenType::Symbol(
                Symbol::ClosingParenthesis | Symbol::ClosingBrackets
            ))
    ) && matches!(
        next,
        TokenType::Identifier(_)
            | TokenType::Keyword(_)
            | TokenType::PartialKeyword(_)
            | TokenType::Symbol(Symbol::OpeningCurlyBrackets | Symbol::OpeningParenthesis)
    ) && !matches!(
        next_next,
        Some(TokenType::Symbol(Symbol::OpeningParenthesis))
    )
}
