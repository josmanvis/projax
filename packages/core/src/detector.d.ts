export interface TestFramework {
    name: string;
    configFiles: string[];
    testPatterns: RegExp[];
    testDirs: string[];
}
export declare const FRAMEWORKS: TestFramework[];
export declare function detectTestFramework(projectPath: string): string | null;
export declare function isTestFile(filePath: string, detectedFramework?: string | null): boolean;
/**
 * Detect the main framework/library used in a project
 * Returns null if no framework is detected
 */
export declare function detectProjectFramework(projectPath: string): string | null;
