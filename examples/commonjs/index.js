// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

const deepl = require('deepl-node');

const authKey = process.env['DEEPL_AUTH_KEY']
const serverUrl = process.env['DEEPL_SERVER_URL']
const translator = new deepl.Translator(authKey, {serverUrl: serverUrl});

translator.getUsage()
    .then(usage => {
        console.log(usage);
        return translator.translateText('Hello, world!', null, 'fr');
    })
    .then(result => {
        console.log(result.text); // Bonjour, le monde !
    })
    .catch(error => {
        console.error(error)
        process.exit(1);
    });
