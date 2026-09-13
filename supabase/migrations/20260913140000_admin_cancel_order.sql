-- Admin order cancellation for Ritme.
-- Does not change create_order(), confirm_order(), complete_order(), or cancel_order().
--
-- Existing cancel_order(p_order_ref, p_reason):
--   - requires auth.uid()
--   - allows buyer, seller, OR is_admin()
--   - only when status = pending
--   - sets status = cancelled (reservation drops because listing_reserved_quantity
--     counts only pending + confirmed)
--
-- Admin needs to cancel confirmed as well. That is not added to cancel_order so
-- buyer/seller pending-only rules stay intact.

CREATE OR REPLACE FUNCTION public.admin_cancel_order(p_order_ref text)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order public.orders;
BEGIN
  IF v_actor IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  IF NOT public.is_admin() THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to do that.');
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_order.id
  FOR UPDATE;

  IF v_order.status = 'cancelled' THEN
    PERFORM public.motodo_raise('INVALID_ORDER_STATE', 'This order is already cancelled.');
  END IF;

  IF v_order.status = 'completed' THEN
    PERFORM public.motodo_raise('INVALID_ORDER_STATE', 'Completed orders cannot be cancelled.');
  END IF;

  IF v_order.status IS DISTINCT FROM 'pending' AND v_order.status IS DISTINCT FROM 'confirmed' THEN
    PERFORM public.motodo_raise('INVALID_ORDER_STATE', 'This order status cannot be changed.');
  END IF;

  UPDATE public.orders
  SET
    status = 'cancelled',
    cancellation_reason = NULL
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

COMMENT ON FUNCTION public.admin_cancel_order(text) IS
  'Ritme admin only (profiles.role = admin). Cancels pending or confirmed orders. Reservation is released because reserved qty excludes cancelled. Does not deduct listings.quantity.';

REVOKE ALL ON FUNCTION public.admin_cancel_order(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(text) TO authenticated;
