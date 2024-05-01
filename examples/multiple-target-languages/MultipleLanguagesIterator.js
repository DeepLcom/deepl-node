import * as deepl from 'deepl-node';
import 'dotenv/config';

const authKey = process.env.AUTH_KEY;
const translator = new deepl.Translator(authKey);
//Enter some language codes. P is given an intentionally incorrect code for error reporting purposes
var languageCodes = ['BG', 'DE', 'IT', 'ES', 'P'];
var translatedWebpages = [];

//looping through all the languages codes
for (var i = 0; i < languageCodes.length; i++) {
    var languageCode = languageCodes[i];

    (async () => {
        try {
            const result = await translator.translateText(
                '<!DOCTYPE html> <html> <body style ="background-color: #f5f6f8; align-items: center;"> <h1 id="header_1" style="font-family:sans-serif; text-align: center; font-weight: 600; ">Hello Good Afternoon!</h1> <p id = "paragraph_1" style="font-family:sans-serif; text-align: center; font-weight: 600;margin-bottom: 0px;">Translate this page to your preferred language.</p> <p style="margin-top: 40px;"> <a href="index.html" target="_blank" style = "background-color: #0f2b46; border: 1px solid #0f2b46; color: #ffffff; border-radius: 3px; margin: 10px; padding: 12px 24px; cursor: pointer; text-decoration: none !important;">English</a> <a href="DeepLGerman.html" target="_blank" style = "background-color: #0f2b46; border: 1px solid #0f2b46; color: #ffffff; border-radius: 3px; margin: 10px; padding: 12px 24px; cursor: pointer; text-decoration: none !important;">German</a> <a href="DeepLSpanish.html" target="_blank" style = "background-color: #0f2b46; border: 1px solid #0f2b46; color: #ffffff; border-radius: 3px; margin: 10px; padding: 12px 24px; cursor: pointer; text-decoration: none !important;">Spanish</a> <a href="DeepLBulgarian.html" target="_blank" style = "background-color: #0f2b46; border: 1px solid #0f2b46; color: #ffffff; border-radius: 3px; margin: 10px; padding: 12px 24px; cursor: pointer; text-decoration: none !important;">Bulgarian</a> <a href="DeepLItalian.html" target="_blank" style = "background-color: #0f2b46; border: 1px solid #0f2b46; color: #ffffff; border-radius: 3px; margin: 10px; padding: 12px 24px; cursor: pointer; text-decoration: none !important;">Italian</a> </p> </body> </html>',
                null,
                languageCode,
                { tagHandling: 'html' },
            );
            translatedWebpages[i] = result.text;
            //logging the output of each translation
            console.log(translatedWebpages[i] + '\n');
        } catch (error) {
            //logging the error in a case of failure
            console.log('Following error is for Language Code: ' + languageCode + '\n');
            console.log(error);
        }
    })();
}
