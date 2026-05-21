# Security Specification - VoucherHub

## Data Invariants
1. **Campaigns**: Read-only for all, write-only for admins.
2. **Units**: Read-only for all, write-only for admins.
3. **Whitelist**: Read-only for authenticated users (searching their own code), write-only for admins.
4. **Vouchers**: 
   - `create`: Client can create if they match a whitelist entry or campaign is public.
   - `update`: Only operators of the assigned unit can mark as `used`.
   - `read`: Anyone with the voucher code can read (needed for public validation pages).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a campaign as a non-admin.
2. **Resource Poisoning**: High-size string in unit name (resource exhaustion).
3. **Update Gap**: Changing the `campaignId` of an existing voucher to steal a benefit.
4. **State Shortcut**: Marking a voucher as `used` without being an operator.
5. **PII Leak**: Reading the whole whitelist collection.
6. **Self-Assigned Admin**: Creating an entry in a hypothetical `admins` collection.
7. **Orphaned Voucher**: Creating a voucher for a non-existent campaign.
8. **Double Spend**: Attempting to set `status` to `issued` on a `used` voucher.
9. **Unit Bypass**: Validating a voucher in Store A when the voucher was only for Store B (if restricted).
10. **Expiry Bypass**: Using a voucher after the campaign `hardStopDate`.
11. **Shadow Field**: Adding `isSuperAdmin: true` to a user profile or voucher.
12. **Recursive Cost Attack**: Listing all vouchers without a limit or where clause.

## Test Runner (TDD)
File: `firestore.rules.test.ts` (Conceptual for this environment)
- Verify `allow create: if isAdmin()` for campaigns.
- Verify `allow update: if isOperator()` for vouchers.
- Verify `isValidVoucher()` checks for state transitions.
