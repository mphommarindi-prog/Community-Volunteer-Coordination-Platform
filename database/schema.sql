-- Community Volunteer Coordination Platform
-- PostgreSQL Database Schema
-- Database: community_volunteer

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_user_role
    CHECK (
        role IN (
            'volunteer',
            'organisation_admin',
            'system_admin'
        )
    )
);


CREATE TABLE IF NOT EXISTS volunteer_profile (
    volunteer_id INTEGER PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(150),
    availability_summary TEXT,

    FOREIGN KEY (volunteer_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS organisation (
    organisation_id INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(255),
    verification_status VARCHAR(30)
        DEFAULT 'pending'
);


CREATE TABLE IF NOT EXISTS organisation_member (
    organisation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    member_role VARCHAR(30) DEFAULT 'admin',

    PRIMARY KEY (
        organisation_id,
        user_id
    ),

    FOREIGN KEY (organisation_id)
        REFERENCES organisation(organisation_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS opportunity (
    opportunity_id INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    organisation_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(150),

    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,

    required_volunteers INTEGER NOT NULL,

    status VARCHAR(30)
        DEFAULT 'open',

    FOREIGN KEY (organisation_id)
        REFERENCES organisation(organisation_id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS application (
    application_id INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    volunteer_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,

    status VARCHAR(30)
        DEFAULT 'pending',

    applied_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    decision_at TIMESTAMP,

    FOREIGN KEY (volunteer_id)
        REFERENCES volunteer_profile(volunteer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (opportunity_id)
        REFERENCES opportunity(opportunity_id)
        ON DELETE CASCADE,

    UNIQUE (
        volunteer_id,
        opportunity_id
    )
);


CREATE TABLE IF NOT EXISTS skill (
    skill_id INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    skill_name VARCHAR(100)
        UNIQUE NOT NULL
);


CREATE TABLE IF NOT EXISTS volunteer_skill (
    volunteer_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,

    PRIMARY KEY (
        volunteer_id,
        skill_id
    ),

    FOREIGN KEY (volunteer_id)
        REFERENCES volunteer_profile(volunteer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skill(skill_id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS opportunity_skill (
    opportunity_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,

    PRIMARY KEY (
        opportunity_id,
        skill_id
    ),

    FOREIGN KEY (opportunity_id)
        REFERENCES opportunity(opportunity_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skill(skill_id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS notification (
    notification_id INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS chatbot_faq (
    faq_id INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    question VARCHAR(255) NOT NULL,

    answer TEXT NOT NULL,

    keywords TEXT,

    is_active BOOLEAN DEFAULT TRUE
);


INSERT INTO chatbot_faq
(question, answer, keywords)
VALUES

(
'How do I register as a volunteer?',
'Open the Register page, select Volunteer, enter your details and create your account.',
'register volunteer create account sign up'
),

(
'How do I find volunteer opportunities?',
'Open the Opportunities page to view currently available volunteering opportunities.',
'opportunities find search volunteer work'
),

(
'How do I apply for an opportunity?',
'Open an opportunity and select the Apply or Sign Up button. Your application will be sent to the organisation.',
'apply application sign up opportunity'
),

(
'How do organisations create opportunities?',
'Organisation administrators can open the Post Opportunity page and enter the opportunity details.',
'organisation admin create post opportunity'
),

(
'How can I check my application?',
'Open My Opportunities to view your submitted applications and their current status.',
'application status pending accepted rejected'
)

ON CONFLICT DO NOTHING;
