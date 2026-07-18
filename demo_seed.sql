-- Demo code to insert 15 cars into the Supabase Database

INSERT INTO public.cars (code, name, model, year, price, status, viewers, image, images, body_type, tax_status, condition, fuel_type, color, description, is_active)
VALUES
('DOM-001', 'Toyota Prius 2012', 'Prius Option 4', 2012, 18500, 'ready', 250, '/cars/prius-silver.jpg', ARRAY['/cars/prius-silver.jpg', '/cars/prius-010-white.png'], 'Sedan', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Hybrid', 'ស (White)', ARRAY['ឡានស្អាត អត់បុកអត់ប៉ះ', 'ថ្ម 100%', 'ម៉ាស៊ីនត្រជាក់រងា', 'មានធានា'], true),

('DOM-002', 'Lexus RX330 2004', 'RX330 Haft Full', 2004, 22000, 'luxury', 420, '/cars/lexus-black.jpg', ARRAY['/cars/lexus-black.jpg'], 'SUV', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Gasoline', 'ខ្មៅ (Black)', ARRAY['ឡានថ្មីទើបកាត់ចូល', 'ពណ៌ខ្មៅ ក្នុងលឿង', 'ម៉ាស៊ីនឆេះស្ងាត់', 'គុជ និងចង្កៀងថ្មីមុខក្រោយ'], true),

('DOM-003', 'Porsche 911 Carrera', '911', 2021, 135000, 'luxury', 890, '/cars/1.jpg', ARRAY['/cars/1.jpg'], 'Sports', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Gasoline', 'ខៀវ (Blue)', ARRAY['Sport Chrono Package', 'Premium Audio', 'Excellent condition'], true),

('DOM-004', 'BMW M4 Competition', 'M4', 2022, 85000, 'onroad', 550, '/cars/bmw-blue.jpg', ARRAY['/cars/bmw-blue.jpg'], 'Coupe', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Gasoline', 'ស (White)', ARRAY['Full Carbon Exterior', 'Red Leather Interior', '503 Horsepower'], true),

('DOM-005', 'Chevrolet Camaro SS', 'Camaro', 2018, 45000, 'ready', 320, '/cars/2.jpg', ARRAY['/cars/2.jpg'], 'Sports', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Gasoline', 'ក្រហម (Red)', ARRAY['V8 Engine', 'Exhaust Upgrade', 'Clean Title'], true),

('DOM-006', 'Audi RS7 Sportback', 'RS7', 2023, 115000, 'luxury', 670, '/cars/3.jpg', ARRAY['/cars/3.jpg'], 'Sedan', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Gasoline', 'ខ្មៅ (Black)', ARRAY['V8 Twin Turbo', 'Bang & Olufsen Sound', 'Soft Close Doors'], true),

('DOM-007', 'Mercedes-AMG GT', 'AMG GT', 2020, 95000, 'luxury', 820, '/cars/mercedes-silver.jpg', ARRAY['/cars/mercedes-silver.jpg'], 'Coupe', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Gasoline', 'ប្រផេះ (Grey)', ARRAY['Performance Exhaust', 'Carbon Fiber Trim', 'Low Mileage'], true),

('DOM-008', 'Tesla Model S Plaid', 'Model S', 2023, 105000, 'ready', 950, '/cars/4.jpg', ARRAY['/cars/4.jpg'], 'Sedan', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Electric', 'ក្រហម (Red)', ARRAY['Autopilot Included', 'Yoke Steering Wheel', '0-60 in 1.99s'], true),

('DOM-009', 'Ford Mustang GT', 'Mustang', 2021, 42000, 'plate', 430, '/cars/5.jpg', ARRAY['/cars/5.jpg'], 'Coupe', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Gasoline', 'ស (White)', ARRAY['5.0L V8 Engine', 'Manual Transmission', 'Apple CarPlay'], true),

('DOM-010', 'Range Rover Sport', 'Sport HSE', 2020, 68000, 'luxury', 610, '/cars/2.jpg', ARRAY['/cars/2.jpg'], 'SUV', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Diesel', 'ប្រផេះ (Grey)', ARRAY['Air Suspension', 'Meridian Sound System', 'Panoramic Roof'], true),

('DOM-011', 'Toyota Tacoma TRD Pro', 'Tacoma', 2022, 52000, 'onroad', 850, '/cars/camry-white.jpg', ARRAY['/cars/camry-white.jpg'], 'Pickup', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Gasoline', 'ស (White)', ARRAY['Fox Shocks', 'TRD Pro Exhaust', 'JBL Premium Audio'], true),

('DOM-012', 'Honda Civic Type R', 'Civic', 2023, 49000, 'ready', 770, '/cars/civic-black.jpg', ARRAY['/cars/civic-black.jpg'], 'Hatchback', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Gasoline', 'ខ្មៅ (Black)', ARRAY['Manual Transmission', 'Red Alcantara Seats', 'Track Ready'], true),

('DOM-013', 'Jeep Wrangler Rubicon', 'Wrangler', 2021, 55000, 'plate', 520, '/cars/corolla-red.jpg', ARRAY['/cars/corolla-red.jpg'], 'SUV', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Gasoline', 'ក្រហម (Red)', ARRAY['Off-Road Tires', 'Warn Winch', 'Removable Roof'], true),

('DOM-014', 'Ferrari F8 Tributo', 'F8', 2022, 350000, 'luxury', 1500, '/cars/prius-010-white.png', ARRAY['/cars/prius-010-white.png'], 'Sports', 'ក្រដាសពន្ធ (Tax Paper)', 'ថ្មី (Like New)', 'Gasoline', 'ស (White)', ARRAY['V8 Twin Turbo', 'Carbon Ceramic Brakes', 'Carbon Steering Wheel'], true),

('DOM-015', 'Classic MGB Roadster', 'MGB', 1974, 25000, 'plate', 300, '/cars/1.jpg', ARRAY['/cars/1.jpg'], 'Convertible', 'ស្លាកលេខ (Plate)', 'មួយទឹក (Used)', 'Gasoline', 'ខៀវ (Blue)', ARRAY['Fully Restored', 'Leather Interior', 'Chrome Bumpers'], true);
