# Security Specification - Caffeino

## Data Invariants
- A customer can only read and write their own profile (except for `isAdmin` and `points` which are restricted or server-side).
- A customer can only read their own orders.
- Only admins can read/write categories and products.
- Only admins can read all orders.
- Customers can only create orders with status 'pending' and their own `userId`.
- Once an order is 'delivered', it cannot be modified by the customer.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
   - Target: `users/victim-uid`
   - Payload: `{ "uid": "victim-uid", "name": "Attacker", "email": "attacker@evil.com", "points": 9999, "isAdmin": true }`
   - Result: PERMISSION_DENIED

2. **Privilege Escalation**: Attempt to update own profile to set `isAdmin: true`.
   - Target: `users/my-uid`
   - Payload: `{ "isAdmin": true }` (via update)
   - Result: PERMISSION_DENIED

3. **Points Manipulation**: Attempt to update own profile to add points manually.
   - Target: `users/my-uid`
   - Payload: `{ "points": 1000000 }` (via update)
   - Result: PERMISSION_DENIED

4. **Shadow Update (Ghost Field)**: Attempt to inject a field not in the schema.
   - Target: `products/item-id`
   - Payload: `{ "name": "Free Coffee", "price": 0, "secretField": "I am a ghost" }`
   - Result: PERMISSION_DENIED

5. **State Shortcut**: Attempt to create an order with status 'delivered' directly.
   - Target: `orders/new-order`
   - Payload: `{ "status": "delivered", "userId": "my-uid", ... }`
   - Result: PERMISSION_DENIED

6. **Price Tampering**: Attempt to create an order with a total of $0.
   - Target: `orders/new-order`
   - Payload: `{ "total": 0, "items": [...], "userId": "my-uid", ... }`
   - Result: PERMISSION_DENIED (Validation should check values)

7. **Orphaned Write**: Attempt to create an order for a non-existent product.
   - Result: Handled by app logic, but rules could check existence of items.

8. **Admin Impersonation**: Attempt to delete a product as a non-admin.
   - Target: `products/id`
   - Result: PERMISSION_DENIED

9. **Customer Data Leak**: Attempt to list all users as a non-admin.
   - Target: `users` (collection)
   - Result: PERMISSION_DENIED

10. **Order Hijacking**: Attempt to update someone else's order.
    - Target: `orders/someone-elses-order`
    - Result: PERMISSION_DENIED

11. **Resource Poisoning**: Use a 1MB string for a category name.
    - Target: `categories/new`
    - Payload: `{ "name": "A".repeat(1024 * 1024) }`
    - Result: PERMISSION_DENIED (Size check)

12. **Status Lock Bypass**: Attempt to change an order status from 'delivered' to 'pending'.
    - Result: PERMISSION_DENIED

## Test Plan
- Run ESLint for rules.
- Manually audit update branches for `affectedKeys().hasOnly()`.
