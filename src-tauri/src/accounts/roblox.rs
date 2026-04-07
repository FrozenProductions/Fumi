use anyhow::{anyhow, Context, Result};
use reqwest::Client;
use serde::Deserialize;
use tauri::{AppHandle, Runtime};

use super::models::ResolvedRobloxAccount;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RobloxAuthenticatedUser {
    id: i64,
    name: String,
    display_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RobloxThumbnailResponse {
    data: Vec<RobloxThumbnail>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RobloxThumbnail {
    state: String,
    image_url: Option<String>,
}

fn create_client() -> Result<Client> {
    Client::builder()
        .build()
        .context("failed to build roblox http client")
}

fn create_user_agent<R: Runtime>(app: &AppHandle<R>) -> String {
    format!("Fumi/{}", app.package_info().version)
}

pub(super) async fn resolve_account_from_cookie<R: Runtime>(
    app: &AppHandle<R>,
    cookie: &str,
) -> Result<ResolvedRobloxAccount> {
    let client = create_client()?;
    let user_agent = create_user_agent(app);
    let profile = fetch_authenticated_user(&client, cookie, &user_agent).await?;
    let avatar_url = fetch_avatar_thumbnail(&client, profile.id, &user_agent).await?;

    Ok(ResolvedRobloxAccount {
        user_id: profile.id,
        username: profile.name,
        display_name: profile.display_name,
        avatar_url,
    })
}

async fn fetch_authenticated_user(
    client: &Client,
    cookie: &str,
    user_agent: &str,
) -> Result<RobloxAuthenticatedUser> {
    let response = client
        .get("https://users.roblox.com/v1/users/authenticated")
        .header("Cookie", format!(".ROBLOSECURITY={cookie}"))
        .header("User-Agent", user_agent)
        .send()
        .await
        .context("failed to request the authenticated roblox user")?;

    let status = response.status();
    if !status.is_success() {
        return Err(anyhow!(
            "failed to validate the roblox cookie: {}",
            status.as_u16()
        ));
    }

    response
        .json::<RobloxAuthenticatedUser>()
        .await
        .context("failed to decode the roblox profile response")
}

async fn fetch_avatar_thumbnail(
    client: &Client,
    user_id: i64,
    user_agent: &str,
) -> Result<Option<String>> {
    let response = client
        .get("https://thumbnails.roblox.com/v1/users/avatar-headshot")
        .query(&[
            ("userIds", user_id.to_string()),
            ("size", "150x150".to_string()),
            ("format", "Png".to_string()),
            ("isCircular", "false".to_string()),
        ])
        .header("User-Agent", user_agent)
        .send()
        .await
        .context("failed to request the roblox avatar thumbnail")?;

    let status = response.status();
    if !status.is_success() {
        return Err(anyhow!(
            "failed to fetch the roblox avatar thumbnail: {}",
            status.as_u16()
        ));
    }

    let payload = response
        .json::<RobloxThumbnailResponse>()
        .await
        .context("failed to decode the roblox thumbnail response")?;

    let Some(thumbnail) = payload.data.first() else {
        return Ok(None);
    };

    match thumbnail.state.as_str() {
        "Completed" => Ok(thumbnail.image_url.clone()),
        "Pending" => Ok(None),
        state => Err(anyhow!("unexpected roblox avatar thumbnail state: {state}")),
    }
}
