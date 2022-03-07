import * as deepl from 'deepl-node';

const authKey = process.env['DEEPL_AUTH_KEY'];
if (authKey === undefined) throw new Error('DEEPL_AUTH_KEY environment variable not defined');
const serverUrl = process.env["DEEPL_SERVER_URL"]
const translator = new deepl.Translator(authKey, {serverUrl: serverUrl});

(async () => {
    try {
        console.log(await translator.getUsage());

        const targetLang: deepl.TargetLanguageCode = 'fr';

        const result: deepl.TextResult = await translator.translateText('Hello, world!', null, targetLang);

        console.log(result.text); // Bonjour, le monde !
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})();
