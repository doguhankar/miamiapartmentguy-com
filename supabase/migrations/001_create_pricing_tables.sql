-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_units table
CREATE TABLE IF NOT EXISTS pricing_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT NOT NULL REFERENCES buildings(id),
  floor_plan_type TEXT NOT NULL,
  beds INTEGER,
  baths DECIMAL,
  sqft INTEGER,
  price INTEGER NOT NULL,
  available_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scrape_logs table for tracking when data was last updated
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT NOT NULL,
  units_count INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pricing_units_building_id ON pricing_units(building_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_building_id ON scrape_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_scraped_at ON scrape_logs(scraped_at DESC);

-- Add comment explaining the schema
COMMENT ON TABLE buildings IS 'Stores building information';
COMMENT ON TABLE pricing_units IS 'Stores individual unit pricing and details';
COMMENT ON TABLE scrape_logs IS 'Tracks scraping activity and data freshness';
