import { MigrationInterface, QueryRunner } from "typeorm";

export class InitCreateAllTables1751286971827 implements MigrationInterface {
    name = 'InitCreateAllTables1751286971827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "is_dummy" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "is_dummy"`);
    }

}
