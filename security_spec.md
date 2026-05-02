# Security Specification for Cappuccino7

## Data Invariants
1. A user can only access their own profile.
2. Orders belong to a specific user and cannot be modified by other users.
3. Only admins can modify menu categories, products, and brand settings.
4. Users gain points based on their orders (enforced by application logic, but rules prevent unauthorized updates).

## The Dirty Dozen (Attacker Payloads)
1. **Identity Theft**: `update /users/otherUser { points: 9999 }` -> Expected: PERMISSION_DENIED
2. **Shadow Field Injection**: `create /users/myUid { isAdmin: true, points: 1000 }` -> Expected: PERMISSION_DENIED (isValidUser schema check)
3. **Menu Vandalism**: `update /products/espresso { price: 0.1 }` -> Expected: PERMISSION_DENIED
4. **Order Interception**: `get /orders/otherUserOrder` -> Expected: PERMISSION_DENIED
5. **State Shortcut**: `update /orders/myOrder { status: 'delivered' }` -> Expected: PERMISSION_DENIED (User can only cancel or create, not delivered)
6. **Brand Hijack**: `set /settings/brand { logoUrl: 'http://malicious.com/logo.png' }` -> Expected: PERMISSION_DENIED
7. **Privilege Escalation**: `set /admins/myUid { uid: 'myUid' }` -> Expected: PERMISSION_DENIED
8. **Resource Exhaustion**: `create /orders/ { longId: 'A' * 2000 }` -> Expected: PERMISSION_DENIED (ID Poisoning Guard)
9. **PII Leak**: `list /users` -> Expected: PERMISSION_DENIED (Rules only allow get for owner)
10. **Query Scrape**: `list /orders` -> Expected: PERMISSION_DENIED (Unless filtered by userId)
11. **Timestamp Spoofing**: `create /orders/ { createdAt: '2020-01-01' }` -> Expected: PERMISSION_DENIED (Strict request.time check)
12. **Immutable Field Change**: `update /users/myUid { createdAt: '2020-01-01' }` -> Expected: PERMISSION_DENIED

## Test Plan
- Verify that standard users can create an order but not update its status to 'delivered'.
- Verify that users can only see their own orders.
- Verify that brand settings are publicly readable but only admin writable.
- Verify that admins (listed in /admins) can modify everything.
