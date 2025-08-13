-- Create temporary table to match CSV structure
CREATE TEMP TABLE temp_companies (
    id INTEGER,
    name TEXT,
    country TEXT,
    state TEXT,
    city TEXT,
    location TEXT,
    zip_code TEXT,
    website TEXT,
    phone TEXT,
    status TEXT,
    approved_by TEXT,
    user_id TEXT,
    logo_url TEXT
);

-- Copy data from CSV
\COPY temp_companies FROM '/home/runner/workspace/attached_assets/companies_port.csv' WITH CSV HEADER;

-- Insert into companies table with proper mapping
INSERT INTO companies (
    id, user_id, name, industry, size, website, description, logo_url, 
    followers, country, state, city, zip_code, location, phone, status, approved_by
)
SELECT 
    id,
    COALESCE(user_id, 'admin-krupa'),
    name,
    'Not specified',
    '1-50',
    website,
    NULL,
    CASE WHEN logo_url = 'NULL' THEN NULL ELSE logo_url END,
    0,
    country,
    state,
    city,
    CASE WHEN zip_code = 'NULL' THEN NULL ELSE zip_code END,
    COALESCE(location, city || ', ' || state || ', ' || country),
    CASE WHEN phone = 'NULL' THEN NULL ELSE phone END,
    COALESCE(status, 'approved'),
    COALESCE(approved_by, 'admin-krupa')
FROM temp_companies;