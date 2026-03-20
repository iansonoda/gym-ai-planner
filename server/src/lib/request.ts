import type { Request } from "express";

export function getRequestIp(req: Request) {
    const forwardedFor = req.header("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || "unknown";
    }

    if (typeof req.ip === "string" && req.ip.length > 0) {
        return req.ip;
    }

    if (typeof req.socket.remoteAddress === "string" && req.socket.remoteAddress.length > 0) {
        return req.socket.remoteAddress;
    }

    return "unknown";
}
