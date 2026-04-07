#![allow(dead_code)]

use std::{
    fmt::Write as _,
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{anyhow, bail, Context, Result};

const FILE_MAGIC: &[u8; 4] = b"cook";
const PAGE_MAGIC: u32 = 0x0000_0100;
const FILE_FOOTER: u64 = 0x0717_2005_0000_004B;
const COOKIE_HEADER_LEN: usize = 56;
const ROBLOX_DOMAIN: &[u8] = b".roblox.com";
const ROBLOX_PATH: &[u8] = b"/";
const ROBLOSECURITY_COOKIE_NAME: &[u8] = b".ROBLOSECURITY";
const ROBLOXCOOKIES_COOKIE_NAME: &[u8] = b".ROBLOXSECURITY";
const MAC_EPOCH_OFFSET_SECS: f64 = 978_307_200.0;
const ROBLOX_COOKIE_LIFETIME_SECS: u64 = 60 * 60 * 24 * 30;

#[derive(Debug, Clone, PartialEq)]
struct BinaryCookiesFile {
    pages: Vec<CookiePage>,
    checksum: u32,
    footer: u64,
    metadata: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq)]
struct CookiePage {
    cookies: Vec<BinaryCookie>,
}

#[derive(Debug, Clone, PartialEq)]
struct BinaryCookie {
    unknown_a: u32,
    raw_flags: u32,
    unknown_b: u32,
    comment: Option<Vec<u8>>,
    domain: Vec<u8>,
    name: Vec<u8>,
    path: Vec<u8>,
    value: Vec<u8>,
    expires_mac_epoch: f64,
    created_mac_epoch: f64,
    trailing_data: Vec<u8>,
}

impl BinaryCookie {
    fn is_secure(&self) -> bool {
        self.raw_flags & 0x1 != 0
    }

    fn is_http_only(&self) -> bool {
        self.raw_flags & 0x4 != 0
    }

    fn encode(&self) -> Result<Vec<u8>> {
        let mut payload = vec![0; COOKIE_HEADER_LEN];

        let comment_offset = if let Some(comment) = &self.comment {
            append_c_string(&mut payload, comment)?
        } else {
            0
        };

        let domain_offset = append_c_string(&mut payload, &self.domain)?;
        let name_offset = append_c_string(&mut payload, &self.name)?;
        let path_offset = append_c_string(&mut payload, &self.path)?;
        let value_offset = append_c_string(&mut payload, &self.value)?;

        payload.extend_from_slice(&self.trailing_data);

        let cookie_size = u32::try_from(payload.len()).context("cookie is larger than u32")?;

        write_u32_le(&mut payload, 0, cookie_size);
        write_u32_le(&mut payload, 4, self.unknown_a);
        write_u32_le(&mut payload, 8, self.raw_flags);
        write_u32_le(&mut payload, 12, self.unknown_b);
        write_u32_le(&mut payload, 16, domain_offset);
        write_u32_le(&mut payload, 20, name_offset);
        write_u32_le(&mut payload, 24, path_offset);
        write_u32_le(&mut payload, 28, value_offset);
        write_u32_le(&mut payload, 32, comment_offset);
        write_u32_le(&mut payload, 36, 0);
        write_f64_le(&mut payload, 40, self.expires_mac_epoch);
        write_f64_le(&mut payload, 48, self.created_mac_epoch);

        Ok(payload)
    }

    fn into_minimal(self) -> Self {
        let mut raw_flags = 0u32;

        if self.is_secure() {
            raw_flags |= 0x1;
        }

        if self.is_http_only() {
            raw_flags |= 0x4;
        }

        Self {
            unknown_a: 1,
            raw_flags,
            unknown_b: 0,
            comment: None,
            domain: self.domain,
            name: self.name,
            path: self.path,
            value: self.value,
            expires_mac_epoch: self.expires_mac_epoch,
            created_mac_epoch: self.created_mac_epoch,
            trailing_data: Vec::new(),
        }
    }
}

impl CookiePage {
    fn encode(&self) -> Result<Vec<u8>> {
        let cookie_payloads = self
            .cookies
            .iter()
            .map(BinaryCookie::encode)
            .collect::<Result<Vec<_>>>()?;

        let cookie_count =
            u32::try_from(cookie_payloads.len()).context("page cookie count exceeds u32")?;
        let header_len = 12usize
            .checked_add(
                cookie_payloads
                    .len()
                    .checked_mul(4)
                    .context("page header overflow")?,
            )
            .context("page header overflow")?;

        let mut page = Vec::new();
        page.extend_from_slice(&PAGE_MAGIC.to_be_bytes());
        page.extend_from_slice(&cookie_count.to_le_bytes());

        let mut next_offset = u32::try_from(header_len).context("page header too large")?;

        for payload in &cookie_payloads {
            page.extend_from_slice(&next_offset.to_le_bytes());

            let payload_len =
                u32::try_from(payload.len()).context("cookie payload length exceeds u32")?;

            next_offset = next_offset
                .checked_add(payload_len)
                .context("page offset overflow")?;
        }

        page.extend_from_slice(&0u32.to_le_bytes());

        for payload in cookie_payloads {
            page.extend_from_slice(&payload);
        }

        Ok(page)
    }
}

