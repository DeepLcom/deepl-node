import * as deepl from 'deepl-node';

const authKey = process.env['DEEPL_AUTH_KEY'];
if (authKey === undefined) throw new Error('DEEPL_AUTH_KEY environment variable not defined');
const serverUrl = process.env["DEEPL_SERVER_URL"]
const translator = new deepl.Translator(authKey, {serverUrl: serverUrl});

(async () => {
    const targetLang: deepl.TargetLanguageCode = 'fr';
    const results = await translator.translateText(
        ['Hello, world!', 'How are you?'], null, targetLang);
    results.map((result: deepl.TextResult) => {
        console.log(result.text); // Bonjour, le monde !
    });
})();
