import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { randomFillSync } from 'crypto';

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

    // Create a placeholder file of size 90 MB filled with random data to avoid compression
    const buffer = new Uint8Array(MINIFIABLE_FILE_SIZE);
    randomFillSync(buffer);
    fs.writeFileSync(path.join(tempZipContentDirectory, 'placeholder_image.png'), buffer);

    const fileName = path.basename(testFilePath);
    const outputFilePath = path.join(outputDirectory, fileName);
    const zipCombiner = new AdmZip();
    zipCombiner.addLocalFolder(tempZipContentDirectory);
    zipCombiner.writeZip(outputFilePath);
    return outputFilePath;
};

export const verifyDocumentIsTranslated = (inputFilePath: string, outputFilePath: string): void => {
    // Extract and verify the output contains translated content
    // by checking that the content is different from the input
    const inputZip = new AdmZip(inputFilePath);
    const outputZip = new AdmZip(outputFilePath);

    const inputEntries = inputZip.getEntries();
    const outputEntries = outputZip.getEntries();

    // Both should have the same number of files (structure preserved)
    expect(inputEntries.length).toBe(outputEntries.length);

    // Find text-containing files and verify they're different (translated)
    let foundTranslatedContent = false;
    for (const inputEntry of inputEntries) {
        if (inputEntry.entryName.includes('.xml') || inputEntry.entryName.includes('.txt')) {
            const outputEntry = outputZip.getEntry(inputEntry.entryName);
            if (outputEntry) {
                const inputContent = inputEntry.getData().toString('utf8');
                const outputContent = outputEntry.getData().toString('utf8');

                // Content should be different if it contained text to translate
                if (inputContent.length > 0 && inputContent !== outputContent) {
                    foundTranslatedContent = true;
                    break;
                }
            }
        }
    }

    // We should find at least some translated content
    expect(foundTranslatedContent).toBe(true);
};
