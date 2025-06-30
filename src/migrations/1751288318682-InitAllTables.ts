import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAllTables1751288318682 implements MigrationInterface {
    name = 'InitAllTables1751288318682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('doctor', 'patient')`);
        await queryRunner.query(`CREATE TYPE "public"."user_provider_enum" AS ENUM('local', 'google')`);
        await queryRunner.query(`CREATE TABLE "user" ("user_id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" text, "role" "public"."user_role_enum" NOT NULL DEFAULT 'patient', "provider" "public"."user_provider_enum" NOT NULL DEFAULT 'local', "hashed_refresh_token" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "patient" ("patient_id" SERIAL NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone_number" character varying, "gender" character varying, "dob" date, "patient_address" character varying, "emergency_contact" character varying, "medical_history" text, "user_id" integer, CONSTRAINT "REL_f20f0bf6b734938c710e12c278" UNIQUE ("user_id"), CONSTRAINT "PK_bd1c8f471a2198c19f43987ab05" PRIMARY KEY ("patient_id"))`);
        await queryRunner.query(`CREATE TABLE "appointment" ("appointment_id" SERIAL NOT NULL, "appointment_date" TIMESTAMP NOT NULL, "time_slot" character varying NOT NULL, "appointment_status" character varying NOT NULL, "reason" character varying NOT NULL, "notes" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_dummy" boolean NOT NULL DEFAULT false, "doctor_id" integer, "patient_id" integer, CONSTRAINT "PK_ee9f73735a635356d4da9bd3e69" PRIMARY KEY ("appointment_id"))`);
        await queryRunner.query(`CREATE TABLE "doctor_availability" ("id" SERIAL NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "session" character varying, "weekday" character varying, "doctor_id" integer, CONSTRAINT "PK_3d2b4ffe9085f8c7f9f269aed89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "timeslot" ("slot_id" SERIAL NOT NULL, "slot_date" date NOT NULL, "slot_time" TIME NOT NULL, "is_available" boolean NOT NULL DEFAULT true, "session" character varying, "doctor_id" integer, "availability_id" integer, CONSTRAINT "PK_ba5086a67e97aa8286cca6e09e8" PRIMARY KEY ("slot_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."doctor_schedule_type_enum" AS ENUM('stream', 'wave')`);
        await queryRunner.query(`CREATE TABLE "doctor" ("doctor_id" SERIAL NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phoneNumber" character varying, "specialization" character varying, "experience_years" integer NOT NULL DEFAULT '0', "education" text, "clinic_name" text, "clinic_address" text, "schedule_Type" "public"."doctor_schedule_type_enum" NOT NULL DEFAULT 'stream', "user_id" integer, CONSTRAINT "REL_a685e79dc974f768c39e5d1228" UNIQUE ("user_id"), CONSTRAINT "PK_e2959c517497025482609c0166c" PRIMARY KEY ("doctor_id"))`);
        await queryRunner.query(`ALTER TABLE "patient" ADD CONSTRAINT "FK_f20f0bf6b734938c710e12c2782" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_9a9c484aa4a944eaec632e00a81" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_86b3e35a97e289071b4785a1402" FOREIGN KEY ("patient_id") REFERENCES "patient"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD CONSTRAINT "FK_2cc8d37cdcb4ecd1e726d6ed304" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD CONSTRAINT "FK_6694587537d7ac723d6a9db6268" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timeslot" ADD CONSTRAINT "FK_80503ac837dd138ebd3a95fac92" FOREIGN KEY ("availability_id") REFERENCES "doctor_availability"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD CONSTRAINT "FK_a685e79dc974f768c39e5d12281" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor" DROP CONSTRAINT "FK_a685e79dc974f768c39e5d12281"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP CONSTRAINT "FK_80503ac837dd138ebd3a95fac92"`);
        await queryRunner.query(`ALTER TABLE "timeslot" DROP CONSTRAINT "FK_6694587537d7ac723d6a9db6268"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP CONSTRAINT "FK_2cc8d37cdcb4ecd1e726d6ed304"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_86b3e35a97e289071b4785a1402"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_9a9c484aa4a944eaec632e00a81"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP CONSTRAINT "FK_f20f0bf6b734938c710e12c2782"`);
        await queryRunner.query(`DROP TABLE "doctor"`);
        await queryRunner.query(`DROP TYPE "public"."doctor_schedule_type_enum"`);
        await queryRunner.query(`DROP TABLE "timeslot"`);
        await queryRunner.query(`DROP TABLE "doctor_availability"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TABLE "patient"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
