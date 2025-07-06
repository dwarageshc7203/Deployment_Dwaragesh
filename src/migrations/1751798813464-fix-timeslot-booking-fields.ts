import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTimeslotBookingFields1751798813464 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "timeslot"
      ALTER COLUMN "booking_start_time" TYPE timestamp USING booking_start_time::timestamp,
      ALTER COLUMN "booking_end_time" TYPE timestamp USING booking_end_time::timestamp;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "timeslot"
      ALTER COLUMN "booking_start_time" TYPE time USING booking_start_time::time,
      ALTER COLUMN "booking_end_time" TYPE time USING booking_end_time::time;
    `);
  }
}
