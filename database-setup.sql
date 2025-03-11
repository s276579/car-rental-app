-- This SQL should be run in your Supabase SQL editor to ensure proper cascading deletion
-- Make sure the customers table references auth.users with ON DELETE CASCADE

-- If your table is already created, you might need to drop the existing foreign key and recreate it:
ALTER TABLE public.customers 
  DROP CONSTRAINT IF EXISTS customers_id_fkey,
  ADD CONSTRAINT customers_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- This ensures that when an auth.users record is deleted, the corresponding
-- public.customers record is automatically deleted as well

