import type { Request } from "express";
import geoip from "geoip-lite";

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || (req as any).socket?.remoteAddress || "unknown";
}

export function isIpFromCuba(ip: string): boolean {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return true;
  }

  try {
    const geo = geoip.lookup(ip);
    if (!geo) {
      return false;
    }
    return geo.country === "CU";
  } catch (error) {
    console.error("Error looking up IP:", error);
    return false;
  }
}
