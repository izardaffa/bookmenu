import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    console.log("QRISLY WEBHOOK HIT");
    const body = await request.json();
    console.log("Webhook body:", body);

    // QRISly callback fields
    const order_id = body.reference_id || body.order_id || body.external_id;
    const payment_status = body.status || body.payment_status || body.transaction_status;
    const amount = body.amount || body.gross_amount || body.price;

    if (!order_id || !payment_status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Process only subscription orders
    if (!order_id.startsWith("SUB_")) {
      return NextResponse.json({ message: "Not a subscription order" });
    }

    const parts = order_id.split("_");
    let userId = parts[1];
    const plan = parts[2];

    if (!userId || !plan) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    // Decode base64url UUID back to standard UUID
    if (userId.length === 22) {
      try {
        const hexBack = Buffer.from(userId, "base64url").toString("hex");
        userId = [
          hexBack.slice(0, 8),
          hexBack.slice(8, 12),
          hexBack.slice(12, 16),
          hexBack.slice(16, 20),
          hexBack.slice(20),
        ].join("-");
      } catch (e) {
        console.error("Failed to decode user UUID from base64url:", e);
        return NextResponse.json(
          { error: "Invalid user ID encoding in order ID" },
          { status: 400 }
        );
      }
    }

    const isSuccess =
      payment_status === "success" ||
      payment_status === "settlement" ||
      payment_status === "paid" ||
      payment_status === "Success" ||
      payment_status === "SUCCESS";

    if (isSuccess) {
      const supabase = createAdminClient();

      const startedAt = new Date();
      const endedAt = new Date();
      if (plan === "monthly") {
        endedAt.setDate(endedAt.getDate() + 30);
      } else if (plan === "yearly") {
        endedAt.setDate(endedAt.getDate() + 365);
      }

      // Check if subscription already exists to avoid duplication
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("plan", plan)
        .eq("status", "active")
        .gt("ended_at", startedAt.toISOString())
        .limit(1)
        .maybeSingle();

      if (!existingSub) {
        // 1. Create subscription record
        const { error: subError } = await supabase.from("subscriptions").insert({
          user_id: userId,
          plan: plan,
          price: amount ? parseFloat(amount) : (plan === "monthly" ? 9000 : 99000),
          status: "active",
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
        });

        if (subError) {
          console.error("Error creating subscription record:", subError);
          return NextResponse.json(
            { error: "Failed to record subscription" },
            { status: 500 },
          );
        }

        // 2. Initialize or reset usage tracking limits
        const { data: existingUsage, error: checkUsageError } = await supabase
          .from("subscription_usages")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (checkUsageError) {
          console.error("Error checking subscription usage:", checkUsageError);
        }

        if (existingUsage) {
          await supabase
            .from("subscription_usages")
            .update({
              pdf_upload: 0,
              qr_scan: 0,
            })
            .eq("user_id", userId);
        } else {
          await supabase.from("subscription_usages").insert({
            user_id: userId,
            pdf_upload: 0,
            qr_scan: 0,
          });
        }

        // Mark other subscriptions as canceled/inactive if they exist
        await supabase
          .from("subscriptions")
          .update({ status: "inactive" })
          .eq("user_id", userId)
          .eq("status", "active")
          .not("started_at", "eq", startedAt.toISOString());

        console.log(`Successfully recorded subscription for user ${userId}: ${plan}`);
      } else {
        console.log(`Subscription already exists for user ${userId}: ${plan}`);
      }
    } else if (
      payment_status === "cancel" ||
      payment_status === "expire" ||
      payment_status === "deny" ||
      payment_status === "failed" ||
      payment_status === "FAILED"
    ) {
      const supabase = createAdminClient();
      // Record payment failure in subscriptions log
      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: plan,
        price: amount ? parseFloat(amount) : (plan === "monthly" ? 9000 : 99000),
        status: payment_status.toLowerCase(),
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      });
      console.log(`Failed subscription payment for user ${userId}: ${payment_status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QRISly webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
