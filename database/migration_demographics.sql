-- Migration: add optional donor demographic fields (gender, birthdate, city, province)
-- Apply this to an EXISTING live DonorTrack database that already has data.
-- (A fresh install created from database.sql already includes these columns.)
--
-- These demographic fields are OPTIONAL (nullable), collected for aggregate
-- analytics only, consistent with data-minimization principles — never
-- required for donation processing.

ALTER TABLE donors
    ADD COLUMN gender ENUM('Male', 'Female', 'Prefer not to say') NULL DEFAULT NULL AFTER address,
    ADD COLUMN birthdate DATE NULL DEFAULT NULL AFTER gender,
    ADD COLUMN city VARCHAR(100) NULL AFTER birthdate,
    ADD COLUMN province VARCHAR(100) NULL AFTER city;

-- Optional: backfill structured city/province for the existing seed donors so the
-- new "Top locations" and "Giving by gender/age" charts render with data. Safe to
-- skip or edit for a real dataset. Matches the addresses already on file.
UPDATE donors SET city = 'Quezon City', province = 'Metro Manila',  gender = 'Female',            birthdate = '1975-03-14' WHERE email = 'maria.santos@gmail.com';
UPDATE donors SET city = 'Makati',      province = 'Metro Manila',  gender = 'Male',              birthdate = '1988-07-09' WHERE email = 'jose.ramirez@yahoo.com';
UPDATE donors SET city = 'Cebu City',   province = 'Cebu',          gender = 'Female',            birthdate = '1996-11-22' WHERE email = 'ana.reyes@outlook.com';
UPDATE donors SET city = 'Pasig',       province = 'Metro Manila',  gender = 'Male',              birthdate = '1983-01-30' WHERE email = 'paolo.delacruz@gmail.com';
UPDATE donors SET city = 'Taguig',      province = 'Metro Manila',  gender = 'Female',            birthdate = '1969-05-18' WHERE email = 'grace.lim@limholdings.ph';
UPDATE donors SET city = 'Davao City',  province = 'Davao del Sur', gender = 'Male',              birthdate = '1992-09-03' WHERE email = 'miguel.tan@gmail.com';
UPDATE donors SET city = 'Mandaluyong', province = 'Metro Manila',  gender = 'Female',            birthdate = '2000-02-14' WHERE email = 'kat.villanueva@gmail.com';
UPDATE donors SET city = 'Manila',      province = 'Metro Manila',  gender = 'Prefer not to say', birthdate = '1961-12-01' WHERE email = 'ramon.aquino@aquinolaw.ph';
UPDATE donors SET city = 'Iloilo City', province = 'Iloilo',        gender = 'Female',            birthdate = '1958-08-25' WHERE email = 'lourdes.garcia@gmail.com';
UPDATE donors SET city = 'Caloocan',    province = 'Metro Manila',  gender = 'Male',              birthdate = '1990-04-10' WHERE email = 'benjie.ocampo@gmail.com';
UPDATE donors SET city = 'San Juan',    province = 'Metro Manila',  gender = 'Female',            birthdate = '1998-06-27' WHERE email = 'cheska.uy@uygroup.ph';
UPDATE donors SET city = 'Baguio',      province = 'Benguet',       gender = 'Male',              birthdate = '1978-10-05' WHERE email = 'andres.bautista@gmail.com';
UPDATE donors SET city = 'Cebu City',   province = 'Cebu',          gender = 'Female',            birthdate = '1985-03-19' WHERE email = 'isabel.navarro@gmail.com';
UPDATE donors SET city = 'Parañaque',   province = 'Metro Manila',  gender = 'Male',              birthdate = '1995-12-12' WHERE email = 'dan.cruz@gmail.com';
UPDATE donors SET city = 'Las Piñas',   province = 'Metro Manila',  gender = 'Female',            birthdate = '1972-07-07' WHERE email = 'sarah.mercado@gmail.com';
UPDATE donors SET city = 'Antipolo',    province = 'Rizal',         gender = 'Male',              birthdate = '1966-02-28' WHERE email = 'victor.salazar@salazarfoods.ph';
UPDATE donors SET city = 'Marikina',    province = 'Metro Manila',  gender = 'Female',            birthdate = '2002-05-16' WHERE email = 'bea.torres@gmail.com';
UPDATE donors SET city = 'Olongapo',    province = 'Zambales'                                                              WHERE email = 'manuel.robles@gmail.com';
