use reqwest;
use serde::Deserialize;
use zed_extension_api::{self as zed, Result};

use console_error_panic_hook;
use wasm_bindgen_futures::spawn_local;

#[derive(Deserialize, Debug)]
struct Pokemon {
    id: u32,
    name: String,
    height: u32,
    weight: u32,
    sprites: Sprites,
}

#[derive(Deserialize, Debug)]
struct Sprites {
    front_default: Option<String>, // front_default can be null
}

struct PokemonExtension;

impl zed::Extension for PokemonExtension {
    fn new() -> Self {
        console_error_panic_hook::set_once();
        Self
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        Err("This extension does not provide a language server.".to_string())
    }

    fn run_slash_command(
        &self,
        command: zed::SlashCommand,
        args: Vec<String>,
        _worktree: Option<&zed::Worktree>,
    ) -> Result<zed::SlashCommandOutput, String> {
        match command.name.as_str() {
            "get_pokemon" => {
                if args.is_empty() {
                    return Err("Usage: /get_pokemon <pokemon_name_or_id>".to_string());
                }
                let pokemon_query = args.join(" ");
                let client = reqwest::Client::new();
                let url = format!("https://pokeapi.co/api/v2/pokemon/{}", pokemon_query.to_lowercase());

                // Spawn an async task to fetch and process the Pokemon data
                spawn_local(async move {
                    match fetch_pokemon(&client, &url).await {
                        Ok(pokemon) => {
                            let _sprite_url = pokemon.sprites.front_default.unwrap_or_else(|| "No image available".to_string());
                            // In a real extension, you might update a UI panel or perform other actions here.
                            // For now, we just log the output.
                        },
                        Err(_e) => {
                            // error logging to Zed is not directly available, but can be returned in SlashCommandOutput
                        }
                    }
                });

                // Return an immediate output, the actual data will be logged asynchronously
                Ok(zed::SlashCommandOutput {
                    text: format!("Fetching Pokémon: {}...", pokemon_query),
                    sections: Vec::new(),
                })
            },
            "move_terminal_left" => {
                Ok(zed::SlashCommandOutput {
                    text: "To move the terminal to the left, open the command palette (Cmd-Shift-P) and type `workspace::ToggleLeftDock`".to_string(),
                    sections: Vec::new(),
                })
            },
            "move_terminal_right" => {
                Ok(zed::SlashCommandOutput {
                    text: "To move the terminal to the right, open the command palette (Cmd-Shift-P) and type `workspace::ToggleRightDock`".to_string(),
                    sections: Vec::new(),
                })
            },
            "move_terminal_bottom" => {
                Ok(zed::SlashCommandOutput {
                    text: "To move the terminal to the bottom, open the command palette (Cmd-Shift-P) and type `workspace::ToggleBottomDock`".to_string(),
                    sections: Vec::new(),
                })
            }
            _ => Err(format!("Unknown command: {}", command.name)),
        }
    }
}

async fn fetch_pokemon(client: &reqwest::Client, url: &str) -> Result<Pokemon, String> {
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Pokémon: {}", e))?
        .error_for_status()
        .map_err(|e| format!("HTTP error: {}", e))?;

    let pokemon: Pokemon = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Pokémon data: {}", e))?;

    Ok(pokemon)
}

zed::register_extension!(PokemonExtension);
