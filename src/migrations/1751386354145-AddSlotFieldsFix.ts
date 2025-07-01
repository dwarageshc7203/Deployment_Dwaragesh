import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlotFieldsFix1751386354145 implements MigrationInterface {
    name = 'AddSlotFieldsFix1751386354145'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor" ALTER COLUMN "patients_per_slot" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor" ALTER COLUMN "patients_per_slot" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor" ALTER COLUMN "patients_per_slot" SET DEFAULT '3'`);
        await queryRunner.query(`ALTER TABLE "doctor" ALTER COLUMN "patients_per_slot" SET NOT NULL`);
    }

}
