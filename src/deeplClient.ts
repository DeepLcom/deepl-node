// Copyright 2025 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import { Translator, checkStatusCode } from './translator';
import { SourceLanguageCode, DeepLClientOptions, WriteResult } from './types';
import { parseWriteResultArray } from './parsing';
import { appendTextsAndReturnIsSingular } from './utils';

export enum WritingStyle {
    ACADEMIC = 'academic',
    BUSINESS = 'business',
    CASUAL = 'casual',
    DEFAULT = 'default',
    PREFER_ACADEMIC = 'prefer_academic',
    PREFER_BUSINESS = 'prefer_business',
    PREFER_CASUAL = 'prefer_casual',
    PREFER_SIMPLE = 'prefer_simple',
    SIMPLE = 'simple',
}

export enum WritingTone {
    CONFIDENT = 'confident',
    DEFAULT = 'default',
    DIPLOMATIC = 'diplomatic',
    ENTHUSIASTIC = 'enthusiastic',
    FRIENDLY = 'friendly',
    PREFER_CONFIDENT = 'prefer_confident',
    PREFER_DIPLOMATIC = 'prefer_diplomatic',
    PREFER_ENTHUSIASTIC = 'prefer_enthusiastic',
    PREFER_FRIENDLY = 'prefer_friendly',
}

export class DeepLClient extends Translator {
    constructor(authKey: string, options: DeepLClientOptions = {}) {
        super(authKey, options);
    }

    async rephraseText<T extends string | string[]>(
        texts: T,
        targetLang: SourceLanguageCode | null,
        writingStyle?: string | null,
        tone?: string | null,
    ): Promise<T extends string ? WriteResult : WriteResult[]> {
        const data = new URLSearchParams();
        if (targetLang) {
            data.append('target_lang', targetLang);
        }

        if (writingStyle) {
            data.append('writing_style', writingStyle);
        }

        if (tone) {
            data.append('tone', tone);
        }

        const singular = appendTextsAndReturnIsSingular(data, texts);
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'POST',
            '/v2/write/rephrase',
            { data },
        );

        await checkStatusCode(statusCode, content);
        const writeResults = parseWriteResultArray(content);
        return (singular ? writeResults[0] : writeResults) as T extends string
            ? WriteResult
            : WriteResult[];
    }
}
