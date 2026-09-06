-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Season" (
    "year" INTEGER NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#888888',

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "number" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "rookie" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverSeat" (
    "driverId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,

    CONSTRAINT "DriverSeat_pkey" PRIMARY KEY ("driverId","teamId","season")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "roundNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sprintWeekend" BOOLEAN NOT NULL DEFAULT false,
    "circuitId" TEXT NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "openf1Key" INTEGER,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionResult" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "position" INTEGER,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grid" INTEGER,
    "laps" INTEGER,
    "status" TEXT,

    CONSTRAINT "SessionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PitStop" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "lap" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PitStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverStanding" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "roundNo" INTEGER NOT NULL DEFAULT 0,
    "driverId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DriverStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructorStanding" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "roundNo" INTEGER NOT NULL DEFAULT 0,
    "teamId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConstructorStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechUpgrade" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "roundNo" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "TechUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PowerUnitElement" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PowerUnitElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "roundNo" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundSession" (
    "season" INTEGER NOT NULL,
    "roundNo" INTEGER NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "sessionName" TEXT NOT NULL,

    CONSTRAINT "RoundSession_pkey" PRIMARY KEY ("season","roundNo","sessionName")
);

-- CreateTable
CREATE TABLE "Lap" (
    "id" SERIAL NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "driverNumber" INTEGER NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "sector1" DOUBLE PRECISION,
    "sector2" DOUBLE PRECISION,
    "sector3" DOUBLE PRECISION,
    "isPitOutLap" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarDatum" (
    "id" SERIAL NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "driverNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "speed" INTEGER NOT NULL,
    "throttle" INTEGER NOT NULL,
    "brake" INTEGER NOT NULL,
    "gear" INTEGER NOT NULL,
    "rpm" INTEGER NOT NULL,
    "drs" INTEGER,

    CONSTRAINT "CarDatum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackPoint" (
    "id" SERIAL NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "driverNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,

    CONSTRAINT "TrackPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_season_roundNo_key" ON "Round"("season", "roundNo");

-- CreateIndex
CREATE UNIQUE INDEX "Session_roundId_type_key" ON "Session"("roundId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SessionResult_sessionId_driverId_key" ON "SessionResult"("sessionId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverStanding_season_roundNo_driverId_key" ON "DriverStanding"("season", "roundNo", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructorStanding_season_roundNo_teamId_key" ON "ConstructorStanding"("season", "roundNo", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PowerUnitElement_season_driverId_component_key" ON "PowerUnitElement"("season", "driverId", "component");

-- CreateIndex
CREATE INDEX "RoundSession_sessionKey_idx" ON "RoundSession"("sessionKey");

-- CreateIndex
CREATE INDEX "Lap_sessionKey_idx" ON "Lap"("sessionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Lap_sessionKey_driverNumber_lapNumber_key" ON "Lap"("sessionKey", "driverNumber", "lapNumber");

-- CreateIndex
CREATE INDEX "CarDatum_sessionKey_driverNumber_date_idx" ON "CarDatum"("sessionKey", "driverNumber", "date");

-- CreateIndex
CREATE INDEX "TrackPoint_sessionKey_driverNumber_date_idx" ON "TrackPoint"("sessionKey", "driverNumber", "date");

-- AddForeignKey
ALTER TABLE "DriverSeat" ADD CONSTRAINT "DriverSeat_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverSeat" ADD CONSTRAINT "DriverSeat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_season_fkey" FOREIGN KEY ("season") REFERENCES "Season"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStanding" ADD CONSTRAINT "DriverStanding_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorStanding" ADD CONSTRAINT "ConstructorStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechUpgrade" ADD CONSTRAINT "TechUpgrade_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PowerUnitElement" ADD CONSTRAINT "PowerUnitElement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