impl BinaryCookiesFile {
    fn parse(input: &[u8]) -> Result<Self> {
        let mut cursor = 0usize;

        let magic = read_bytes(input, &mut cursor, FILE_MAGIC.len(), "file magic")?;
        if magic != FILE_MAGIC {
            bail!(
                "invalid file magic: expected {:?}, found {:?}",
                FILE_MAGIC,
                magic
            );
        }

        let page_count = usize::try_from(read_u32_be(input, &mut cursor, "page count")?)
            .context("page count does not fit in usize")?;

        let page_sizes = (0..page_count)
            .map(|index| {
                usize::try_from(read_u32_be(input, &mut cursor, "page size")?)
                    .with_context(|| format!("page size {index} does not fit in usize"))
            })
            .collect::<Result<Vec<_>>>()?;

        let pages = page_sizes
            .iter()
            .enumerate()
            .map(|(index, page_size)| {
                let page_bytes = read_bytes(input, &mut cursor, *page_size, "page bytes")
                    .with_context(|| format!("failed to read page {index}"))?;
                CookiePage::parse(page_bytes)
                    .with_context(|| format!("failed to parse page {index}"))
            })
            .collect::<Result<Vec<_>>>()?;

        let checksum = read_u32_be(input, &mut cursor, "checksum")?;
        let footer = read_u64_be(input, &mut cursor, "footer")?;

        if footer != FILE_FOOTER {
            bail!("invalid file footer: expected 0x{FILE_FOOTER:016x}, found 0x{footer:016x}");
        }

        let metadata = input[cursor..].to_vec();

        Ok(Self {
            pages,
            checksum,
            footer,
            metadata,
        })
    }

    fn encode(&self) -> Result<Vec<u8>> {
        let page_payloads = self
            .pages
            .iter()
            .map(CookiePage::encode)
            .collect::<Result<Vec<_>>>()?;

        let mut output = Vec::new();
        output.extend_from_slice(FILE_MAGIC);

        let page_count = u32::try_from(page_payloads.len()).context("page count exceeds u32")?;
        output.extend_from_slice(&page_count.to_be_bytes());

        for payload in &page_payloads {
            let page_size = u32::try_from(payload.len()).context("page size exceeds u32")?;
            output.extend_from_slice(&page_size.to_be_bytes());
        }

        let checksum = page_payloads.iter().fold(0u32, |sum, page| {
            sum.wrapping_add(calculate_page_checksum(page))
        });

        for payload in page_payloads {
            output.extend_from_slice(&payload);
        }

        output.extend_from_slice(&checksum.to_be_bytes());
        output.extend_from_slice(&self.footer.to_be_bytes());
        output.extend_from_slice(&self.metadata);

        Ok(output)
    }

    fn cookie_count(&self) -> usize {
        self.pages.iter().map(|page| page.cookies.len()).sum()
    }

    fn find_cookie(&self, domain: &[u8], name: &[u8]) -> Option<&BinaryCookie> {
        self.pages
            .iter()
            .flat_map(|page| page.cookies.iter())
            .find(|cookie| cookie.domain == domain && cookie.name == name)
    }

    fn upsert_cookie(&mut self, cookie: BinaryCookie) {
        if let Some(existing_cookie) = self
            .pages
            .iter_mut()
            .flat_map(|page| page.cookies.iter_mut())
            .find(|existing| existing.domain == cookie.domain && existing.name == cookie.name)
        {
            *existing_cookie = cookie;
            return;
        }

        if let Some(page) = self.pages.iter_mut().find(|page| {
            page.cookies
                .iter()
                .any(|existing| existing.domain == cookie.domain)
        }) {
            page.cookies.push(cookie);
            return;
        }

        if let Some(page) = self.pages.first_mut() {
            page.cookies.push(cookie);
            return;
        }

        self.pages.push(CookiePage {
            cookies: vec![cookie],
        });
    }

