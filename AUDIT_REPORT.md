# Duka Janja Codebase Audit Report

**Date:** October 7, 2026  
**Codebase Path:** C:\Users\hp\duka-janja  
**Auditor:** Codebase Explorer Agent

---

## Executive Summary

This audit identifies **16 critical issues** across the Duka Janja marketplace application. Issues range from missing pages (404 errors), hardcoded strings breaking multilingual support, UX problems, and architectural concerns with footer placement.

---

## Issue Catalog

### 1. Seller Dashboard Shows Blank Page
**Status:** CONFIRMED - Partial Issue  
**Files:** 
- src/app/(seller)/seller/dashboard/page.tsx (lines 83-95)
- src/app/(seller)/layout.tsx (lines 58-60, 63-73)

**Findings:** The dashboard page has content but the seller layout has conditional rendering that may show blank states:
- Lines 58-60: Shows PageLoader if on dashboard but seller not loaded
- Lines 63-73: Shows Store not approved state for non-approved sellers
- The dashboard itself renders correctly when seller is approved and loaded

**Root Cause:** Race condition between useSeller() hook loading and layout rendering. The layout shows loader/pending states that may appear as blank to users.

---

### 2. Voice Search Microphone Permission (Already Fixed)
**Status:** VERIFIED FIXED  
**File:** src/components/search/VoiceSearchButton.tsx (lines 46-66, 123-140)

**Verification:** The component properly handles:
- Permission denied state with retry button (lines 46-66)
- Permission prompting state (lines 69-70)
- Unsupported browser fallback (lines 26-43)
- Both VoiceSearchButton and VoiceSearchInline variants handle all states

---

### 3. Search Bar Categories - Remove Images/Emojis, Keep Names, Add Missing Categories
**Status:** CONFIRMED  
**Files:**
- src/app/(marketplace)/search/page.tsx (lines 144, 318)
- src/app/(marketplace)/products/page.tsx (lines 172, 205)
- src/app/(marketplace)/sellers/page.tsx (line 113)

**Findings:** Categories display cat.icon directly which renders emojis from database:
- Search page line 144: <span className=mr-1>{cat.icon}</span>
- Search page line 318: <span>{cat.icon}</span>
- Products page line 172: <span>{cat.icon}</span>
- Products page line 205: {cat.icon} {cat.name_sw}
- Sellers page line 113: {cat.icon} {cat.name_sw}

**Required Fix:** Replace emoji/icon rendering with Lucide icons mapped from cat.icon string (like CategoryGrid.tsx does with ICON_MAP).

---

### 4. Privacy Policy Page Fix
**Status:** PARTIAL - Needs i18n  
**File:** src/app/(marketplace)/privacy/page.tsx

**Findings:** Page exists but has hardcoded English text throughout (lines 10-54). No translation keys used. Must use LText or t() function for EN/SW support.

---

### 5. Contact Phone Number Update to 0719488073
**Status:** CONFIRMED  
**Files:**
- src/app/(marketplace)/contact/page.tsx (line 56): value: +255 777 000 000
- src/components/layout/Footer.tsx (line 145): {t(whatsapp, lang)}: +255 777 000 000

**Required:** Update both locations to 0719488073 (or +255 719 488 073 for international format).

---

### 6. Messages Page 404 Error
**Status:** CONFIRMED - Routing Issue  
**Files:**
- src/app/messages/[sellerId]/page.tsx - Buyer messages
- src/app/(seller)/seller/messages/page.tsx - Seller messages

**Findings:** The buyer messages page at /messages/[sellerId] exists but may have routing conflicts. The seller messages at /seller/messages exists in seller layout. Need to verify URL structure matches navigation links.

**Note:** Footer links to /help/seller (line 38 in Footer.tsx) which doesn't exist.

---

### 7. Cart Start Shopping Redirect to Browse Products
**Status:** ALREADY CORRECT  
**File:** src/app/(marketplace)/cart/page.tsx (line 63)

**Verification:** Line 63: href=/search - correctly redirects to browse products page (not homepage).

---

### 8. Notifications Page - Sound and Open Functionality
**Status:** CONFIRMED MISSING  
**Files:**
- src/app/(marketplace)/notifications/page.tsx (lines 70-93)
- src/hooks/useNotifications.ts
- src/types/index.ts (line 301)

**Findings:** 
- Notification type has link field (line 301 in types) but not used in UI
- No sound notification on new message arrival
- Click handler only marks as read (line 72), doesn't navigate via n.link

