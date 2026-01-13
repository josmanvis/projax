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
    types: Vec<PokemonTypeSlot>,
    abilities: Vec<PokemonAbilitySlot>,
    stats: Vec<PokemonStat>,
}

#[derive(Deserialize, Debug)]
struct PokemonTypeSlot {
    #[allow(dead_code)]
    slot: u32,
    #[serde(rename = "type")]
    type_info: NamedResource,
}

#[derive(Deserialize, Debug)]
struct PokemonAbilitySlot {
    is_hidden: bool,
    ability: NamedResource,
}

#[derive(Deserialize, Debug)]
struct PokemonStat {
    base_stat: u32,
    stat: NamedResource,
}

#[derive(Deserialize, Debug)]
struct NamedResource {
    name: String,
}

/// Capitalize the first letter of a string
fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
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

                // Format types
                let types: Vec<String> = pokemon.types
                    .iter()
                    .map(|t| capitalize(&t.type_info.name))
                    .collect();
                let types_str = types.join(", ");

                // Format abilities
                let abilities: Vec<String> = pokemon.abilities
                    .iter()
                    .map(|a| {
                        let name = capitalize(&a.ability.name.replace("-", " "));
                        if a.is_hidden {
                            format!("{} (Hidden)", name)
                        } else {
                            name
                        }
                    })
                    .collect();
                let abilities_str = abilities.join(", ");

                // Format stats
                let stats_str: Vec<String> = pokemon.stats
                    .iter()
                    .map(|s| format!("  - {}: {}", capitalize(&s.stat.name.replace("-", " ")), s.base_stat))
                    .collect();

                let output = format!(
                    "# {} (ID: {})\n\n\
                    **Type:** {}\n\n\
                    **Abilities:** {}\n\n\
                    ## Base Stats\n{}\n\n\
                    ## Physical\n- Height: {} dm ({:.1} m)\n- Weight: {} hg ({:.1} kg)",
                    pokemon.name.to_uppercase(),
                    pokemon.id,
                    types_str,
                    abilities_str,
                    stats_str.join("\n"),
                    pokemon.height,
                    pokemon.height as f32 / 10.0,
                    pokemon.weight,
                    pokemon.weight as f32 / 10.0
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
