import { asc, gt } from "drizzle-orm";
import { db, departures } from "@/db";

export interface DepartureInfo {
  id: number;
  departsAt: Date;
  cutoffAt: Date;
  label: string;
  port: string;
  etaDouala: Date;
}

/** Earliest departure whose cutoff hasn't passed (goods must be at the warehouse by cutoff). */
export function nextDepartures(limit = 3): DepartureInfo[] {
  const now = Date.now();
  return db
    .select()
    .from(departures)
    .where(gt(departures.cutoffAt, new Date(now)))
    .orderBy(asc(departures.departsAt))
    .limit(limit)
    .all()
    .map((d) => ({
      id: d.id,
      departsAt: d.departsAt,
      cutoffAt: d.cutoffAt,
      label: d.label,
      port: d.port,
      etaDouala: d.etaDouala,
    }));
}
