-- Add missing columns to ParkingSpot (price tiers added after init migration)
ALTER TABLE "ParkingSpot"
  ADD COLUMN IF NOT EXISTS "priceHourly"  DOUBLE PRECISION NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "priceDaily"   DOUBLE PRECISION NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "priceWeekly"  DOUBLE PRECISION NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS "priceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 1000;

-- Add missing columns to Ride (vehicle info added after init migration)
ALTER TABLE "Ride"
  ADD COLUMN IF NOT EXISTS "vehicleType"     TEXT NOT NULL DEFAULT 'CAR',
  ADD COLUMN IF NOT EXISTS "vehicleCapacity" INT  NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "fuelType"        TEXT NOT NULL DEFAULT 'Petrol',
  ADD COLUMN IF NOT EXISTS "vehicleNumber"   TEXT NOT NULL DEFAULT '';

-- Add missing column to RideRequest (fare added after init migration)
ALTER TABLE "RideRequest"
  ADD COLUMN IF NOT EXISTS "fareCents" INT NOT NULL DEFAULT 1000;
