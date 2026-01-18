-- 20260118_ea_007_sinav_tipi_constraint.sql

ALTER TABLE ea_sinavlar DROP CONSTRAINT IF EXISTS chk_sinavlar_tipi;
ALTER TABLE ea_sinavlar ADD CONSTRAINT chk_sinavlar_tipi CHECK (
  sinav_tipi IN ('lgs', 'tyt', 'ayt', 'deneme', 'kurum_deneme', 'konu_testi', 'yazili', 'diger')
);
