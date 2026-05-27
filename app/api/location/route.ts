import { NextResponse } from "next/server";

import type { GeoIpResponse } from "@/lib/types/location";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");

  if (!ip) {
    return NextResponse.json({ error: "IP address is required" }, { status: 400 });
  }

  try {
    const baseUrl = process.env.GEOIP_API_URL;
    const url = `${baseUrl}${ip}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from GeoIP API" }, { status: 500 });
    }
    
    const data: GeoIpResponse = await response.json();
    
    if (data.latitude !== undefined && data.longitude !== undefined) {
      return NextResponse.json({ lat: data.latitude, lng: data.longitude });
    }
    
    return NextResponse.json({ error: "Coordinates not found in response" }, { status: 500 });
  } catch (error) {
    console.error("[Location API Route] Failed:", error);
    return NextResponse.json({ error: "Failed to get coordinates" }, { status: 500 });
  }
}
