-- Enable Realtime for orders and users tables
-- This allows the admin dashboard to receive live updates

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for users table (for driver updates)
ALTER PUBLICATION supabase_realtime ADD TABLE users;
