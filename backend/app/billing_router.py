import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from . import models, schemas
from .database import get_db
from .config import settings
from .auth.org_access import require_owner

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/orgs/{org_id}/billing", tags=["billing"])

webhook_router = APIRouter(tags=["webhooks"])

PLAN_PRICE_MAP = {
    "starter": settings.stripe_price_starter,
    "pro": settings.stripe_price_pro,
}


@router.post("/checkout", response_model=schemas.CheckoutResponse)
def create_checkout_session(
    org_id: str,
    payload: schemas.CheckoutRequest,
    membership=Depends(require_owner),
    db: Session = Depends(get_db),
):
    price_id = PLAN_PRICE_MAP.get(payload.plan)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan")

    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org.stripe_customer_id:
        customer = stripe.Customer.create(name=org.name, metadata={"org_id": org.id})
        org.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=org.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url="http://localhost:5173/billing/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="http://localhost:5173/billing/cancel",
        metadata={"org_id": org.id, "plan": payload.plan},
    )

    return schemas.CheckoutResponse(checkout_url=session.url)


@webhook_router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session["metadata"]
        org_id = metadata["org_id"]
        plan = metadata["plan"]
        subscription_id = session["subscription"]

        org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
        if org:
            org.plan_tier = models.PlanTier(plan)
            org.stripe_subscription_id = subscription_id
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        org = db.query(models.Organization).filter(models.Organization.stripe_subscription_id == subscription["id"]).first()
        if org:
            org.plan_tier = models.PlanTier.free
            org.stripe_subscription_id = None
            db.commit()

    return {"status": "success"}