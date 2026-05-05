-- Seed test hotel for development/testing
INSERT INTO "hotels" ("id", "name", "description", "created_at", "updated_at")
VALUES (
  'taiz-hotel-001',
  'فندق تعز السياحي',
  'فندق سياحي فاخر في قلب مدينة تعز، يوفر أفضل الخدمات للضيوف.',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