    #[cfg(test)]
    fn upsert_cookie_with_names(&mut self, cookie: BinaryCookie, names: &[&[u8]]) {
        let domain = cookie.domain.clone();
        let mut replacement = Some(cookie);
        let mut did_replace = false;

        for page in &mut self.pages {
            let mut index = 0usize;

            while index < page.cookies.len() {
                let matches_cookie = page.cookies[index].domain == domain
                    && names
                        .iter()
                        .any(|name| page.cookies[index].name.as_slice() == *name);

                if !matches_cookie {
                    index += 1;
                    continue;
                }

                if did_replace {
                    page.cookies.remove(index);
                    continue;
                }

                if let Some(replacement_cookie) = replacement.take() {
                    page.cookies[index] = replacement_cookie;
                    did_replace = true;
                }

                index += 1;
            }
        }

        self.pages.retain(|page| !page.cookies.is_empty());

        if let Some(replacement_cookie) = replacement {
            self.upsert_cookie(replacement_cookie);
        }
    }

    fn retain_only_cookie(&mut self, domain: &[u8], name: &[u8]) -> usize {
        for page in &mut self.pages {
            page.cookies
                .retain(|cookie| cookie.domain == domain && cookie.name == name);
        }

        self.pages.retain(|page| !page.cookies.is_empty());
        self.cookie_count()
    }

    fn into_minimal(self) -> Self {
        let pages = self
            .pages
            .into_iter()
            .map(|page| CookiePage {
                cookies: page
                    .cookies
                    .into_iter()
                    .map(BinaryCookie::into_minimal)
                    .collect(),
            })
            .filter(|page| !page.cookies.is_empty())
            .collect();

        Self {
            pages,
            checksum: 0,
            footer: FILE_FOOTER,
            metadata: Vec::new(),
        }
    }

    fn describe(&self) -> String {
        let mut summary = String::new();
        let _ = writeln!(
            &mut summary,
            "pages={} cookies={} checksum=0x{:08x} metadata_bytes={}",
            self.pages.len(),
            self.cookie_count(),
            self.checksum,
            self.metadata.len()
        );

        for (page_index, page) in self.pages.iter().enumerate() {
            let _ = writeln!(
                &mut summary,
                "page[{page_index}] cookies={}",
                page.cookies.len()
            );

            for (cookie_index, cookie) in page.cookies.iter().enumerate() {
                let _ = writeln!(
                    &mut summary,
                    "  cookie[{cookie_index}] domain={:?} name={:?} path={:?} value={:?} flags=0x{:08x} secure={} http_only={} trailer_bytes={}",
                    String::from_utf8_lossy(&cookie.domain),
                    String::from_utf8_lossy(&cookie.name),
                    String::from_utf8_lossy(&cookie.path),
                    String::from_utf8_lossy(&cookie.value),
                    cookie.raw_flags,
                    cookie.is_secure(),
                    cookie.is_http_only(),
                    cookie.trailing_data.len()
                );
            }
        }

        summary
    }
}

impl CookiePage {
    fn parse(page_bytes: &[u8]) -> Result<Self> {
        let mut cursor = 0usize;

        let page_magic = read_u32_be(page_bytes, &mut cursor, "page magic")?;
        if page_magic != PAGE_MAGIC {
            bail!("invalid page magic: expected 0x{PAGE_MAGIC:08x}, found 0x{page_magic:08x}");
        }

        let cookie_count = usize::try_from(read_u32_le(page_bytes, &mut cursor, "cookie count")?)
            .context("cookie count does not fit in usize")?;

        let cookie_offsets = (0..cookie_count)
            .map(|index| {
                usize::try_from(read_u32_le(page_bytes, &mut cursor, "cookie offset")?)
                    .with_context(|| format!("cookie offset {index} does not fit in usize"))
            })
            .collect::<Result<Vec<_>>>()?;

        let page_end = read_u32_le(page_bytes, &mut cursor, "page end marker")?;
        if page_end != 0 {
            bail!("expected zero page end marker, found 0x{page_end:08x}");
        }

        let cookies = cookie_offsets
            .iter()
            .enumerate()
            .map(|(index, cookie_offset)| {
                if *cookie_offset >= page_bytes.len() {
                    bail!(
                        "cookie offset {} is outside the page length {}",
                        cookie_offset,
                        page_bytes.len()
                    );
                }

                BinaryCookie::parse(&page_bytes[*cookie_offset..])
                    .with_context(|| format!("failed to parse cookie {index}"))
            })
            .collect::<Result<Vec<_>>>()?;

        Ok(Self { cookies })
    }
}

