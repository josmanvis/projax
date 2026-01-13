use serde::Deserialize;
use std::fs;
use zed_extension_api::{
    self as zed,
    Result,
};

#[derive(Deserialize, Debug, Clone)]
struct Project {
    id: u32,
    name: String,
    path: String,
    description: Option<String>,
    framework: Option<String>,
    last_scanned: Option<u64>,
    created_at: u64,
    #[serde(default)]
    tags: Vec<String>,
    git_branch: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
struct Test {
    id: u32,
    project_id: u32,
    file_path: String,
    framework: Option<String>,
    status: Option<String>,
    last_run: Option<u64>,
    created_at: u64,
}

#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
struct ProjectPort {
    id: u32,
    project_id: u32,
    port: u32,
    script_name: Option<String>,
    config_source: String,
    last_detected: u64,
    created_at: u64,
}

#[derive(Deserialize, Debug)]
struct ProjaxDatabase {
    projects: Vec<Project>,
    #[serde(default)]
    tests: Vec<Test>,
    #[serde(default)]
    project_ports: Vec<ProjectPort>,
}

struct ProjaxExtension;

impl zed::Extension for ProjaxExtension {
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
            "projax_list" => {
                let db = read_projax_database()?;
                let output = format_project_list(&db);
                Ok(zed::SlashCommandOutput {
                    text: output,
                    sections: Vec::new(),
                })
            },
            "projax_show" => {
                if args.is_empty() {
                    return Err("Usage: /projax_show <project_name>".to_string());
                }
                let project_name = args.join(" ");
                let db = read_projax_database()?;
                let output = format_project_details(&db, &project_name)?;
                Ok(zed::SlashCommandOutput {
                    text: output,
                    sections: Vec::new(),
                })
            },
            "projax_open" => {
                if args.is_empty() {
                    return Err("Usage: /projax_open <project_name>".to_string());
                }
                let project_name = args.join(" ");
                let db = read_projax_database()?;
                let output = format_open_instructions(&db, &project_name)?;
                Ok(zed::SlashCommandOutput {
                    text: output,
                    sections: Vec::new(),
                })
            },
            "projax_run" => {
                if args.len() < 2 {
                    return Err("Usage: /projax_run <project_name> <script_name>".to_string());
                }
                let project_name = &args[0];
                let script_name = args[1..].join(" ");
                let db = read_projax_database()?;
                let output = format_run_instructions(&db, project_name, &script_name)?;
                Ok(zed::SlashCommandOutput {
                    text: output,
                    sections: Vec::new(),
                })
            },
            _ => Err(format!("Unknown command: {}", command.name)),
        }
    }
}

