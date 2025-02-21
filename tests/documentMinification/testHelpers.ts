import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';

const MINIFIABLE_FILE_SIZE = 90000000;

export const createMinifiableTestDocument = (
    testFilePath: string,
    tempZipContentDirectory: string,
    outputDirectory: string,
): string => {
    if (!fs.existsSync(testFilePath)) {
        throw new Error(`Test file does not exist: ${testFilePath}`);
    }
    const zipExtractor = new AdmZip(testFilePath);
    zipExtractor.extractAllTo(tempZipContentDirectory);

    // Create a placeholder file of size 90 MB
    const characters =
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+=-<,>.?:';
    const createText = Array.from(
        { length: MINIFIABLE_FILE_SIZE },
        () => characters[Math.floor(Math.random() * characters.length)],
    ).join('');
    fs.writeFileSync(path.join(tempZipContentDirectory, 'placeholder_image.png'), createText);

    const fileName = path.basename(testFilePath);
    const outputFilePath = path.join(outputDirectory, fileName);
    const zipCombiner = new AdmZip();
    zipCombiner.addLocalFolder(tempZipContentDirectory);
    zipCombiner.writeZip(outputFilePath);
    return outputFilePath;
};
