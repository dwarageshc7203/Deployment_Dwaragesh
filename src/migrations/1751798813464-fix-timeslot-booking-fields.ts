import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTimeslotBookingFields1751798813464 implements MigrationInterface {
  name = 'FixTimeslotBookingFields1751798813464';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "timeslot" DROP COLUMN "booking_start_time";
    `);
    await queryRunner.query(`
      ALTER TABLE "timeslot" DROP COLUMN "booking_end_time";
    `);
    await queryRunner.query(`
      ALTER TABLE "timeslot" ADD "booking_start_time" TIMESTAMP;
    `);
    await queryRunner.query(`
      ALTER TABLE "timeslot" ADD "booking_end_time" TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "timeslot" DROP COLUMN "booking_start_time";
    `);
    await queryRunner.query(`
      ALTER TABLE "timeslot" DROP COLUMN "booking_end_time";
    `);
    await queryRunner.query(`
      ALTER TABLE "timeslot" ADD "booking_start_time" TIME;
    `);
    await queryRunner.query(`
      ALTER TABLE "timeslot" ADD "booking_end_time" TIME;
    `);
  }
}