fn read_projax_database() -> Result<ProjaxDatabase, String> {
    let home_dir = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;

    let db_path = format!("{}/.projax/data.json", home_dir);

    let contents = fs::read_to_string(&db_path)
        .map_err(|e| format!("Failed to read projax database at {}: {}", db_path, e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse projax database: {}", e))
}

fn format_project_list(db: &ProjaxDatabase) -> String {
    if db.projects.is_empty() {
        return "# Projax Projects\n\nNo projects found.".to_string();
    }

    let mut output = String::from("# Projax Projects\n\n| Name | Framework | Tests | Ports | Path |\n");
    output.push_str("|------|-----------|-------|-------|------|\n");

    for project in &db.projects {
        let framework = project.framework.as_deref().unwrap_or("-");
        let test_count = db.tests.iter().filter(|t| t.project_id == project.id).count();
        let port_count = db.project_ports.iter().filter(|p| p.project_id == project.id).count();
        let path_short = if project.path.len() > 30 {
            format!("{}...", &project.path[..27])
        } else {
            project.path.clone()
        };

        output.push_str(&format!(
            "| {} | {} | {} | {} | `{}` |\n",
            project.name, framework, test_count, port_count, path_short
        ));
    }

    output
}

fn format_project_details(db: &ProjaxDatabase, project_name: &str) -> Result<String, String> {
    let project = find_project(db, project_name)?;

    let mut output = format!("# {}\n\n", project.name);

    // Basic info
    output.push_str(&format!("**Path:** `{}`\n\n", project.path));

    if let Some(desc) = &project.description {
        output.push_str(&format!("**Description:** {}\n\n", desc));
    }

    if let Some(framework) = &project.framework {
        output.push_str(&format!("**Framework:** {}\n\n", framework));
    }

    if let Some(branch) = &project.git_branch {
        output.push_str(&format!("**Git Branch:** {}\n\n", branch));
    }

    if !project.tags.is_empty() {
        output.push_str(&format!("**Tags:** {}\n\n", project.tags.join(", ")));
    }

    // Tests
    let tests: Vec<_> = db.tests.iter().filter(|t| t.project_id == project.id).collect();
    if !tests.is_empty() {
        output.push_str("## Tests\n\n");
        for test in tests {
            let framework = test.framework.as_deref().unwrap_or("unknown");
            output.push_str(&format!("- `{}` ({})\n", test.file_path, framework));
        }
        output.push('\n');
    }

    // Ports
    let ports: Vec<_> = db.project_ports.iter().filter(|p| p.project_id == project.id).collect();
    if !ports.is_empty() {
        output.push_str("## Configured Ports\n\n");
        for port in ports {
            let script = port.script_name.as_deref().unwrap_or("-");
            output.push_str(&format!("- Port **{}** (from: {})\n", port.port, script));
        }
        output.push('\n');
    }

    // Metadata
    output.push_str(&format!("**Created:** {}\n", format_timestamp(project.created_at)));
    if let Some(last_scanned) = project.last_scanned {
        output.push_str(&format!("**Last Scanned:** {}\n", format_timestamp(last_scanned)));
    }

    Ok(output)
}

fn format_open_instructions(db: &ProjaxDatabase, project_name: &str) -> Result<String, String> {
    let project = find_project(db, project_name)?;

    let output = format!(
        "# Open Project: {}\n\n\
        **Path:** `{}`\n\n\
        ## To open in Zed:\n\n\
        ```bash\n\
        cd {}\n\
        zed .\n\
        ```\n\n\
        Or copy the path to open manually:\n\n\
        ```\n\
        {}\n\
        ```",
        project.name, project.path, project.path, project.path
    );

    Ok(output)
}

fn format_run_instructions(db: &ProjaxDatabase, project_name: &str, script_name: &str) -> Result<String, String> {
    let project = find_project(db, project_name)?;

    let output = format!(
        "# Run Script\n\n\
        **Project:** {}\n\n\
        **Script:** {}\n\n\
        **Path:** `{}`\n\n\
        ## To run this script:\n\n\
        ```bash\n\
        cd {}\n\
        npm run {}\n\
        ```\n\n\
        Or use prx CLI:\n\n\
        ```bash\n\
        prx run {} {}\n\
        ```",
        project.name, script_name, project.path, project.path, script_name, project.name, script_name
    );

    Ok(output)
}

fn find_project<'a>(db: &'a ProjaxDatabase, project_name: &str) -> Result<&'a Project, String> {
    let lower_query = project_name.to_lowercase();

    db.projects.iter()
        .find(|p| p.name.to_lowercase() == lower_query)
        .ok_or_else(|| format!("Project '{}' not found", project_name))
}

fn format_timestamp(timestamp: u64) -> String {
    // Convert seconds since epoch to a readable format
    // For simplicity, just show seconds
    use std::time::{UNIX_EPOCH, Duration};

    let duration = Duration::from_secs(timestamp);
    let system_time = UNIX_EPOCH + duration;

    // Use a simple ISO-like format
    format!("{:?}", system_time)
}

