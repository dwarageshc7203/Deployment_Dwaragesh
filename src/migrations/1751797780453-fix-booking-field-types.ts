import { MigrationInterface, QueryRunner } from "typeorm";

export class FixBookingFieldTypes1751797780453 implements MigrationInterface {
  name = 'FixBookingFieldTypes1751797780453'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_availability"
      ALTER COLUMN "booking_start_time" TYPE timestamp
      USING (CURRENT_DATE + booking_start_time),
      ALTER COLUMN "booking_end_time" TYPE timestamp
      USING (CURRENT_DATE + booking_end_time);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doctor_availability"
      ALTER COLUMN "booking_start_time" TYPE time
      USING booking_start_time::time,
      ALTER COLUMN "booking_end_time" TYPE time
      USING booking_end_time::time;
    `);
  }
}
