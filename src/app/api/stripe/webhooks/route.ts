import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhooks – Handles Stripe webhook events
 * Manages subscription lifecycle: creation, updates, cancellations
 */
export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;

                if (userId && session.subscription) {
                    // Get subscription details
                    const subscription = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    );

                    await supabase
                        .from("profiles")
                        .update({
                            is_pro: true,
                            stripe_subscription_id: subscription.id,
                            pro_until: new Date(
                                (subscription as any).current_period_end * 1000
                            ).toISOString(),
                        })
                        .eq("id", userId);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Find user by Stripe customer ID
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (profile) {
                    const isActive = ["active", "trialing"].includes(subscription.status);
                    await supabase
                        .from("profiles")
                        .update({
                            is_pro: isActive,
                            pro_until: isActive
                                ? new Date(
                                    (subscription as any).current_period_end * 1000
                                ).toISOString()
                                : null,
                        })
                        .eq("id", profile.id);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (profile) {
                    await supabase
                        .from("profiles")
                        .update({
                            is_pro: false,
                            stripe_subscription_id: null,
                            pro_until: null,
                        })
                        .eq("id", profile.id);
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Webhook processing error:", err);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
