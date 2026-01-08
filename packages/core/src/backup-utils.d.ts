/**
 * Create a backup of the PROJAX database
 * @param outputPath Directory where the backup should be created
 * @returns Path to the created backup file
 */
export declare function createBackup(outputPath: string): Promise<string>;
/**
 * Restore PROJAX database from a backup file
 * @param backupPath Path to the .pbz backup file
 */
export declare function restoreBackup(backupPath: string): Promise<void>;
/**
 * Validate a backup file without restoring
 * @param backupPath Path to the .pbz backup file
 * @returns true if valid, throws error if invalid
 */
export declare function validateBackup(backupPath: string): Promise<boolean>;
