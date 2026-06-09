import { redirect } from "next/navigation";
import BillingPanel from "@/components/dashboard/billing-panel";
import { getOwnerRestaurant, mapRestaurantMenus } from "@/lib/restaurant-documents";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardBillingPage(
  props: PageProps<"/dashboard/billing">,
) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const { data: restaurant, error: restaurantError } = await getOwnerRestaurant(
    supabase,
    user.id,
  );

  if (restaurantError) {
    throw new Error(restaurantError.message);
  }

  if (!restaurant) {
    redirect("/onboarding");
  }

  const menus = mapRestaurantMenus([restaurant]);

  const nowStr = new Date().toISOString();
  // 1. Fetch active subscription info from Supabase
  const { data: activeSub, error } = await supabase
    .from("subscriptions")
    .select("plan, status, ended_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("ended_at", "now()")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Fetch transaction history log
  const { data: rawHistory } = await supabase
    .from("subscriptions")
    .select("id, created_at, plan, price, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activePlan = activeSub ? (activeSub.plan as "monthly" | "yearly") : "free";
  const endedAt = activeSub?.ended_at
    ? new Date(activeSub.ended_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const transactions = (rawHistory ?? []).map((sub) => {
    const dateStr = new Date(sub.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    const formattedPrice = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(sub.price);

    const year = new Date(sub.created_at).getFullYear();
    const invoiceNo = `INV-${year}-${sub.id.substring(0, 8).toUpperCase()}`;

    let status: "Paid" | "Pending" | "Failed" = "Failed";
    if (sub.status === "active") status = "Paid";
    else if (sub.status === "pending") status = "Pending";

    return {
      id: sub.id,
      date: dateStr,
      invoiceNo,
      planName: `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} Subscription`,
      amount: formattedPrice,
      status,
    };
  });

  return (
    <BillingPanel
      initialBusinessName={restaurant.restaurant_name}
      initialMenus={menus}
      activePlan={activePlan}
      endedAt={endedAt}
      transactions={transactions}
    />
  );
}
