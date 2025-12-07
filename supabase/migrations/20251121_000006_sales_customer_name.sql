-- Add denormalized customer_name to sales table for quick listing
alter table if exists public.sales
  add column if not exists customer_name text;

-- Backfill existing rows from students / sales_customers
update public.sales s
set customer_name = coalesce(
  (select full_name from public.sales_customers sc where sc.id = s.sales_customer_id),
  (select coalesce(st.full_name, trim(coalesce(st.first_name, '') || ' ' || coalesce(st.last_name, '')))
   from public.students st
   where st.id = s.student_id)
)
where customer_name is null;



