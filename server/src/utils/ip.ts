import type { Request } from "express";
import geoip from "geoip-lite";

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp.trim();
  }
  
  return req.ip || (req as any).socket?.remoteAddress || "unknown";
}

export function isIpFromCuba(ip: string): boolean {
  if (!ip || ip === "unknown") {
    return true;
  }

  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost" || ip === "::ffff:127.0.0.1") {
    return true;
  }

  if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return true;
  }

  if (ip.startsWith("::ffff:")) {
    const ipv4 = ip.replace("::ffff:", "");
    if (ipv4.startsWith("192.168.") || ipv4.startsWith("10.") || ipv4.startsWith("172.")) {
      return true;
    }
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
