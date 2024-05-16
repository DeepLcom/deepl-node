
// Example of translating HTML content into multiple target languages
import * as deepl from 'deepl-node';
import 'dotenv/config';

const authKey = process.env.AUTH_KEY;
const translator = new deepl.Translator(authKey);
// Enter some language codes. P is given as an intentionally incorrect code for error reporting purposes.
var languageCodes = ['BG', 'DE', 'IT', 'ES', 'P'];

// Applying the translator to each language code. Using Promises to iterate through languages in parallel. Await waits for a response before conducting further logic on output.
let translatePromises = languageCodes.map((code) =>
    translator
        .translateDocument("index.html", "index_" + code + ".html", "en", code)
        .catch((error) => {
            if (error.documentHandle) {
                const handle = error.documentHandle;
                console.log(
                `Document ID: ${handle.documentId}, ` +
                    `Document key: ${handle.documentKey}` 
                    + `For Language Code: ` + code
                );
            } 
            else {
                console.log(`For Language Code: ` + code + ` error occurred during document upload. ${error}`);
            }
        }),
);
await Promise.all(translatePromises);


