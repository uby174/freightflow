import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/orders";
import { estimateParcel } from "@/lib/estimator";
import { priceForEstimate } from "@/lib/pricing";
import { distanceFromWarehouse } from "@/lib/distance";
import { PICKUP_MAX_KM } from "@/lib/config";

const bodySchema = z.object({
  locale: z.enum(["fr", "en"]).default("fr"),
  mode: z.enum(["dropoff", "pickup"]),
  contents: z.string().min(3).max(2000),
  departureId: z.number().int().positive(),
  sender: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional().or(z.literal("")),
    whatsapp: z.boolean().default(true),
    address: z.string().max(300).optional(),
    postcode: z.string().max(12).optional(),
    city: z.string().max(80).optional(),
  }),
  receiver: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(30),
    city: z.string().min(2).max(80),
    neighborhood: z.string().max(120).optional(),
    landmark: z.string().max(300).optional(),
  }),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Server-side re-quote — never trust client-computed prices
  let pickupKm: number | undefined;
  if (input.mode === "pickup") {
    const addr = [input.sender.address, input.sender.postcode, input.sender.city]
      .filter(Boolean)
      .join(", ");
    const dist = await distanceFromWarehouse(addr);
    if (!dist || dist.km > PICKUP_MAX_KM) {
      return NextResponse.json({ error: "pickup_unavailable" }, { status: 400 });
    }
    pickupKm = dist.km;
  }

  const estimate = await estimateParcel(input.contents);
  const price = priceForEstimate(estimate, pickupKm);

  const order = await createOrder({
    locale: input.locale,
    mode: input.mode,
    contents: input.contents,
    estimate,
    price,
    departureId: input.departureId,
    sender: { ...input.sender, email: input.sender.email || undefined },
    receiver: input.receiver,
    pickupKm,
  });

  return NextResponse.json({
    code: order.code,
    totalCents: order.totalCents,
  });
}
