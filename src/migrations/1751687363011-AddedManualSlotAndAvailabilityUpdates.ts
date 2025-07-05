import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedManualSlotAndAvailabilityUpdates1751687363011 implements MigrationInterface {
    name = 'AddedManualSlotAndAvailabilityUpdates1751687363011'

    public async up(queryRunner: QueryRunner): Promise<void> {
await queryRunner.query(`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'FK_appointment_timeslot'
      AND table_name = 'appointment'
    ) THEN
      ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_timeslot";
    END IF;
  END
  $$;
`);
        await queryRunner.query(`UPDATE "appointment" SET "appointment_date" = CURRENT_DATE WHERE "appointment_date" IS NULL`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "appointment_date" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb" FOREIGN KEY ("slot_id") REFERENCES "timeslot"("slot_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb"`);
        //await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "appointment_date" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_timeslot" FOREIGN KEY ("slot_id") REFERENCES "timeslot"("slot_id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
