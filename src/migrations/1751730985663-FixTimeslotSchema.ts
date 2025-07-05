import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTimeslotSchema1751730985663 implements MigrationInterface {
  name = 'FixTimeslotSchema1751730985663'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("timeslot");

    if (!table?.findColumnByName("end_time")) {
      await queryRunner.query(`ALTER TABLE "timeslot" ADD "end_time" TIME`);
    }
    if (!table?.findColumnByName("patients_per_slot")) {
      await queryRunner.query(`ALTER TABLE "timeslot" ADD "patients_per_slot" INT`);
    }
    if (!table?.findColumnByName("slot_duration")) {
      await queryRunner.query(`ALTER TABLE "timeslot" ADD "slot_duration" INTERVAL`);
    }
    if (!table?.findColumnByName("reporting_gap")) {
      await queryRunner.query(`ALTER TABLE "timeslot" ADD "reporting_gap" INTERVAL`);
    }
    if (!table?.findColumnByName("booking_start_time")) {
      await queryRunner.query(`ALTER TABLE "timeslot" ADD "booking_start_time" TIME`);
    }
    if (!table?.findColumnByName("booking_end_time")) {
      await queryRunner.query(`ALTER TABLE "timeslot" ADD "booking_end_time" TIME`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "booking_end_time"`);
    await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "booking_start_time"`);
    await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "reporting_gap"`);
    await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "slot_duration"`);
    await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "patients_per_slot"`);
    await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "end_time"`);
  }
}
