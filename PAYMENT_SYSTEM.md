MGAI Payment System

A simplified, credit-based payment system for the Marketing Guide AI application. This system uses credits to unlock project content, integrating with our existing database tables.

Overview

The MGAI Payment System enables users to purchase credits through Stripe. These credits can then be used to unlock projects within Marketing Guide AI. Each project represents a company, and unlocking a project makes all of its content available.

Key Concepts

Credits: The currency used to unlock projects. Tracked in the stripe_customers table.
Project Access: Each project has an is_unlocked flag (in the projects table) that indicates if a credit has been applied.
Products:
Single Project Purchase: Grants 1 credit to unlock a single project.
Bundle Purchase: Grants 10 credits for unlocking up to 10 projects.
Database Schema Updates

1. Update stripe_customers Table
Add a column to track the user's available credits:

ALTER TABLE stripe_customers
ADD COLUMN credit_balance INTEGER DEFAULT 0;
2. Update projects Table
Add a column to indicate whether the project has been unlocked:

ALTER TABLE projects
ADD COLUMN is_unlocked BOOLEAN DEFAULT FALSE;
Core Functionality & API Endpoints

1. Stripe Webhook Handler
This endpoint processes Stripe webhooks to record purchases and update credit balances:

app.post('/api/stripe-webhook', async (req, res) => {
  const { customerId, purchaseType } = req.body; // purchaseType: 'single' or 'bundle'
  const creditsToAdd = purchaseType === 'bundle' ? 10 : 1;

  await db.query(
    'UPDATE stripe_customers SET credit_balance = credit_balance + $1 WHERE id = $2',
    [creditsToAdd, customerId]
  );
  
  res.sendStatus(200);
});
2. Apply Credit to Unlock a Project
This endpoint deducts one credit from the user's balance and marks a project as unlocked:

app.post('/api/payments/apply-credit', async (req, res) => {
  const { customerId, projectId } = req.body;

  // Retrieve the customer's current credit balance
  const { rows } = await db.query('SELECT credit_balance FROM stripe_customers WHERE id = $1', [customerId]);
  const creditBalance = rows[0].credit_balance;

  if (creditBalance < 1) {
    return res.status(400).json({ error: 'Insufficient credits' });
  }

  // Deduct one credit from the customer's balance
  await db.query('UPDATE stripe_customers SET credit_balance = credit_balance - 1 WHERE id = $1', [customerId]);

  // Mark the project as unlocked
  await db.query('UPDATE projects SET is_unlocked = TRUE WHERE id = $1', [projectId]);

  res.json({ success: true });
});
3. Check Project Access
This endpoint checks if a project is unlocked for a given user:

app.get('/api/payments/access/:projectId', async (req, res) => {
  const { projectId } = req.params;
  
  const { rows } = await db.query('SELECT is_unlocked FROM projects WHERE id = $1', [projectId]);
  
  if (rows.length > 0 && rows[0].is_unlocked) {
    return res.json({ access: true });
  } else {
    return res.json({ access: false });
  }
});
Frontend Integration

A. Checking Access
Use the access endpoint to verify if a project is unlocked:

const checkProjectAccess = async (projectId) => {
  const response = await fetch(`/api/payments/access/${projectId}`);
  const { access } = await response.json();
  return access;
};
B. Unlocking a Project
Call the apply credit endpoint when a user chooses to unlock a project:

const unlockProject = async (projectId) => {
  const response = await fetch('/api/payments/apply-credit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: user.id, projectId }),
  });
  const result = await response.json();
  if (result.success) {
    // Update the UI to indicate that the project is now unlocked
  } else {
    // Display an error message (e.g., "Insufficient credits")
  }
};
Benefits

Simplicity: Utilizes existing tables and minimal extra columns.
Transparency: Tracks the user's credit balance directly in the stripe_customers table and uses a simple flag (is_unlocked) in the projects table.
Reduced Complexity: Fewer tables and simplified API endpoints result in easier maintenance and development.
User Flexibility: Supports both single and bundle purchases while keeping the logic straightforward.
This README should serve as a clear guide for developers working on the MGAI Payment System, ensuring they understand the architecture, database changes, and API integrations necessary to implement the simplified credit system.