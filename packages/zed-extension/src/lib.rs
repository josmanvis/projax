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

/// Build the PokeAPI URL for a pokemon query
fn build_pokemon_url(query: &str) -> String {
    format!("https://pokeapi.co/api/v2/pokemon/{}", query.to_lowercase())
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
                let pokemon_query = args.join(" ");
                let url = build_pokemon_url(&pokemon_query);

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_capitalize_basic() {
        assert_eq!(capitalize("pikachu"), "Pikachu");
        assert_eq!(capitalize("charizard"), "Charizard");
    }

    #[test]
    fn test_capitalize_empty() {
        assert_eq!(capitalize(""), "");
    }

    #[test]
    fn test_capitalize_already_capitalized() {
        assert_eq!(capitalize("Bulbasaur"), "Bulbasaur");
    }

    #[test]
    fn test_capitalize_with_spaces() {
        assert_eq!(capitalize("special attack"), "Special attack");
    }

    #[test]
    fn test_pokemon_deserialization() {
        let json = r#"{
            "id": 25,
            "name": "pikachu",
            "height": 4,
            "weight": 60,
            "types": [
                {"slot": 1, "type": {"name": "electric"}}
            ],
            "abilities": [
                {"is_hidden": false, "ability": {"name": "static"}},
                {"is_hidden": true, "ability": {"name": "lightning-rod"}}
            ],
            "stats": [
                {"base_stat": 35, "stat": {"name": "hp"}},
                {"base_stat": 55, "stat": {"name": "attack"}}
            ]
        }"#;

        let pokemon: Pokemon = serde_json::from_str(json).expect("Failed to parse Pokemon");

        assert_eq!(pokemon.id, 25);
        assert_eq!(pokemon.name, "pikachu");
        assert_eq!(pokemon.height, 4);
        assert_eq!(pokemon.weight, 60);
        assert_eq!(pokemon.types.len(), 1);
        assert_eq!(pokemon.types[0].type_info.name, "electric");
        assert_eq!(pokemon.abilities.len(), 2);
        assert!(!pokemon.abilities[0].is_hidden);
        assert!(pokemon.abilities[1].is_hidden);
        assert_eq!(pokemon.stats.len(), 2);
        assert_eq!(pokemon.stats[0].base_stat, 35);
    }

    #[test]
    fn test_pokemon_with_multiple_types() {
        let json = r#"{
            "id": 6,
            "name": "charizard",
            "height": 17,
            "weight": 905,
            "types": [
                {"slot": 1, "type": {"name": "fire"}},
                {"slot": 2, "type": {"name": "flying"}}
            ],
            "abilities": [
                {"is_hidden": false, "ability": {"name": "blaze"}}
            ],
            "stats": [
                {"base_stat": 78, "stat": {"name": "hp"}}
            ]
        }"#;

        let pokemon: Pokemon = serde_json::from_str(json).expect("Failed to parse Pokemon");

        assert_eq!(pokemon.types.len(), 2);
        assert_eq!(pokemon.types[0].type_info.name, "fire");
        assert_eq!(pokemon.types[1].type_info.name, "flying");
    }

    #[test]
    fn test_build_pokemon_url_basic() {
        assert_eq!(
            build_pokemon_url("pikachu"),
            "https://pokeapi.co/api/v2/pokemon/pikachu"
        );
    }

    #[test]
    fn test_build_pokemon_url_lowercase() {
        assert_eq!(
            build_pokemon_url("PIKACHU"),
            "https://pokeapi.co/api/v2/pokemon/pikachu"
        );
        assert_eq!(
            build_pokemon_url("Charizard"),
            "https://pokeapi.co/api/v2/pokemon/charizard"
        );
    }

    #[test]
    fn test_build_pokemon_url_numeric() {
        assert_eq!(
            build_pokemon_url("25"),
            "https://pokeapi.co/api/v2/pokemon/25"
        );
    }
}
