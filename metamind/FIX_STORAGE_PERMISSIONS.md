# Fix Supabase Storage Permissions

The error "new row violates row-level security policy" means RLS is enabled on your storage bucket. Here's how to fix it:

## Quick Fix (Recommended for Development)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Policies**
3. Find the `confidence-photos` bucket
4. Click on **Configuration** for the bucket
5. **Disable RLS** by toggling off "Enable Row Level Security"

## Alternative: Create Proper Policies

If you want to keep RLS enabled for security, run these SQL commands in the SQL Editor:

```sql
-- Allow anonymous users to upload files
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'confidence-photos');

-- Allow anonymous users to view files
CREATE POLICY "Allow anonymous downloads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'confidence-photos');
```

## If Policies Still Don't Work

Try these more permissive policies:

```sql
-- Delete existing policies first
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous downloads" ON storage.objects;

-- Create new permissive policies
CREATE POLICY "Allow all uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'confidence-photos');

CREATE POLICY "Allow all downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'confidence-photos');
```

## Verify Your Setup

1. Check that the bucket exists and is set to "public"
2. Ensure RLS is either disabled or proper policies are in place
3. Try uploading a test image through the quiz

The easiest solution for development is to simply disable RLS on the storage bucket.