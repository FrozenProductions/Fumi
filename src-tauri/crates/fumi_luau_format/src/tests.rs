use super::{format_luau, FormatError, FormatOptions};

fn format(source: &str) -> String {
    format_luau(source, FormatOptions::default())
        .expect("source should format")
        .formatted
}

#[test]
fn formats_basic_control_flow() {
    let source = "local x=1\nif x>0 then print(x) else print(0) end";
    let expected = "local x = 1\nif x > 0 then\n    print(x)\nelse\n    print(0)\nend\n";

    assert_eq!(format(source), expected);
}

#[test]
fn preserves_line_comments() {
    let source = "-- lead\nlocal x=1 -- tail\nreturn x";
    let expected = "-- lead\nlocal x = 1 -- tail\nreturn x\n";

    assert_eq!(format(source), expected);
}

#[test]
fn preserves_block_comments() {
    let source = "local x=1\n--[[block\ncomment]]\nreturn x";
    let expected = "local x = 1\n--[[block\ncomment]]\nreturn x\n";

    assert_eq!(format(source), expected);
}

#[test]
fn formats_nested_functions() {
    let source = "local function outer(a)local function inner(b)return a+b end return inner(2) end";
    let expected = "local function outer(a)\n    local function inner(b)\n        return a + b\n    end\n    return inner(2)\nend\n";

    assert_eq!(format(source), expected);
}

#[test]
fn formats_tables() {
    let source = "local t={foo=1,bar={2,3},[\"x\"]=true}";
    let expected = "local t = {\n    foo = 1,\n    bar = { 2, 3 },\n    [\"x\"] = true,\n}\n";

    assert_eq!(format(source), expected);
}

#[test]
fn formats_type_annotations() {
    let source = "type Pair<T> ={left:T,right:T}\nlocal x:number=1";
    let expected = "type Pair<T> = { left: T, right: T }\nlocal x: number = 1\n";

    assert_eq!(format(source), expected);
}

#[test]
fn formats_compound_assignment_and_continue() {
    let source = "for i=1,10 do if i%2==0 then continue end total+=i end";
    let expected =
        "for i = 1, 10 do\n    if i % 2 == 0 then\n        continue\n    end\n    total += i\nend\n";

    assert_eq!(format(source), expected);
}

#[test]
fn preserves_strings_and_long_strings() {
    let source = "local a='x'\nlocal b=[[hello\nworld]]";
    let expected = "local a = 'x'\nlocal b = [[hello\nworld]]\n";

    assert_eq!(format(source), expected);
}

#[test]
fn rejects_malformed_input() {
    let error =
        format_luau("if then", FormatOptions::default()).expect_err("invalid source should fail");

    assert!(matches!(error, FormatError::Parse { .. }));
}

#[test]
fn formatting_is_idempotent() {
    let source = "local function add(a, b)\n    return a + b\nend\n";

    assert_eq!(format(&format(source)), source);
}

#[test]
fn supports_no_trailing_newline() {
    let result = format_luau(
        "local x=1",
        FormatOptions {
            trailing_newline: false,
            ..FormatOptions::default()
        },
    )
    .expect("source should format");

    assert_eq!(result.formatted, "local x = 1");
}

#[test]
fn formats_typed_function_return_annotations() {
    let source = "local function find<T>(items:{T},predicate:(T)->boolean):T? for _,item in items do if predicate(item)then return item end end return nil end";
    let expected = "local function find<T>(items: { T }, predicate: (T) -> boolean): T?\n    for _, item in items do\n        if predicate(item) then\n            return item\n        end\n    end\n    return nil\nend\n";

    assert_eq!(format(source), expected);
}

#[test]
fn formats_type_casts_unions_and_intersections() {
    let source = "type Handler=(number|string)&((boolean)->nil)\nlocal value=payload::Handler";
    let expected =
        "type Handler = (number | string) & ((boolean) -> nil)\nlocal value = payload :: Handler\n";

    assert_eq!(format(source), expected);
}

#[test]
fn keeps_complex_tables_expanded_and_adds_trailing_commas() {
    let source =
        "local config={name=\"alpha\",flags={\"a\",\"b\"},limits={min=1,max=10},enabled=true}";
    let expected = "local config = {\n    name = \"alpha\",\n    flags = { \"a\", \"b\" },\n    limits = { min = 1, max = 10 },\n    enabled = true,\n}\n";

    assert_eq!(format(source), expected);
}

#[test]
fn removes_statement_semicolons() {
    let source = "local first=1;local second=2;return first+second";
    let expected = "local first = 1\nlocal second = 2\nreturn first + second\n";

    assert_eq!(format(source), expected);
}
