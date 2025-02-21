import * as fs from 'fs';
import * as path from 'path';
/**
 * This class is necessary because some fs library methods and/or params are not available in older versions of node, such as v12
 *
 * Docs for v12: https://nodejs.org/docs/latest-v12.x/api/fs.html#fspromisesreaddirpath-options
 */
export class FsHelper {
    public static readdirSyncRecursive(filepath: string): string[] {
        if (!fs.existsSync(filepath)) {
            throw new Error(`Error: no such file or directory, ${filepath}`);
        }

        if (!fs.statSync(filepath).isDirectory()) {
            throw new Error(`Error: not a directory, ${filepath}`);
        }

        const results: string[] = [];
        const filesAndDirs = fs.readdirSync(filepath);

        filesAndDirs.forEach((fileOrDir) => {
            const isDir = fs.statSync(path.join(filepath, fileOrDir)).isDirectory();
            if (isDir) {
                const dir = fileOrDir;
                const dirList = this.readdirSyncRecursive(path.join(filepath, fileOrDir));
                const subList = dirList.map((subpath) => `${dir}/${subpath}`);
                results.push(dir, ...subList);
            } else {
                const file = fileOrDir;
                results.push(file);
            }
        });

        return results;
    }

    public static removeSyncRecursive(filepath: string): void {
        if (!fs.existsSync(filepath)) {
            throw new Error(`Error: no such file or directory, ${filepath}`);
        }

        const stat = fs.statSync(filepath);
        if (!stat.isDirectory()) {
            fs.unlinkSync(filepath);
        } else {
            // Note: it's okay to use the native readdirSync here because we do not need the recursive functionality
            const filesAndDirs = fs.readdirSync(filepath);
            filesAndDirs.forEach((file) => {
                this.removeSyncRecursive(path.join(filepath, file));
            });
            fs.rmdirSync(filepath);
        }
    }
}
