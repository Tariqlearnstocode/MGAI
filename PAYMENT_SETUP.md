# Payment System Setup and Integration

This guide explains how to set up and test the payment system for the Marketing Guide AI application using Stripe and Railway deployment.

## Environment Variables

Make sure the following environment variables are set in your Railway deployment:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `VITE_APP_URL`: The full URL of your deployed application (e.g., https://marketing-guide-ai.up.railway.app)

## Stripe Webhook Setup

1. Log in to your Stripe Dashboard (https://dashboard.stripe.com/)
2. Go to Developers > Webhooks
3. Click "Add endpoint"
4. Enter your webhook URL: `https://your-railway-app.up.railway.app/api/webhook/stripe`
5. Select the following events to listen for:
   - `checkout.session.completed`
6. Click "Add endpoint"
7. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET` in your Railway environment variables

## Testing the Payment System

### Option 1: Using the Testing Script

The project includes a testing script that simulates the payment flow:

```bash
# Install dependencies if you're running locally
npm install

# Run the test script
node test-payment.js <userId> <productId> [projectId]

# Example:
node test-payment.js 123e4567-e89b-12d3-a456-426614174000 complete_guide 123e4567-e89b-12d3-a456-426614174001
```

### Option 2: Testing with Stripe Dashboard

1. Create a checkout session through the application
2. In the Stripe Dashboard, go to Developers > Events
3. Find the `checkout.session.completed` event
4. Click "Send test webhook" to simulate a successful payment
5. The webhook should be received by your application and processed

### Option 3: End-to-End Testing

1. Create a new project in the application
2. Try to unlock a document by clicking on the payment option
3. Use Stripe test card details:
   - Card number: `4242 4242 4242 4242`
   - Expiry date: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. After successful payment, the document should be unlocked

## Debugging Payment Issues

If payments aren't working correctly, check the following:

1. **Server Logs**: Look at your Railway logs for any errors related to Stripe or webhooks
2. **Stripe Dashboard**: Check the webhook delivery attempts in Stripe Dashboard
3. **Stripe Events**: Check the Events tab in Stripe Dashboard to see if checkout sessions are being created
4. **Database**: Check the `purchases` table in Supabase to see if records are being created

## Troubleshooting

### Webhook Not Receiving Events

1. Verify the webhook URL is correct in Stripe Dashboard
2. Check that `STRIPE_WEBHOOK_SECRET` is set correctly
3. Ensure the webhook route is configured correctly in server.js

### Purchase Records Not Being Created

1. Check server logs for errors in the `handleCheckoutCompleted` function
2. Verify Supabase connection is working
3. Check permissions on the `purchases` table

### Documents Not Unlocking After Payment

1. Verify the `checkDocumentAccess` function in PaymentContext.tsx
2. Check if the document is correctly retrieving the payment status
3. Ensure the payment is associated with the correct project ID

## Payment Flow

1. User clicks to unlock a document
2. Application creates a Stripe checkout session
3. User completes payment on Stripe checkout page
4. Stripe sends webhook to `/api/webhook/stripe`
5. Application verifies the webhook signature
6. Application creates a purchase record in Supabase
7. User is redirected back to the document page
8. The document checks payment status and unlocks content

## Important Files

- `src/contexts/PaymentContext.tsx`: Manages payment state and document access
- `src/components/PreviewOverlay.tsx`: Displays payment options
- `server.js`: Handles Stripe checkout and webhooks
- `src/lib/api.ts`: Contains API functions for payments
- `src/components/DocumentViewer.tsx`: Checks document access when displaying 