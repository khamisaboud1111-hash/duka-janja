-- Adds the 'new_order' notification type used to alert sellers when a buyer places an order.
alter type notification_type add value if not exists 'new_order';
