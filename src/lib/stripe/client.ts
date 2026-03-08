import Stripe from "stripe";

/**
 * Server-side Stripe client initialization
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key_for_build", {
    apiVersion: "2026-02-25.clover",
    typescript: true,
});
