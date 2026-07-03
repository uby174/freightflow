import { NextResponse } from "next/server";
import { nextDepartures } from "@/lib/shipdate";

export async function GET() {
  const departures = nextDepartures(3).map((d) => ({
    id: d.id,
    departsAt: d.departsAt.getTime(),
    cutoffAt: d.cutoffAt.getTime(),
    label: d.label,
    port: d.port,
    etaDouala: d.etaDouala.getTime(),
  }));
  return NextResponse.json({ departures });
}
