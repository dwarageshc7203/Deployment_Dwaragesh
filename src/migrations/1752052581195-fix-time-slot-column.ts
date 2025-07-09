import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimeSlotColumn1752052581195 implements MigrationInterface {
  name = 'FixTimeSlotColumn1752052581195';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop FK from appointment.slot_id → timeslot.slot_id
    await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT IF EXISTS "FK_9f9596ccb3fe8e63358d9bfcbdb"`);

    // Step 2: Rename slot_id to time_slot_id
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='appointment' AND column_name='slot_id'
        ) THEN
          ALTER TABLE "appointment" RENAME COLUMN "slot_id" TO "time_slot_id";
        END IF;
      END $$;
    `);

    // Step 3: Conditionally drop is_booked column from timeslot
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='timeslot' AND column_name='is_booked'
        ) THEN
          ALTER TABLE "timeslot" DROP COLUMN "is_booked";
        END IF;
      END $$;
    `);

    // Step 4: Add new column time_slot (only if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='appointment' AND column_name='time_slot'
        ) THEN
          ALTER TABLE "appointment" ADD "time_slot" TIME;
        END IF;
      END $$;
    `);

    // Step 5: Populate appointment.time_slot from timeslot.slot_time
    await queryRunner.query(`
      UPDATE "appointment"
      SET "time_slot" = ts."slot_time"
      FROM "timeslot" ts
      WHERE ts.slot_id = "appointment"."time_slot_id"
    `);

    // Step 6: Make time_slot column NOT NULL
    await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "time_slot" SET NOT NULL`);

    // Step 7: Modify appointment_status safely
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN IF EXISTS "appointment_status"`);
    await queryRunner.query(`ALTER TABLE "appointment" ADD "appointment_status" character varying(20)`);
    await queryRunner.query(`UPDATE "appointment" SET "appointment_status" = 'confirmed' WHERE "appointment_status" IS NULL`);
    await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "appointment_status" SET NOT NULL`);

    // Step 8: Modify reason safely
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN IF EXISTS "reason"`);
    await queryRunner.query(`ALTER TABLE "appointment" ADD "reason" character varying(255)`);
    await queryRunner.query(`UPDATE "appointment" SET "reason" = 'Not specified' WHERE "reason" IS NULL`);
    await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "reason" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "reason"`);
    await queryRunner.query(`ALTER TABLE "appointment" ADD "reason" character varying NOT NULL`);

    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "appointment_status"`);
    await queryRunner.query(`ALTER TABLE "appointment" ADD "appointment_status" character varying NOT NULL`);

    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "time_slot"`);
    await queryRunner.query(`ALTER TABLE "appointment" ADD "time_slot" integer NOT NULL`);

    await queryRunner.query(`ALTER TABLE "timeslot" ADD "is_booked" boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`ALTER TABLE "appointment" RENAME COLUMN "time_slot_id" TO "slot_id"`);

    await queryRunner.query(`
      ALTER TABLE "appointment"
      ADD CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb"
      FOREIGN KEY ("slot_id") REFERENCES "timeslot"("slot_id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    
  }
}
