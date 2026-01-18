DROP POLICY IF EXISTS read_global_and_org_dersler ON ea_dersler;

CREATE POLICY read_global_and_org_dersler
ON ea_dersler
FOR SELECT
USING (
  organization_id IS NULL
  OR (
    auth.jwt() ->> 'organization_id' IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  )
);
