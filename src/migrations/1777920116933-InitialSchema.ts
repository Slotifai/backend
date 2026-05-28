import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777920116933 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE user_role_enum AS ENUM ('client', 'master', 'admin');
        `);
        await queryRunner.query(`
            CREATE TYPE appointment_status_enum AS ENUM ('scheduled', 'completed', 'cancelled');
        `);
        await queryRunner.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role user_role_enum NOT NULL,
                is_email_verified BOOLEAN NOT NULL DEFAULT false,
                email_verify_token_hash VARCHAR(64) UNIQUE,
                refresh_token_hash VARCHAR(255),
                reset_token_hash VARCHAR(64) UNIQUE,
                reset_token_expires_at TIMESTAMPTZ,
                is_blocked BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE clients (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE masters (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(255),
                specialization VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE services (
                id SERIAL PRIMARY KEY,
                master_id INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                duration_minutes INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE working_hours (
                id SERIAL PRIMARY KEY,
                master_id INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
                day_of_week SMALLINT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_day_off BOOLEAN NOT NULL DEFAULT false
            );
        `);
        await queryRunner.query(`
            CREATE TABLE appointments (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                service_id INT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
                master_id INT NOT NULL REFERENCES masters(id) ON DELETE RESTRICT,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                status appointment_status_enum NOT NULL DEFAULT 'scheduled',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE appointment_notes (
                id SERIAL PRIMARY KEY,
                appointment_id INT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE reviews (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                appointment_id INT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
                rating SMALLINT NOT NULL,
                comment TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS reviews;`);
        await queryRunner.query(`DROP TABLE IF EXISTS appointment_notes;`);
        await queryRunner.query(`DROP TABLE IF EXISTS appointments;`);
        await queryRunner.query(`DROP TABLE IF EXISTS working_hours;`);
        await queryRunner.query(`DROP TABLE IF EXISTS services;`);
        await queryRunner.query(`DROP TABLE IF EXISTS masters;`);
        await queryRunner.query(`DROP TABLE IF EXISTS clients;`);
        await queryRunner.query(`DROP TABLE IF EXISTS users;`);
        await queryRunner.query(`DROP TYPE IF EXISTS appointment_status_enum;`);
        await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum;`);
    }
}
