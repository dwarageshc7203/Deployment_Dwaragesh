import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDoctorSlotFields1751387115011 implements MigrationInterface {
  name = 'AddDoctorSlotFields1751387115011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor"
      ADD COLUMN IF NOT EXISTS "slot_duration" integer DEFAULT 15,
      ADD COLUMN IF NOT EXISTS "patients_per_slot" integer DEFAULT 3
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor"
      DROP COLUMN IF EXISTS "slot_duration",
      DROP COLUMN IF EXISTS "patients_per_slot"
    `);
  }
}