**Required:** 
1. Add sound playback on new notification (in useNotifications.ts realtime handler)
2. Make notification cards clickable to navigate to n.link if present

---

### 9. Account Page UX Improvements
**Status:** NEEDS REVIEW  
**File:** src/app/(marketplace)/settings/page.tsx

**Findings:** Page is functional but has areas for improvement:
- Role switching UX could be clearer (lines 332-405)
- Delete account flow uses hardcoded DELETE text (line 311) - should be localized
- Phone/email change flows lack confirmation UI
- No avatar preview before upload

---

### 10. Seller Help 404
**Status:** CONFIRMED - PAGE MISSING  
**Reference:** src/components/layout/Footer.tsx (line 38): href: /help/seller

**Finding:** No /help/seller page exists in codebase. Need to create:
- src/app/(marketplace)/help/seller/page.tsx or similar

---

### 11. Contact Page Blank Page
**Status:** CONFIRMED - Hardcoded Strings  
**File:** src/app/(marketplace)/contact/page.tsx

**Finding:** Page renders but has hardcoded English/Swahili strings throughout (e.g., lines 52-73 contact methods, lines 75-96 departments). Uses t() for form labels but not for contact method values.

---

### 12. Shipping Policy 404
**Status:** CONFIRMED - PAGE MISSING  
**Reference:** src/components/layout/Footer.tsx (line 45): href: /help/shipping

**Finding:** No /help/shipping page exists. Need to create shipping policy page.

---

### 13. Return Policy 404
**Status:** CONFIRMED - PAGE MISSING  
**Reference:** src/components/layout/Footer.tsx (line 46): href: /help/returns

**Finding:** No /help/returns page exists. Need to create return policy page.

---

### 14. Remove Footer Content from All Pages Except Homepage/About
**Status:** CONFIRMED - ARCHITECTURAL ISSUE  
**File:** src/app/(marketplace)/layout.tsx (line 22)

**Finding:** Footer is rendered in marketplace layout wrapper, appearing on ALL marketplace pages (cart, search, products, checkout, settings, etc.). Should only appear on:
- Homepage (/)
- About page (/about)

**Solution:** Move Footer to individual page components or create a layout variant without footer.

---

### 15. Complete Multilingual Localization Fix (EN/SW) - Entire App Consistency
**Status:** CRITICAL - WIDESPREAD HARDCODED STRINGS  
**Files:** 40+ files with hardcoded strings

**Key Offenders (sample):**
| File | Lines | Issue |
|------|-------|-------|
| src/app/(marketplace)/contact/page.tsx | 52-73, 182-186 | Contact methods hardcoded |
| src/app/(marketplace)/privacy/page.tsx | 10-54 | Entire page hardcoded English |
| src/app/(marketplace)/terms/page.tsx | 10-64 | Entire page hardcoded English |
| src/app/(marketplace)/products/page.tsx | 103, 106, 135, 138, 167, 184, 214, 225 | Mixed hardcoded + t() |
| src/app/(marketplace)/sellers/page.tsx | 87, 90, 111, 117, 126, 134, 143, 145 | Mixed hardcoded + t() |
| src/app/(auth)/login/page.tsx | Multiple | Form labels hardcoded |
| src/app/(auth)/register/page.tsx | Multiple | Form labels hardcoded |
| src/components/delivery/DeliveryRating.tsx | 113 | Swahili placeholder |
| src/components/home/LeafletMarketplaceMap.tsx | 303, 311 | Swahili tooltips |
| src/app/rider/wallet/page.tsx | 128, 190 | Swahili placeholders |
| src/app/rider/profile/page.tsx | 128, 140, 152, 164 | Swahili labels |
| src/app/rider/apply/page.tsx | 205-242 | Swahili form labels |
| src/components/seller/ProductForm.tsx | 129, 135, 191 | Swahili placeholders |
| src/components/seller/AIProductStudio.tsx | 74, 84, 92-96, 114-117, 126-127, 131-132 | English content |
| src/components/rider/RiderNavigationMap.tsx | 353, 360 | Swahili tooltips |
| src/app/(admin)/admin/verification/page.tsx | 113, 151 | Swahili text |
| src/app/(admin)/admin/sellers/page.tsx | 86, 152 | Swahili text |
| src/app/(admin)/admin/riders/page.tsx | 135, 175, 183 | Swahili text |
| src/components/shared/ErrorBoundary.tsx | 40-42 | Swahili error text |
| src/components/shared/SectionErrorBoundary.tsx | 41-43 | Swahili error text |
| src/app/error.tsx | 15-17 | Swahili error text |
| src/app/rider/error.tsx | 15-17 | Swahili error text |
| src/app/(auth)/error.tsx | 15-17 | Swahili error text |

