# Security Specification: ZenBudget

## Data Invariants
1. **User Ownership**: All data (Banks, Transactions, Budgets) must be stored under a user's UID path `/users/{uid}/...`.
2. **Access Isolation**: One user must never be able to read or write another user's data.
3. **Immutable Identity**: Once created, the `uid` or parent `uid` of a document cannot be changed.
4. **Schema Integrity**: Every document must conform to the schema defined in `firebase-blueprint.json`.
5. **System Verification**: `createdAt` and `updatedAt` must be set to `request.time`.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a user profile with a UID that doesn't match `request.auth.uid`.
2. **Cross-User Leak**: Authenticated User A tries to read `/users/UserB/transactions/T1`.
3. **Ghost Field Injection**: Attempt to write a transaction with an undocumented field `isVerified: true`.
4. **ID Poisoning**: Attempt to create a budget with a 2KB string as the category ID.
5. **Timestamp Fraud**: Attempt to set `createdAt` to a past date manually.
6. **Orphaned Write**: Attempt to create a transaction without a corresponding user profile (if required).
7. **Privilege Escalation**: Attempt to set a `role: 'admin'` field on a user profile.
8. **Bulk Scraping**: Attempt to list all transactions across all users.
9. **State Shortcutting**: Attempt to update a transaction amount after it's been "locked" (if locking exists).
10. **Type Mismatch**: Attempt to write a budget `limit` as a string instead of a number.
11. **Negative Limit**: Attempt to write a budget `limit` that is less than or equal to 0 (if constrained).
12. **Anonymous Access**: Unauthenticated user tries to write anything.

## The Test Runner (Plan)
We will use `firestore.rules.test.ts` to verify these protections.
