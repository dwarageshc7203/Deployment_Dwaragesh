import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSlotDurationAndReportingTime1751373400930 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn("doctor", new TableColumn({
      name: "slot_duration",
      type: "integer",
      isNullable: false,
      default: 15
    }));

    await queryRunner.addColumn("doctor", new TableColumn({
      name: "patients_per_slot",
      type: "integer",
      isNullable: false,
      default: 3
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("doctor", "patients_per_slot");
    await queryRunner.dropColumn("doctor", "slot_duration");
  }
}
