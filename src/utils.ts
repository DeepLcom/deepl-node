// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import loglevel from 'loglevel';

const logger = loglevel.getLogger("deepl");

function concatLoggingArgs(args?: object): string {
    let detail = ""
    if (args) {
        for (const [key, value] of Object.entries(args)) {
            detail += `, ${key} = ${value}`;
        }
    }
    return detail;
}

export function logDebug(message: string, args?: object) {
    logger.debug(message + concatLoggingArgs(args));
}

export function logInfo(message: string, args?: object) {
    logger.info(message + concatLoggingArgs(args));
}

/**
 * Converts contents of given stream to a Buffer.
 * @private
 */
export async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    })
}

/**
 * Converts contents of given stream to a string using UTF-8 encoding.
 * @private
 */
export async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    return (await streamToBuffer(stream)).toString('utf8');
}

// Wrap setTimeout() with Promise
export const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Returns true if the given argument is a string.
 * @param arg Argument to check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString(arg: any): arg is string {
    return typeof arg === "string"
}