impl BinaryCookie {
    fn parse(cookie_bytes: &[u8]) -> Result<Self> {
        if cookie_bytes.len() < COOKIE_HEADER_LEN {
            bail!(
                "cookie is shorter than header: {} < {}",
                cookie_bytes.len(),
                COOKIE_HEADER_LEN
            );
        }

        let mut cursor = 0usize;
        let cookie_size = usize::try_from(read_u32_le(cookie_bytes, &mut cursor, "cookie size")?)
            .context("cookie size does not fit in usize")?;

        if cookie_size < COOKIE_HEADER_LEN {
            bail!(
                "cookie size {} is smaller than header length {}",
                cookie_size,
                COOKIE_HEADER_LEN
            );
        }

        if cookie_size > cookie_bytes.len() {
            bail!(
                "cookie size {} exceeds available bytes {}",
                cookie_size,
                cookie_bytes.len()
            );
        }

        let cookie = &cookie_bytes[..cookie_size];
        let unknown_a = read_u32_le(cookie, &mut cursor, "cookie unknown_a")?;
        let raw_flags = read_u32_le(cookie, &mut cursor, "cookie flags")?;
        let unknown_b = read_u32_le(cookie, &mut cursor, "cookie unknown_b")?;
        let domain_offset = usize::try_from(read_u32_le(cookie, &mut cursor, "domain offset")?)
            .context("domain offset does not fit in usize")?;
        let name_offset = usize::try_from(read_u32_le(cookie, &mut cursor, "name offset")?)
            .context("name offset does not fit in usize")?;
        let path_offset = usize::try_from(read_u32_le(cookie, &mut cursor, "path offset")?)
            .context("path offset does not fit in usize")?;
        let value_offset = usize::try_from(read_u32_le(cookie, &mut cursor, "value offset")?)
            .context("value offset does not fit in usize")?;
        let comment_offset = usize::try_from(read_u32_le(cookie, &mut cursor, "comment offset")?)
            .context("comment offset does not fit in usize")?;
        let separator = read_u32_le(cookie, &mut cursor, "separator")?;

        if separator != 0 {
            bail!("expected zero cookie separator, found 0x{separator:08x}");
        }

        let expires_mac_epoch = read_f64_le(cookie, &mut cursor, "expires")?;
        let created_mac_epoch = read_f64_le(cookie, &mut cursor, "created")?;

        let mut trailing_start = COOKIE_HEADER_LEN;

        let comment = if comment_offset == 0 {
            None
        } else {
            let (value, end_offset) = read_c_string(cookie, comment_offset, "comment")?;
            trailing_start = trailing_start.max(end_offset);
            Some(value)
        };

        let (domain, domain_end) = read_c_string(cookie, domain_offset, "domain")?;
        trailing_start = trailing_start.max(domain_end);

        let (name, name_end) = read_c_string(cookie, name_offset, "name")?;
        trailing_start = trailing_start.max(name_end);

        let (path, path_end) = read_c_string(cookie, path_offset, "path")?;
        trailing_start = trailing_start.max(path_end);

        let (value, value_end) = read_c_string(cookie, value_offset, "value")?;
        trailing_start = trailing_start.max(value_end);

        let trailing_data = cookie[trailing_start..].to_vec();

        Ok(Self {
            unknown_a,
            raw_flags,
            unknown_b,
            comment,
            domain,
            name,
            path,
            value,
            expires_mac_epoch,
            created_mac_epoch,
            trailing_data,
        })
    }
}

fn append_c_string(buffer: &mut Vec<u8>, value: &[u8]) -> Result<u32> {
    let offset = u32::try_from(buffer.len()).context("cookie string offset exceeds u32")?;
    buffer.extend_from_slice(value);
    buffer.push(0);
    Ok(offset)
}

fn read_c_string(input: &[u8], offset: usize, label: &str) -> Result<(Vec<u8>, usize)> {
    if offset >= input.len() {
        bail!(
            "{label} offset {offset} is outside the cookie length {}",
            input.len()
        );
    }

    let bytes = &input[offset..];
    let terminator_index = bytes
        .iter()
        .position(|byte| *byte == 0)
        .ok_or_else(|| anyhow!("{label} string is missing a NUL terminator"))?;

    let end_offset = offset
        .checked_add(terminator_index)
        .and_then(|value| value.checked_add(1))
        .context("string end overflow")?;

    Ok((bytes[..terminator_index].to_vec(), end_offset))
}

fn calculate_page_checksum(page: &[u8]) -> u32 {
    page.iter()
        .step_by(4)
        .fold(0u32, |sum, byte| sum.wrapping_add(u32::from(*byte)))
}

