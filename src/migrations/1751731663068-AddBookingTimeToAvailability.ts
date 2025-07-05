import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingTimeToAvailability1751731663068 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE doctor_availability
      ADD COLUMN booking_start_time TIME,
      ADD COLUMN booking_end_time TIME;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE doctor_availability
      DROP COLUMN booking_start_time,
      DROP COLUMN booking_end_time;
    `);
  }
}
