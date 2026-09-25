-- Community Volunteer Coordination Platform
-- PostgreSQL Database Schema
-- Database: community_volunteer

-- 1. USERS


CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_user_role
        CHECK (role IN ('volunteer', 'organisation_admin', 'system_admin'))
);


-- 2. VOLUNTEER PROFILE


CREATE TABLE volunteer_profile (
    volunteer_id INTEGER PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(150),
    availability_summary TEXT,

    CONSTRAINT fk_volunteer_user
        FOREIGN KEY (volunteer_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- 3. ORGANISATION

CREATE TABLE organisation (
    organisation_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    verification_status VARCHAR(30) DEFAULT 'pending'
);


-- 4. ORGANISATION MEMBER


CREATE TABLE organisation_member (
    organisation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    member_role VARCHAR(50),

    PRIMARY KEY (organisation_id, user_id),

    FOREIGN KEY (organisation_id)
        REFERENCES organisation(organisation_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- 5. OPPORTUNITY


CREATE TABLE opportunity (
    opportunity_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organisation_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(150),
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP,
    required_volunteers INTEGER,
    status VARCHAR(30) DEFAULT 'open',

    FOREIGN KEY (organisation_id)
        REFERENCES organisation(organisation_id)
        ON DELETE CASCADE
);


-- 6. APPLICATION


CREATE TABLE application (
    application_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    volunteer_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decision_at TIMESTAMP,

    FOREIGN KEY (volunteer_id)
        REFERENCES volunteer_profile(volunteer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (opportunity_id)
        REFERENCES opportunity(opportunity_id)
        ON DELETE CASCADE,

    UNIQUE (volunteer_id, opportunity_id)
);


-- 7. SKILL


CREATE TABLE skill (
    skill_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL
);


-- 8. VOLUNTEER SKILL


CREATE TABLE volunteer_skill (
    volunteer_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,

    PRIMARY KEY (volunteer_id, skill_id),

    FOREIGN KEY (volunteer_id)
        REFERENCES volunteer_profile(volunteer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skill(skill_id)
        ON DELETE CASCADE
);


-- 9. OPPORTUNITY SKILL


CREATE TABLE opportunity_skill (
    opportunity_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,

    PRIMARY KEY (opportunity_id, skill_id),

    FOREIGN KEY (opportunity_id)
        REFERENCES opportunity(opportunity_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skill(skill_id)
        ON DELETE CASCADE
);