fn read_bytes<'a>(
    input: &'a [u8],
    cursor: &mut usize,
    len: usize,
    label: &str,
) -> Result<&'a [u8]> {
    let end = cursor.checked_add(len).context("cursor overflow")?;
    let bytes = input
        .get(*cursor..end)
        .ok_or_else(|| anyhow!("failed to read {label}: need {len} bytes"))?;
    *cursor = end;
    Ok(bytes)
}

fn read_u32_be(input: &[u8], cursor: &mut usize, label: &str) -> Result<u32> {
    let bytes = read_bytes(input, cursor, 4, label)?;
    Ok(u32::from_be_bytes(
        bytes.try_into().expect("slice length is fixed"),
    ))
}

fn read_u64_be(input: &[u8], cursor: &mut usize, label: &str) -> Result<u64> {
    let bytes = read_bytes(input, cursor, 8, label)?;
    Ok(u64::from_be_bytes(
        bytes.try_into().expect("slice length is fixed"),
    ))
}

fn read_u32_le(input: &[u8], cursor: &mut usize, label: &str) -> Result<u32> {
    let bytes = read_bytes(input, cursor, 4, label)?;
    Ok(u32::from_le_bytes(
        bytes.try_into().expect("slice length is fixed"),
    ))
}

fn read_f64_le(input: &[u8], cursor: &mut usize, label: &str) -> Result<f64> {
    let bytes = read_bytes(input, cursor, 8, label)?;
    Ok(f64::from_le_bytes(
        bytes.try_into().expect("slice length is fixed"),
    ))
}

fn write_u32_le(buffer: &mut [u8], offset: usize, value: u32) {
    buffer[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
}

fn write_f64_le(buffer: &mut [u8], offset: usize, value: f64) {
    buffer[offset..offset + 8].copy_from_slice(&value.to_le_bytes());
}

fn default_roundtrip_path(input_path: &Path) -> PathBuf {
    let mut output_path = input_path.to_path_buf();
    let Some(file_name) = input_path.file_name() else {
        return input_path.with_extension("roundtrip.binarycookies");
    };

    let mut next_name = file_name.to_os_string();
    next_name.push(".roundtrip");
    output_path.set_file_name(next_name);
    output_path
}

fn default_backup_path(input_path: &Path) -> Result<PathBuf> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("system clock is before unix epoch")?
        .as_secs();

    let Some(file_name) = input_path.file_name() else {
        bail!(
            "cannot derive backup file name from {}",
            input_path.display()
        );
    };

    let mut backup_name = file_name.to_os_string();
    backup_name.push(format!(".bak.{timestamp}"));

    Ok(input_path.with_file_name(backup_name))
}

fn load_cookie_value(cookie_value_path: &Path) -> Result<Vec<u8>> {
    let cookie_value = fs::read(cookie_value_path)
        .with_context(|| format!("failed to read {}", cookie_value_path.display()))?;

    Ok(cookie_value
        .into_iter()
        .rev()
        .skip_while(|byte| *byte == b'\n' || *byte == b'\r')
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect())
}

fn build_roblox_cookie(
    file: &BinaryCookiesFile,
    target_name: &[u8],
    value: Vec<u8>,
) -> BinaryCookie {
    if let Some(template) = file
        .find_cookie(ROBLOX_DOMAIN, target_name)
        .or_else(|| file.find_cookie(ROBLOX_DOMAIN, ROBLOSECURITY_COOKIE_NAME))
    {
        let mut cookie = template.clone();
        cookie.name = target_name.to_vec();
        cookie.value = value;
        return cookie;
    }

    BinaryCookie {
        unknown_a: 0,
        raw_flags: 0x4215,
        unknown_b: 0,
        comment: None,
        domain: ROBLOX_DOMAIN.to_vec(),
        name: target_name.to_vec(),
        path: ROBLOX_PATH.to_vec(),
        value,
        expires_mac_epoch: 0.0,
        created_mac_epoch: 0.0,
        trailing_data: Vec::new(),
    }
}

#[cfg(test)]
fn build_robloxcookies_cookie(file: &BinaryCookiesFile, value: Vec<u8>) -> BinaryCookie {
    build_roblox_cookie(file, ROBLOXCOOKIES_COOKIE_NAME, value)
}

fn build_roblosecurity_cookie(file: &BinaryCookiesFile, value: Vec<u8>) -> BinaryCookie {
    build_roblox_cookie(file, ROBLOSECURITY_COOKIE_NAME, value)
}

#[cfg(test)]
fn roblox_cookie_names() -> [&'static [u8]; 2] {
    [ROBLOXCOOKIES_COOKIE_NAME, ROBLOSECURITY_COOKIE_NAME]
}

