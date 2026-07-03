"use client";

import { useEffect, useState } from "react";

export interface DepartureDto {
  id: number;
  departsAt: number;
  cutoffAt: number;
  label: string;
  port: string;
  etaDouala: number;
}

export default function useDepartures(): DepartureDto[] {
  const [departures, setDepartures] = useState<DepartureDto[]>([]);
  useEffect(() => {
    fetch("/api/departures")
      .then((r) => (r.ok ? r.json() : { departures: [] }))
      .then((d) => setDepartures(d.departures ?? []))
      .catch(() => {});
  }, []);
  return departures;
}