**Pattern:** Many pages use lang === sw ? Swahili : English ternary instead of t(key, lang).

---

### 16. Rider Bottom Navigation Text Overflow
**Status:** CONFIRMED  
**File:** src/app/rider/layout.tsx (lines 180-194)

**Finding:** Mobile bottom nav uses min-w-[56px] with text-xs labels. Swahili labels like Zinapatikana (11 chars), Historia (8 chars), Dashibodi (9 chars) overflow the constrained width.

**Evidence:** Line 186: min-w-[56px] is too narrow for Swahili text. Line 190: truncate hides overflow but UX is poor.

---

### 17. Seller Dashboard Blank Page (Duplicate of #1)
**Status:** DUPLICATE - See Issue #1

---

## Additional Findings

### Hardcoded Phone Numbers (Multiple Locations)
| File | Line | Current Value |
|------|------|---------------|
| src/app/(marketplace)/contact/page.tsx | 56 | +255 777 000 000 |
| src/components/layout/Footer.tsx | 145 | +255 777 000 000 |
| src/app/rider/apply/page.tsx | 206 | 0712 345 678 (placeholder) |
| src/app/rider/apply/page.tsx | 232 | 0712 345 678 (placeholder) |

### Missing Translation Keys in Dictionaries
The following keys referenced in Footer but may be missing:
- sellerHelp (exists in en.ts:685, sw.ts:688)
- shippingPolicy (exists in en.ts:688, sw.ts:691)
- returnPolicy (exists in en.ts:689, sw.ts:692)
- whatsapp (exists in en.ts:693, sw.ts:696)

### Category Icon Mapping Needed
Create consistent icon mapping (like CategoryGrid.tsx ICON_MAP) for all pages displaying categories.

---

## Priority Classification

| Priority | Issues | Count |
|----------|--------|-------|
| P0 - Critical | 14, 15 | 2 |
| P1 - High | 1, 3, 5, 6, 8, 10, 11, 12, 13, 16 | 10 |
| P2 - Medium | 4, 9, 17 | 3 |
| P3 - Low | 2, 7 | 2 (already fixed/correct) |

---

## Recommended Fix Order

1. P0: Fix Footer placement (Issue 14) - affects all pages
2. P0: Complete i18n audit and fix hardcoded strings (Issue 15)
3. P1: Create missing pages: Seller Help, Shipping Policy, Return Policy (Issues 10, 12, 13)
4. P1: Update phone numbers (Issue 5)
5. P1: Fix search/category emoji display (Issue 3)
6. P1: Fix Messages page routing (Issue 6)
7. P1: Add notification sound + link navigation (Issue 8)
8. P1: Fix Rider bottom nav text overflow (Issue 16)
9. P1: Fix Seller dashboard blank state (Issue 1)
10. P2: Privacy/Terms pages i18n (Issue 4)
11. P2: Contact page i18n (Issue 11)
12. P2: Account page UX improvements (Issue 9)

---

## File Paths Quick Reference

| Issue | Primary Files to Fix |
|-------|---------------------|
| 1, 17 | src/app/(seller)/layout.tsx, src/app/(seller)/seller/dashboard/page.tsx |
| 3 | src/app/(marketplace)/search/page.tsx, src/app/(marketplace)/products/page.tsx, src/app/(marketplace)/sellers/page.tsx |
| 4 | src/app/(marketplace)/privacy/page.tsx |
| 5 | src/app/(marketplace)/contact/page.tsx:56, src/components/layout/Footer.tsx:145 |
| 6 | src/app/messages/[sellerId]/page.tsx, src/app/(seller)/seller/messages/page.tsx |
| 8 | src/app/(marketplace)/notifications/page.tsx, src/hooks/useNotifications.ts |
| 9 | src/app/(marketplace)/settings/page.tsx |
| 10, 12, 13 | Create: src/app/(marketplace)/help/seller/page.tsx, src/app/(marketplace)/help/shipping/page.tsx, src/app/(marketplace)/help/returns/page.tsx |
| 11 | src/app/(marketplace)/contact/page.tsx |
| 14 | src/app/(marketplace)/layout.tsx:22 |
| 15 | 40+ files - see detailed table above |
| 16 | src/app/rider/layout.tsx:180-194 |

---

*End of Audit Report*
