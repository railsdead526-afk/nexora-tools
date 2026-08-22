-- Disable the old manual DANA review flow. Midtrans is now the only active
-- payment path in application code.

drop function if exists public.review_manual_payment(text, uuid, text, text);
