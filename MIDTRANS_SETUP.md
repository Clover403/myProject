# Midtrans Payment Gateway Setup

## Current Status: MOCK MODE ✅

The payment gateway is currently running in **MOCK MODE** for development and testing. This allows you to test the complete order workflow without needing valid Midtrans credentials.

## Mock Mode Features

- ✅ Accept orders creates mock payment
- ✅ Simulate payment endpoint for testing
- ✅ Full order workflow testing (pending → waiting_payment → on_process → submitted → completed)
- ✅ No real payment processing

## Testing with Mock Mode

### 1. Accept Order (Seller)
```bash
curl -X POST http://localhost:5000/api/orders/{ORDER_ID}/accept \
  -H "Authorization: Bearer {SELLER_TOKEN}"
```
Response includes mock payment token.

### 2. Simulate Payment (Buyer)
```bash
curl -X POST http://localhost:5000/api/orders/{ORDER_ID}/simulate-payment \
  -H "Authorization: Bearer {BUYER_TOKEN}"
```
This simulates successful payment and moves order to `on_process` status.

### 3. Submit Work (Seller)
```bash
curl -X POST http://localhost:5000/api/orders/{ORDER_ID}/submit \
  -H "Authorization: Bearer {SELLER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Work completed",
    "fileUrl": "https://example.com/file.pdf",
    "fileName": "report.pdf"
  }'
```

### 4. Complete Order (Buyer)
```bash
curl -X POST http://localhost:5000/api/orders/{ORDER_ID}/complete \
  -H "Authorization: Bearer {BUYER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "review": "Great work!",
    "rating": 5
  }'
```

## Switching to Production Midtrans

### 1. Get Midtrans Credentials

1. Sign up at [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. For **Sandbox Testing**:
   - Go to Settings → Access Keys
   - Copy **Sandbox Server Key** and **Sandbox Client Key**
3. For **Production**:
   - Complete verification process
   - Go to Settings → Access Keys
   - Copy **Production Server Key** and **Production Client Key**

### 2. Update Environment Variables

Edit `/backend/.env`:

```env
# For Sandbox (Testing)
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_SANDBOX_SERVER_KEY
MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_SANDBOX_CLIENT_KEY

# For Production
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-YOUR_PRODUCTION_SERVER_KEY
MIDTRANS_CLIENT_KEY=Mid-client-YOUR_PRODUCTION_CLIENT_KEY
```

### 3. Restart Backend

```bash
cd backend
npm start
```

The system will automatically detect valid credentials and switch from MOCK mode to LIVE mode.

## Order Workflow

```
1. Buyer creates order → status: pending
2. Seller accepts order → status: waiting_payment (payment created)
3. Buyer pays via Midtrans → status: on_process (or simulate-payment in mock mode)
4. Seller submits work → status: submitted
5. Buyer reviews:
   - Accept → status: completed
   - Request revision → status: revision (back to on_process after seller resubmits)
```

## Payment Statuses

- `unpaid` - Payment not initiated
- `pending` - Payment initiated, waiting for buyer
- `paid` - Payment successful
- `expired` - Payment link expired
- `failed` - Payment failed

## Frontend Integration

The frontend automatically handles:
- Payment redirect URL (when using real Midtrans)
- Payment status checking
- Mock payment simulation button (in development)

## Webhook Configuration

For production Midtrans, configure webhook in Midtrans Dashboard:

**Notification URL**: `https://your-domain.com/api/orders/notification/midtrans`

The backend will automatically verify and process payment notifications.

## Troubleshooting

### Mock Mode Not Working
- Check backend logs: `cat /tmp/backend.log | grep Midtrans`
- Should see: `💳 Midtrans Payment Mode: MOCK (Development)`

### Real Midtrans Returns 401
- Verify credentials are correct
- Check MIDTRANS_SERVER_KEY starts with `SB-Mid-server-` (sandbox) or `Mid-server-` (production)
- Ensure MIDTRANS_IS_PRODUCTION matches your key type

### Payment Status Not Updating
- Check webhook URL is configured in Midtrans Dashboard
- Verify server is accessible from internet (for production)
- Check backend logs for notification errors

## Security Notes

- ⚠️ Never commit `.env` file to git
- ⚠️ Keep Server Key secret (never expose to frontend)
- ✅ Client Key can be used in frontend
- ✅ Always verify webhook signature in production
