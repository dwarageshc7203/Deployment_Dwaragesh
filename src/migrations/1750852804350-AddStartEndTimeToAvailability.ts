import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStartEndTimeToAvailability1750852804350 implements MigrationInterface {
    name = 'AddStartEndTimeToAvailability1750852804350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP CONSTRAINT "FK_35e27c4696d7477f55ef80aacaf"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP CONSTRAINT "FK_eaa3f0dd76ee855e08c8c1b2a14"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP CONSTRAINT "FK_e2959c517497025482609c0166c"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "startTime"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "endTime"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "doctorDoctorId"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "day_of_week"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "start_time"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "end_time"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "doctorDoctorId"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "available_days"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "available_time_slots"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "start_time" TIME NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "end_time" TIME NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "doctor_id" integer`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "slot_date" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "slot_time" TIME NOT NULL`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "is_available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "session" character varying`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "doctor_id" integer`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "availability_id" integer`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "date" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ALTER COLUMN "session" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ALTER COLUMN "weekday" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD CONSTRAINT "FK_2cc8d37cdcb4ecd1e726d6ed304" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD CONSTRAINT "FK_6694587537d7ac723d6a9db6268" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD CONSTRAINT "FK_80503ac837dd138ebd3a95fac92" FOREIGN KEY ("availability_id") REFERENCES "doctor_availability"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timeslot" DROP CONSTRAINT "FK_80503ac837dd138ebd3a95fac92"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP CONSTRAINT "FK_6694587537d7ac723d6a9db6268"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP CONSTRAINT "FK_2cc8d37cdcb4ecd1e726d6ed304"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ALTER COLUMN "weekday" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ALTER COLUMN "session" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "date" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "availability_id"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "doctor_id"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "session"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "is_available"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "slot_time"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP COLUMN "slot_date"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "doctor_id"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "end_time"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP COLUMN "start_time"`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "available_time_slots" character varying`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "available_days" character varying`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "doctorDoctorId" integer`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "end_time" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "start_time" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD "day_of_week" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "doctorDoctorId" integer`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "endTime" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD "startTime" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD CONSTRAINT "FK_e2959c517497025482609c0166c" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD CONSTRAINT "FK_eaa3f0dd76ee855e08c8c1b2a14" FOREIGN KEY ("doctorDoctorId") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD CONSTRAINT "FK_35e27c4696d7477f55ef80aacaf" FOREIGN KEY ("doctorDoctorId") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
