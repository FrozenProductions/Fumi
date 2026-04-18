use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LuauFileAnalysis {
    pub(crate) function_scopes: Vec<ScopeFrame>,
    pub(crate) symbols: Vec<LuauFileSymbol>,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ScopeFrame {
    pub(crate) start: usize,
    pub(crate) end: usize,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LuauFileSymbol {
    pub(crate) label: String,
    pub(crate) kind: LuauSymbolKind,
    pub(crate) detail: String,
    pub(crate) declaration_start: usize,
    pub(crate) declaration_end: usize,
    pub(crate) is_lexical: bool,
    pub(crate) owner_function_end: Option<usize>,
    pub(crate) owner_function_start: Option<usize>,
    pub(crate) scope_start: usize,
    pub(crate) scope_end: usize,
    pub(crate) visible_start: usize,
    pub(crate) visible_end: usize,
    pub(crate) doc: LuauDocEntry,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) insert_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) score: Option<u32>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LuauDocEntry {
    pub(crate) summary: String,
    pub(crate) source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) signature: Option<String>,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum LuauScanMode {
    #[default]
    Full,
    Functions,
}

#[allow(dead_code)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum LuauSymbolKind {
    Comment,
    Constant,
    Datatype,
    Enum,
    Function,
    Keyword,
    Library,
    Namespace,
    Service,
}
