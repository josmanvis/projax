use serde::Deserialize;
use zed_extension_api::{
    self as zed,
    http_client::{HttpMethod, HttpRequest},
    Result,
};

#[derive(Deserialize, Debug)]
struct Pokemon {
    id: u32,
    name: String,
    height: u32,
    weight: u32,
}

struct PokemonExtension;

impl zed::Extension for PokemonExtension {
    fn new() -> Self {
        Self
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
                let pokemon_query = args.join(" ").to_lowercase();
                let url = format!("https://pokeapi.co/api/v2/pokemon/{}", pokemon_query);

                let request = HttpRequest::builder()
                    .method(HttpMethod::Get)
                    .url(&url)
                    .build()
                    .map_err(|e| format!("Failed to build request: {}", e))?;

                let response = request
                    .fetch()
                    .map_err(|e| format!("Failed to fetch Pokémon: {}", e))?;

                let pokemon: Pokemon = serde_json::from_slice(&response.body)
                    .map_err(|e| format!("Failed to parse Pokémon data: {}", e))?;

                let output = format!(
                    "# {} (ID: {})\n\n- Height: {} dm\n- Weight: {} hg",
                    pokemon.name.to_uppercase(),
                    pokemon.id,
                    pokemon.height,
                    pokemon.weight
                );

                Ok(zed::SlashCommandOutput {
                    text: output,
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

zed::register_extension!(PokemonExtension);
