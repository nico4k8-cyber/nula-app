/**
 * Payment API — ЮКасса integration
 * Self-employed (самозанятый) flow
 *
 * Feature flag: PAYMENTS_ENABLED=true activates real payments
 * When false — returns mock success for testing UI
 */

import { createClient } from "@supabase/supabase-js";

export const config = { runtime: 'edge' };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PLANS = {
  month: { amount: 49900, label: "Pro — 1 месяц", period_months: 1 },   // 499₽ в копейках
  year:  { amount: 238800, label: "Pro — 12 месяцев", period_months: 12 }, // 1990₽/год = 199₽/мес
  promo: { amount: 9900,  label: "Pro — первый месяц (скидка)", period_months: 1 }, // 99₽
};

async function createYooKassaPayment({ planId, userId, userEmail, returnUrl }) {
  const shopId  = process.env.YOKASSA_SHOP_ID;
  const secret  = process.env.YOKASSA_SECRET_KEY;

  if (!shopId || !secret) throw new Error("ЮКасса не настроена");

  const plan = PLANS[planId];
  if (!plan) throw new Error("Unknown plan: " + planId);

  const idempotenceKey = `${userId}-${planId}-${Date.now()}`;

  const body = {
    amount: { value: (plan.amount / 100).toFixed(2), currency: "RUB" },
    confirmation: {
      type: "redirect",
      return_url: returnUrl || "https://nula.app/",
    },
    capture: true,
    description: plan.label,
    metadata: { user_id: userId, plan_id: planId },
    receipt: {
      customer: { email: userEmail },
      items: [{
        description: plan.label,
        quantity: "1.00",
        amount: { value: (plan.amount / 100).toFixed(2), currency: "RUB" },
        vat_code: 1,
        payment_mode: "full_payment",
        payment_subject: "service",
      }],
    },
  };

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
      "Authorization": "Basic " + btoa(`${shopId}:${secret}`),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("ЮКасса error: " + err);
  }
  return res.json();
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    // ── Создать платёж ───────────────────────────────────────────────────────
    if (action === "create_payment") {
      const { planId, userId, userEmail, returnUrl } = body;

      const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";

      if (!paymentsEnabled) {
        // Mock mode: просто возвращаем фейковый confirmation_url
        return new Response(JSON.stringify({
          ok: true,
          mock: true,
          confirmation_url: `${returnUrl || "/"}?payment=mock_success&plan=${planId}`,
          plan_id: planId,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payment = await createYooKassaPayment({ planId, userId, userEmail, returnUrl });

      return new Response(JSON.stringify({
        ok: true,
        payment_id: payment.id,
        confirmation_url: payment.confirmation.confirmation_url,
        plan_id: planId,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Webhook от ЮКасса (payment.succeeded) ────────────────────────────────
    if (action === "webhook") {
      const { event, object: payment } = body;
      if (event !== "payment.succeeded") {
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      const userId  = payment.metadata?.user_id;
      const planId  = payment.metadata?.plan_id;
      const plan    = PLANS[planId];

      if (!userId || !plan) {
        console.error("Webhook: missing user_id or plan", payment.metadata);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      // Set premium expiry in Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.period_months);

      await supabase.from("profiles").upsert({
        id: userId,
        is_premium: true,
        premium_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`[payment] user ${userId} upgraded to Pro (${planId}), expires ${expiresAt}`);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // ── Проверить статус premium (при загрузке приложения) ───────────────────
    if (action === "check_premium") {
      const { userId } = body;
      if (!userId) return new Response(JSON.stringify({ isPremium: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data } = await supabase
        .from("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", userId)
        .single();

      const isPremium = data?.is_premium &&
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());

      return new Response(JSON.stringify({ isPremium: !!isPremium, expires_at: data?.premium_expires_at }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[payment]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
