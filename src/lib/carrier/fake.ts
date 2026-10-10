import { randomUUID } from "node:crypto";
import { DEMO_EVENT_GAP_MS } from "../config";
import type { CarrierAdapter, RawCarrierEvent } from "./types";
import { getTenant, bookingLane } from "@/tenant";

const T = getTenant();
const M = T.mockCarrier;
const CITY = bookingLane(T).destCities[0];
const PORT = bookingLane(T).port;

// The simulated partner. Its raw event texts DELIBERATELY contain carrier,
// vessel, and local-agent names so the sanitization pipeline is proven to
// scrub them — exactly what a real partner feed will look like.
export class FakeCarrierAdapter implements CarrierAdapter {
  name = M.name;

  async createShipment(_orderId: number) {
    const gap = DEMO_EVENT_GAP_MS;
    const plannedEvents: RawCarrierEvent[] = [
      {
        status: "PICKED_UP",
        text: `Shipment received at ${M.name} depot ${M.depot}, ref TGE-DE-88123`,
        offsetMs: gap * 1,
      },
      {
        status: "LOADED",
        text: "Container MSCU1234567 stuffed at TGE hub - booking TransGlobal 4711",
        offsetMs: gap * 2,
      },
      {
        status: "DEPARTED",
        text: `Vessel ${M.vessel} departed ${PORT} - ${M.name} ocean leg`,
        offsetMs: gap * 3,
      },
      {
        status: "AT_SEA",
        text: `In transit via MSC network - ETA ${CITY} confirmed`,
        offsetMs: gap * 4,
      },
      {
        status: "ARRIVED",
        text: `Discharged at ${CITY} International Terminal - agent ${M.localAgent}`,
        offsetMs: gap * 5,
      },
      {
        status: "CUSTOMS",
        text: `Customs clearance in progress - ${CITY} - broker ${M.localAgent}`,
        offsetMs: gap * 6,
      },
      {
        status: "OUT_FOR_DELIVERY",
        text: `Out for delivery with ${M.courier} courier, ${CITY}`,
        offsetMs: gap * 7,
      },
      {
        status: "DELIVERED",
        text: `Delivered - POD signed - ${M.name} thanks you`,
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