fn mac_epoch_from_system_time(time: SystemTime) -> Result<f64> {
    let seconds = time
        .duration_since(UNIX_EPOCH)
        .context("system clock is before unix epoch")?
        .as_secs_f64();
    Ok(seconds - MAC_EPOCH_OFFSET_SECS)
}

fn build_minimal_roblosecurity_cookie(value: Vec<u8>) -> Result<BinaryCookie> {
    let created_at = SystemTime::now();
    let expires_at = created_at
        .checked_add(std::time::Duration::from_secs(ROBLOX_COOKIE_LIFETIME_SECS))
        .context("roblox cookie expiration overflow")?;

    Ok(BinaryCookie {
        unknown_a: 1,
        raw_flags: 0x5,
        unknown_b: 0,
        comment: None,
        domain: ROBLOX_DOMAIN.to_vec(),
        name: ROBLOSECURITY_COOKIE_NAME.to_vec(),
        path: ROBLOX_PATH.to_vec(),
        value,
        expires_mac_epoch: mac_epoch_from_system_time(expires_at)?,
        created_mac_epoch: mac_epoch_from_system_time(created_at)?,
        trailing_data: Vec::new(),
    })
}

fn build_minimal_roblosecurity_file(value: Vec<u8>) -> Result<BinaryCookiesFile> {
    let cookie = build_minimal_roblosecurity_cookie(value)?;

    Ok(BinaryCookiesFile {
        pages: vec![CookiePage {
            cookies: vec![cookie],
        }],
        checksum: 0,
        footer: FILE_FOOTER,
        metadata: Vec::new(),
    })
}

pub(crate) fn build_minimal_roblosecurity_binarycookies(cookie_value: &[u8]) -> Result<Vec<u8>> {
    build_minimal_roblosecurity_file(cookie_value.to_vec())?.encode()
}

pub(crate) fn write_minimal_roblosecurity_cookie_file(
    output_path: &Path,
    cookie_value: &[u8],
) -> Result<()> {
    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("failed to create directory {}", parent.display()))?;
    }

    let output_bytes = build_minimal_roblosecurity_binarycookies(cookie_value)?;
    fs::write(output_path, output_bytes)
        .with_context(|| format!("failed to write {}", output_path.display()))
}

pub(crate) fn inject_roblox_cookie(
    input_path: &Path,
    cookie_value_path: &Path,
    output_path: Option<&Path>,
) -> Result<()> {
    let input_bytes =
        fs::read(input_path).with_context(|| format!("failed to read {}", input_path.display()))?;
    let cookie_value = load_cookie_value(cookie_value_path)?;
    let parsed = build_minimal_roblosecurity_file(cookie_value)?;
    let output_bytes = parsed.encode()?;

    let destination = output_path.unwrap_or(input_path);

    if destination == input_path {
        let backup_path = default_backup_path(input_path)?;
        fs::write(&backup_path, &input_bytes)
            .with_context(|| format!("failed to write backup {}", backup_path.display()))?;
    }

    fs::write(destination, &output_bytes)
        .with_context(|| format!("failed to write {}", destination.display()))?;

    Ok(())
}

pub(crate) fn replace_roblosecurity_cookie(
    input_path: &Path,
    cookie_value_path: &Path,
    output_path: Option<&Path>,
) -> Result<()> {
    let input_bytes =
        fs::read(input_path).with_context(|| format!("failed to read {}", input_path.display()))?;
    let mut parsed = BinaryCookiesFile::parse(&input_bytes)?;
    let cookie_value = load_cookie_value(cookie_value_path)?;
    let cookie = build_roblosecurity_cookie(&parsed, cookie_value);
    parsed.upsert_cookie(cookie);
    let output_bytes = parsed.encode()?;

    let destination = output_path.unwrap_or(input_path);

    if destination == input_path {
        let backup_path = default_backup_path(input_path)?;
        fs::write(&backup_path, &input_bytes)
            .with_context(|| format!("failed to write backup {}", backup_path.display()))?;
    }

    fs::write(destination, &output_bytes)
        .with_context(|| format!("failed to write {}", destination.display()))?;

    Ok(())
}

pub(crate) fn keep_only_robloxcookies(input_path: &Path, output_path: Option<&Path>) -> Result<()> {
    let input_bytes =
        fs::read(input_path).with_context(|| format!("failed to read {}", input_path.display()))?;
    let mut parsed = BinaryCookiesFile::parse(&input_bytes)?;
    let remaining = parsed.retain_only_cookie(ROBLOX_DOMAIN, ROBLOXCOOKIES_COOKIE_NAME);

    if remaining == 0 {
        bail!(
            "no {} cookie found in {}",
            String::from_utf8_lossy(ROBLOXCOOKIES_COOKIE_NAME),
            input_path.display()
        );
    }

    let output_bytes = parsed.encode()?;
    let destination = output_path.unwrap_or(input_path);

    if destination == input_path {
        let backup_path = default_backup_path(input_path)?;
        fs::write(&backup_path, &input_bytes)
            .with_context(|| format!("failed to write backup {}", backup_path.display()))?;
    }

    fs::write(destination, &output_bytes)
        .with_context(|| format!("failed to write {}", destination.display()))?;

    Ok(())
}