zed::register_extension!(ProjaxExtension);

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_db() -> ProjaxDatabase {
        ProjaxDatabase {
            projects: vec![
                Project {
                    id: 1,
                    name: "projax".to_string(),
                    path: "/Users/jose/Developer/projax".to_string(),
                    description: Some("Project management tool".to_string()),
                    framework: Some("npm".to_string()),
                    last_scanned: Some(1765699010),
                    created_at: 1765699010,
                    tags: vec!["cli".to_string(), "nodejs".to_string()],
                    git_branch: Some("main".to_string()),
                },
                Project {
                    id: 2,
                    name: "test-project".to_string(),
                    path: "/home/user/test-project".to_string(),
                    description: None,
                    framework: None,
                    last_scanned: None,
                    created_at: 1765699000,
                    tags: vec![],
                    git_branch: None,
                },
            ],
            tests: vec![
                Test {
                    id: 1,
                    project_id: 1,
                    file_path: "packages/api/test.ts".to_string(),
                    framework: Some("jest".to_string()),
                    status: None,
                    last_run: None,
                    created_at: 1765699010,
                },
                Test {
                    id: 2,
                    project_id: 1,
                    file_path: "packages/cli/test.ts".to_string(),
                    framework: Some("jest".to_string()),
                    status: None,
                    last_run: None,
                    created_at: 1765699010,
                },
            ],
            project_ports: vec![
                ProjectPort {
                    id: 1,
                    project_id: 1,
                    port: 3000,
                    script_name: Some("dev".to_string()),
                    config_source: "package.json".to_string(),
                    last_detected: 1765699010,
                    created_at: 1765699010,
                },
                ProjectPort {
                    id: 2,
                    project_id: 1,
                    port: 8080,
                    script_name: Some("api".to_string()),
                    config_source: "package.json".to_string(),
                    last_detected: 1765699010,
                    created_at: 1765699010,
                },
            ],
        }
    }

    #[test]
    fn test_project_deserialization() {
        let json = r#"{
            "id": 1,
            "name": "projax",
            "path": "/Users/jose/Developer/projax",
            "description": "Project management tool",
            "framework": "npm",
            "last_scanned": 1765699010,
            "created_at": 1765699010,
            "tags": ["cli", "nodejs"],
            "git_branch": "main"
        }"#;

        let project: Project = serde_json::from_str(json).expect("Failed to parse Project");

        assert_eq!(project.id, 1);
        assert_eq!(project.name, "projax");
        assert_eq!(project.path, "/Users/jose/Developer/projax");
        assert_eq!(project.description, Some("Project management tool".to_string()));
        assert_eq!(project.framework, Some("npm".to_string()));
        assert_eq!(project.tags.len(), 2);
        assert_eq!(project.git_branch, Some("main".to_string()));
    }

    #[test]
    fn test_format_project_list() {
        let db = create_test_db();
        let output = format_project_list(&db);

        assert!(output.contains("# Projax Projects"));
        assert!(output.contains("projax"));
        assert!(output.contains("test-project"));
        assert!(output.contains("npm"));
        assert!(output.contains("2")); // 2 tests
        assert!(output.contains("2")); // 2 ports
    }

    #[test]
    fn test_find_project_case_insensitive() {
        let db = create_test_db();

        let result = find_project(&db, "projax");
        assert!(result.is_ok());
        assert_eq!(result.unwrap().id, 1);

        let result = find_project(&db, "PROJAX");
        assert!(result.is_ok());
        assert_eq!(result.unwrap().id, 1);

        let result = find_project(&db, "non-existent");
        assert!(result.is_err());
    }

    #[test]
    fn test_format_project_details() {
        let db = create_test_db();
        let output = format_project_details(&db, "projax").expect("Failed to format");

        assert!(output.contains("# projax"));
        assert!(output.contains("/Users/jose/Developer/projax"));
        assert!(output.contains("Project management tool"));
        assert!(output.contains("npm"));
        assert!(output.contains("main"));
        assert!(output.contains("## Tests"));
        assert!(output.contains("## Configured Ports"));
        assert!(output.contains("3000"));
        assert!(output.contains("8080"));
    }

    #[test]
    fn test_format_open_instructions() {
        let db = create_test_db();
        let output = format_open_instructions(&db, "projax").expect("Failed to format");

        assert!(output.contains("# Open Project: projax"));
        assert!(output.contains("/Users/jose/Developer/projax"));
        assert!(output.contains("zed ."));
    }

    #[test]
    fn test_format_run_instructions() {
        let db = create_test_db();
        let output = format_run_instructions(&db, "projax", "dev").expect("Failed to format");

        assert!(output.contains("# Run Script"));
        assert!(output.contains("projax"));
        assert!(output.contains("dev"));
        assert!(output.contains("npm run dev"));
        assert!(output.contains("prx run projax dev"));
    }
}
