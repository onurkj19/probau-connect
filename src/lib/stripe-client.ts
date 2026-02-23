import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn("VITE_STRIPE_PUBLISHABLE_KEY not set");
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

export async function createCheckoutSession(planType: "basic" | "pro", token: string) {
  const res = await fetch("/api/stripe/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const details = err.details ? `: ${err.details}` : "";
    throw new Error((err.error || err.message || "Failed to create checkout session") + details);
  }

  const { url } = await res.json();

  // Redirect to Stripe Checkout
  if (url) {
    window.location.href = url;
    return;
  }

  throw new Error("Checkout URL missing in API response");
}

export async function createPortalSession(token: string) {
  const res = await fetch("/api/stripe/create-portal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const details = err.details ? `: ${err.details}` : "";
    throw new Error((err.error || err.message || "Failed to create portal session") + details);
  }

  const { url } = await res.json();

  if (url) {
    window.location.href = url;
    return;
  }

  throw new Error("Portal URL missing in API response");
}

export async function submitOffer(
  projectId: string,
  content: string,
  token: string,
): Promise<{ success: boolean; offerCountThisMonth: number; limit: number | null; error?: string }> {
  const res = await fetch("/api/offers/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, content }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      offerCountThisMonth: data.used || 0,
      limit: data.limit || null,
      error: data.error,
    };
  }

  return {
    success: true,
    offerCountThisMonth: data.offerCountThisMonth,
    limit: data.limit,
  };
}
