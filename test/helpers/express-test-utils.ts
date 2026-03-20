import { EventEmitter } from "node:events";
import type { Express } from "express";
import { createRequest, createResponse } from "node-mocks-http";

interface InvokeRequestOptions {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
}

interface InvokeResponse {
    status: number;
    body: unknown;
}

function parseBody(data: unknown) {
    if (typeof data !== "string") {
        return data;
    }

    if (data.length === 0) {
        return undefined;
    }

    try {
        return JSON.parse(data);
    } catch {
        return data;
    }
}

export async function invokeExpressRoute(
    app: Express,
    { method, url, headers = {}, body }: InvokeRequestOptions,
): Promise<InvokeResponse> {
    const req = createRequest({
        method,
        url,
        headers,
    });
    const res = createResponse({ eventEmitter: EventEmitter });

    if (body !== undefined) {
        req.body = body;
    }

    await new Promise<void>((resolve, reject) => {
        res.on("finish", resolve);
        res.on("end", resolve);

        app.handle(req, res, (error: unknown) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });

    return {
        status: res.statusCode,
        body: parseBody(res._getData()),
    };
}