pub(crate) fn rewrite_minimal(input_path: &Path, output_path: Option<&Path>) -> Result<()> {
    let input_bytes =
        fs::read(input_path).with_context(|| format!("failed to read {}", input_path.display()))?;
    let parsed = BinaryCookiesFile::parse(&input_bytes)?;
    let minimal = parsed.into_minimal();
    let output_bytes = minimal.encode()?;

    let destination = output_path.unwrap_or(input_path);

    if destination == input_path {
        let backup_path = default_backup_path(input_path)?;
        fs::write(&backup_path, &input_bytes)
            .with_context(|| format!("failed to write backup {}", backup_path.display()))?;
    }

    fs::write(destination, &output_bytes)
        .with_context(|| format!("failed to write {}", destination.display()))?;

    Ok(())
}

pub(crate) fn roundtrip_binarycookies(input_path: &Path, output_path: Option<&Path>) -> Result<()> {
    let output_path = output_path
        .map(PathBuf::from)
        .unwrap_or_else(|| default_roundtrip_path(input_path));
    let input_bytes = fs::read(&input_path)
        .with_context(|| format!("failed to read {}", input_path.display()))?;
    let parsed = BinaryCookiesFile::parse(&input_bytes)?;
    let output_bytes = parsed.encode()?;

    fs::write(&output_path, &output_bytes)
        .with_context(|| format!("failed to write {}", output_path.display()))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_file() -> BinaryCookiesFile {
        BinaryCookiesFile {
            pages: vec![CookiePage {
                cookies: vec![
                    BinaryCookie {
                        unknown_a: 0,
                        raw_flags: 0x4210,
                        unknown_b: 0,
                        comment: None,
                        domain: b".roblox.com".to_vec(),
                        name: b"GuestData".to_vec(),
                        path: b"/".to_vec(),
                        value: b"UserID=123".to_vec(),
                        expires_mac_epoch: 830_102_304.0,
                        created_mac_epoch: 829_002_304.0,
                        trailing_data: b"bplist00cookie-one".to_vec(),
                    },
                    BinaryCookie {
                        unknown_a: 0,
                        raw_flags: 0x4215,
                        unknown_b: 0,
                        comment: Some(b"test-comment".to_vec()),
                        domain: b".roblox.com".to_vec(),
                        name: b".ROBLOSECURITY".to_vec(),
                        path: b"/".to_vec(),
                        value: b"secret".to_vec(),
                        expires_mac_epoch: 830_202_304.0,
                        created_mac_epoch: 829_102_304.0,
                        trailing_data: b"bplist00cookie-two".to_vec(),
                    },
                ],
            }],
            checksum: 0,
            footer: FILE_FOOTER,
            metadata: b"bplist00meta".to_vec(),
        }
    }

    #[test]
    fn round_trips_generated_file() -> Result<()> {
        let file = sample_file();
        let encoded = file.encode()?;
        let decoded = BinaryCookiesFile::parse(&encoded)?;

        assert_eq!(decoded.footer, FILE_FOOTER);
        assert_eq!(decoded.metadata, b"bplist00meta".to_vec());
        assert_eq!(decoded.pages, file.pages);

        let reencoded = decoded.encode()?;
        assert_eq!(encoded, reencoded);

        Ok(())
    }

    #[test]
    fn page_checksum_matches_file_tail() -> Result<()> {
        let file = sample_file();
        let encoded = file.encode()?;
        let parsed = BinaryCookiesFile::parse(&encoded)?;

        let page_payload = parsed.pages[0].encode()?;
        let checksum = calculate_page_checksum(&page_payload);
        let stored_checksum = u32::from_be_bytes(
            encoded[encoded.len() - parsed.metadata.len() - 12
                ..encoded.len() - parsed.metadata.len() - 8]
                .try_into()
                .expect("slice length is fixed"),
        );

        assert_eq!(checksum, stored_checksum);

        Ok(())
    }

    #[test]
    fn upsert_cookie_replaces_existing_value() -> Result<()> {
        let mut file = sample_file();
        let replacement = build_robloxcookies_cookie(&file, b"new-cookie".to_vec());

        file.upsert_cookie_with_names(replacement, &roblox_cookie_names());

        let inserted = file
            .find_cookie(ROBLOX_DOMAIN, ROBLOXCOOKIES_COOKIE_NAME)
            .context("expected inserted cookie")?;

        assert_eq!(inserted.value, b"new-cookie".to_vec());
        assert_eq!(inserted.raw_flags, 0x4215);
        assert_eq!(inserted.domain, ROBLOX_DOMAIN.to_vec());
        assert_eq!(inserted.path, ROBLOX_PATH.to_vec());
        assert_eq!(file.cookie_count(), 2);
        assert!(file
            .find_cookie(ROBLOX_DOMAIN, ROBLOSECURITY_COOKIE_NAME)
            .is_none());

        Ok(())
    }

    #[test]
    fn minimal_roblosecurity_file_matches_expected_auth_shape() -> Result<()> {
        let file = build_minimal_roblosecurity_file(b"replacement".to_vec())?;

        assert_eq!(file.pages.len(), 1);
        assert!(file.metadata.is_empty());
        assert_eq!(file.cookie_count(), 1);

        let cookie = file
            .find_cookie(ROBLOX_DOMAIN, ROBLOSECURITY_COOKIE_NAME)
            .context("expected roblosecurity cookie")?;

        assert_eq!(cookie.unknown_a, 1);
        assert_eq!(cookie.raw_flags, 0x5);
        assert_eq!(cookie.unknown_b, 0);
        assert!(cookie.comment.is_none());
        assert!(cookie.trailing_data.is_empty());
        assert_eq!(cookie.value, b"replacement".to_vec());
        assert!(cookie.expires_mac_epoch > cookie.created_mac_epoch);

        Ok(())
    }

    #[test]
    fn replace_roblosecurity_reuses_existing_cookie_slot() -> Result<()> {
        let mut file = sample_file();
        let replacement = build_roblosecurity_cookie(&file, b"replacement".to_vec());

        file.upsert_cookie(replacement);

        let roblosecurity = file
            .find_cookie(ROBLOX_DOMAIN, ROBLOSECURITY_COOKIE_NAME)
            .context("expected roblosecurity cookie")?;

        assert_eq!(roblosecurity.value, b"replacement".to_vec());
        assert_eq!(roblosecurity.raw_flags, 0x4215);

        Ok(())
    }

    #[test]
    fn upsert_cookie_with_names_removes_duplicate_auth_aliases() -> Result<()> {
        let mut file = sample_file();
        file.upsert_cookie(build_robloxcookies_cookie(&file, b"stale-cookie".to_vec()));

        let replacement = build_robloxcookies_cookie(&file, b"replacement".to_vec());
        file.upsert_cookie_with_names(replacement, &roblox_cookie_names());

        assert_eq!(file.cookie_count(), 2);
        assert!(file
            .find_cookie(ROBLOX_DOMAIN, ROBLOSECURITY_COOKIE_NAME)
            .is_none());

        let roblox_cookie = file
            .find_cookie(ROBLOX_DOMAIN, ROBLOXCOOKIES_COOKIE_NAME)
            .context("expected roblox auth cookie")?;

        assert_eq!(roblox_cookie.value, b"replacement".to_vec());

        Ok(())
    }

    #[test]
    fn retain_only_robloxcookies_filters_other_cookies() -> Result<()> {
        let mut file = sample_file();
        file.upsert_cookie(build_robloxcookies_cookie(&file, b"cookie-only".to_vec()));

        let remaining = file.retain_only_cookie(ROBLOX_DOMAIN, ROBLOXCOOKIES_COOKIE_NAME);

        assert_eq!(remaining, 1);
        assert_eq!(file.cookie_count(), 1);

        let cookie = file
            .find_cookie(ROBLOX_DOMAIN, ROBLOXCOOKIES_COOKIE_NAME)
            .context("expected robloxcookies cookie")?;

        assert_eq!(cookie.value, b"cookie-only".to_vec());

        Ok(())
    }

    #[test]
    fn minimal_rewrite_strips_metadata_and_trailing_data() -> Result<()> {
        let file = sample_file();
        let minimal = file.into_minimal();

        assert!(minimal.metadata.is_empty());
        assert_eq!(minimal.footer, FILE_FOOTER);

        for cookie in minimal.pages.iter().flat_map(|page| page.cookies.iter()) {
            assert_eq!(cookie.unknown_a, 1);
            assert_eq!(cookie.unknown_b, 0);
            assert!(cookie.comment.is_none());
            assert!(cookie.trailing_data.is_empty());
            assert_eq!(cookie.raw_flags & !0x5, 0);
        }

        Ok(())
    }
}
