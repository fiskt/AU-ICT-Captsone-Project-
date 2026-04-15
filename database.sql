CREATE DATABASE IF NOT EXISTS tennisManagementBase;

-- drills tables

CREATE TABLE drill_library(
    id int PRIMARY KEY,
    name varchar(255),
    description varchar(255),
    image varchar(255),
    type varchar(255),
    duration_mins int,
    notes varchar(255),
    level varchar(255),
    date_added datetime
);

CREATE TABLE homework_drills(
    id int PRIMARY KEY,
    name varchar(255),
    description varchar(255),
    image varchar(255),
    type varchar(255),
    duration_mins int,
    notes varchar(255),
    level varchar(255),
    date_added datetime
);

-- Users tables

CREATE TABLE player(
    id int PRIMARY KEY,
    first_name varchar(255),
    last_name varchar(255),
    email varchar(255),
    dob date,
    password varchar(255),
    dom_hand varchar(255),
    load varchar(255),
    strengths varchar(255),
    improvements varchar(255),
    profile_image varchar(255),
    phone_no int UNIQUE KEY,
    doubles_partner int, --not certain this is the right way to do this
    FOREIGN KEY (doubles_partner)
    REFERENCES player(id)
);

CREATE TABLE coach(
    id int PRIMARY KEY,
    first_name varchar(255),
    last_name varchar(255),
    email varchar(255),
    dob date,
    password varchar(255),
    profile_image varchar(255),
    playerID int,
    FOREIGN KEY (playerID),
    REFERENCES player(id)
);


CREATE TABLE injuries(
    id int PRIMARY KEY,
    date date,
    details varchar(255),
    severity int,
    playerID int,
    FOREIGN KEY (playerID),
    REFERENCES player(id)
);

--session related tables

CREATE TABLE sessions(
    id int PRIMARY KEY,
    location varchar(255),
    time datetime,
    playerID int,
    FOREIGN KEY (playerID),
    REFERENCES player(id),
    coachID int,
    FOREIGN KEY (coachID),
    REFERENCES coach(id),
    drillsID int,
    FOREIGN KEY (drillsID),
    REFERENCES drill_library(id)
);

CREATE TABLE calendar(
    id int PRIMARY KEY,
    playerID int,
    FOREIGN KEY (playerID),
    REFERENCES player(id),
    coachID int,
    FOREIGN KEY (coachID),
    REFERENCES coach(id),
    sessionID int,
    FOREIGN KEY (sessionID),
    REFERENCES sessions(id)
);

-- coach journals, and feedback tables

CREATE TABLE journals(
    id int PRIMARY KEY,
    title varchar(255),
    entry varchar(255),
    date timestamp,
    playerID int,
    FOREIGN KEY (playerID),
    REFERENCES player(id),
    coachID int,
    FOREIGN KEY (coachID),
    REFERENCES coach(id),
    drillsID int,
    FOREIGN KEY (drillsID),
    REFERENCES drill_library(id)
    homeworkID int,
    FOREIGN KEY (homeworkID),
    REFERENCES homework_drils(id),
    sessionID int,
    FOREIGN KEY (sessionID),
    REFERENCES sessions(id)
);

CREATE TABLE feedback(
    id int PRIMARY KEY,
    title varchar(255),
    entry varchar(255),
    date timestamp,
    playerID int,
    FOREIGN KEY (playerID),
    REFERENCES player(id),
    coachID int,
    FOREIGN KEY (coachID),
    REFERENCES coach(id),
    drillsID int,
    FOREIGN KEY (drillsID),
    REFERENCES drill_library(id)
    homeworkID int,
    FOREIGN KEY (homeworkID),
    REFERENCES homework_drils(id),
    sessionID int,
    FOREIGN KEY (sessionID),
    REFERENCES sessions(id)
);



