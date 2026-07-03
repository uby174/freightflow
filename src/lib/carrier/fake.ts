import { randomUUID } from "node:crypto";
import { DEMO_EVENT_GAP_MS } from "../config";
import type { CarrierAdapter, RawCarrierEvent } from "./types";

// The simulated partner. Its raw event texts DELIBERATELY contain carrier,
// vessel, and local-agent names so the sanitization pipeline is proven to
// scrub them — exactly what a real partner feed will look like.
export class FakeCarrierAdapter implements CarrierAdapter {
  name = "TransGlobal Express";

  async createShipment(_orderId: number) {
    const gap = DEMO_EVENT_GAP_MS;
    const plannedEvents: RawCarrierEvent[] = [
      {
        status: "PICKED_UP",
        text: "Shipment received at TransGlobal Express depot Kehl, ref TGE-DE-88123",
        offsetMs: gap * 1,
      },
      {
        status: "LOADED",
        text: "Container MSCU1234567 stuffed at TGE hub - booking TransGlobal 4711",
        offsetMs: gap * 2,
      },
      {
        status: "DEPARTED",
        text: "Vessel MSC AMANDA departed Le Havre - TransGlobal Express ocean leg",
        offsetMs: gap * 3,
      },
      {
        status: "AT_SEA",
        text: "In transit via MSC network - ETA Douala confirmed",
        offsetMs: gap * 4,
      },
      {
        status: "ARRIVED",
        text: "Discharged at Douala International Terminal - agent TGE Cameroun SARL",
        offsetMs: gap * 5,
      },
      {
        status: "CUSTOMS",
        text: "Customs clearance in progress - Douala - broker TGE Cameroun SARL",
        offsetMs: gap * 6,
      },
      {
        status: "OUT_FOR_DELIVERY",
        text: "Out for delivery with Express Union courier, Douala",
        offsetMs: gap * 7,
      },
      {
        status: "DELIVERED",
        text: "Delivered - POD signed - TransGlobal Express thanks you",
        offsetMs: gap * 8,
      },
    ];
    return {
      carrierTrackingNumber: `FAKE-${randomUUID().slice(0, 12).toUpperCase()}`,
      plannedEvents,
    };
  }
}

export function getCarrier(): CarrierAdapter {
  // Registry: swap in the real partner adapter here when signed.
  return new FakeCarrierAdapter();
}
