// Everything carrier-specific stays behind this interface so the hidden
// partner can be swapped without touching sanitization, tracking, or UI.

export interface RawCarrierEvent {
  status: string; // carrier's own status code
  text: string; // carrier's own description — may contain their brand; ALWAYS sanitized before display
  offsetMs: number; // when this event occurs relative to shipment start
}

export interface CarrierAdapter {
  name: string;
  createShipment(orderId: number): Promise<{
    carrierTrackingNumber: string;
    plannedEvents: RawCarrierEvent[];
  }>;
}

/** Branded milestone keys — the only statuses customers ever see. */
export const MILESTONES = [
  "booked",
  "received_warehouse",
  "consolidated",
  "departed",
  "at_sea",
  "arrived_douala",
  "customs",
  "out_for_delivery",
  "delivered",
] as const;

export type MilestoneKey = (typeof MILESTONES)[number];

/** Map raw carrier status codes → branded milestones. Per-adapter concern. */
export const FAKE_STATUS_MAP: Record<string, MilestoneKey> = {
  PICKED_UP: "received_warehouse",
  DEPOT_IN: "consolidated",
  LOADED: "consolidated",
  DEPARTED: "departed",
  AT_SEA: "at_sea",
  ARRIVED: "arrived_douala",
  CUSTOMS: "customs",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
};
