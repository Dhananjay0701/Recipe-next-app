-- Function to execute raw SQL queries
-- This needs to be executed in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 