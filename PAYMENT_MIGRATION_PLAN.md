# MGAI Payment System Migration Plan

## Overview

This document outlines the plan for transitioning the MGAI application from the current product-based payment system to the new simplified credit-based payment system. The credit-based system will allow users to purchase credits and apply them to unlock projects.

## System Comparison

### Current System (PAYMENT_SETUP.md)
- Product-based system with different tiers (single_plan, complete_guide, agency_pack)
- Complex purchase record system in `purchases` table
- Multiple payment options with different access levels
- Frontend components include PreviewOverlay with various payment options

### New System (PAYMENT_SYSTEM.md)
- Simple credit-based system
- Credits stored in `stripe_customers.credit_balance`
- Projects have a simple `is_unlocked` flag
- Streamlined API endpoints for applying credits to projects
- **Product Mapping**:
  - Single Plan/Complete Guide → 1 credit (unlocks single project)
  - Agency Pack/Complete Guide Bundle → 10 credits (unlocks up to 10 projects)

## Migration Plan

### Phase 1: Database Schema Updates

1. Update `stripe_customers` table
   ```sql
   ALTER TABLE stripe_customers
   ADD COLUMN credit_balance INTEGER DEFAULT 0;
   ```

2. Update `projects` table
   ```sql
   ALTER TABLE projects
   ADD COLUMN is_unlocked BOOLEAN DEFAULT FALSE;
   ```

### Phase 2: Backend API Implementation

1. Update Stripe webhook handler to process payments and add credits
   - Single purchase (from current single_plan or complete_guide) adds 1 credit
   - Bundle purchase (from current agency_pack/complete_guide_bundle) adds 10 credits

2. Implement `/api/payments/apply-credit` endpoint
   - Deduct 1 credit from user's balance
   - Mark project as unlocked
   - Return success/failure response

3. Implement `/api/payments/access/:projectId` endpoint
   - Check if project is unlocked
   - Return access status

### Phase 3: Frontend Updates

1. Update PaymentContext.tsx
   - Add methods to check credit balance (`getUserCreditBalance`)
   - Update `checkDocumentAccess` to use `is_unlocked` flag instead of checking purchase records
   - Implement credit application functionality (`applyCredit`)
   - Remove product-specific logic (e.g., agency pack application)

2. Update PreviewOverlay.tsx
   - Replace the current three-tier pricing (Single, Complete, Agency) with two options:
     - Single Project (1 credit): Unlocks current project only
     - Bundle (10 credits): Best value for multiple projects
   - Show current credit balance
   - Add button to apply credit to current project
   - Update UI text to reflect credit-based system

3. Update DocumentViewer.tsx
   - Modify access checking to work with the `is_unlocked` flag
   - Update preview percentages as needed
   - Ensure locked/unlocked state is properly reflected in the UI

4. Implement New Frontend API Calls in api.ts
   - `getUserCreditBalance(userId)`: Get user's available credits
   - `applyCredit(userId, projectId)`: Apply a credit to unlock a project
   - `checkProjectAccess(projectId)`: Check if a project is unlocked

### Phase 4: Testing Plan

1. Test Stripe Integration
   - Verify webhook correctly processes payments
   - Confirm credits are added to user accounts

2. Test Credit Application
   - Verify credits can be applied to unlock projects
   - Ensure credit balance updates correctly
   - Check that projects stay unlocked after refresh

3. Test Access Control
   - Verify unlocked projects show full content
   - Confirm locked projects show only preview
   - Check that multiple users see correct access levels

### Phase 5: Deployment

1. Database Migration
   - Run schema updates on production
   - Verify database integrity

2. Code Deployment
   - Deploy backend changes
   - Deploy frontend updates
   - Update environment variables if needed

3. Monitoring
   - Watch for errors in logs
   - Monitor payment processing
   - Check user feedback

## Implementation Timeline

- Phase 1 (Database Schema): 1 day
- Phase 2 (Backend API): 2-3 days
- Phase 3 (Frontend Updates): 3-4 days
- Phase 4 (Testing): 2 days
- Phase 5 (Deployment): 1 day

Total estimated timeline: 9-11 days

## Rollback Plan

In case of issues with the new payment system:

1. Keep database schema changes (they don't affect existing functionality)
2. Roll back code changes to previous version
3. Restore previous frontend components
4. Update documentation to reflect the rollback

## Conclusion

This migration will simplify the payment system, making it easier for users to understand and for developers to maintain. The credit-based approach provides flexibility while reducing the complexity of the current product-based system.
