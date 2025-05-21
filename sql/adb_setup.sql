-- 01-create-schema.sql

-- 1. Ensure the database exists
CREATE DATABASE IF NOT EXISTS SharedSpace;
USE SharedSpace;

-- 2. (Re)create the user with a known password
DROP USER IF EXISTS 'sharedspace'@'%';
CREATE USER 'sharedspace'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON SharedSpace.* TO 'sharedspace'@'%';
FLUSH PRIVILEGES;

-- 3. Drop any old tables
DROP TABLE IF EXISTS user_payments;
DROP TABLE IF EXISTS Chore_Assignment;
DROP TABLE IF EXISTS Users_Events;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Groceries;
DROP TABLE IF EXISTS Chores;
DROP TABLE IF EXISTS Bills;
DROP TABLE IF EXISTS Events;
DROP TABLE IF EXISTS Flat;

-- 4. Recreate your tables

CREATE TABLE Flat (
  Flat_ID    VARCHAR(10) NOT NULL UNIQUE,
  GroupName  VARCHAR(50),
  PRIMARY KEY (Flat_ID)
);

CREATE TABLE User (
  User_ID    INT NOT NULL AUTO_INCREMENT,
  Email      VARCHAR(30) NOT NULL UNIQUE,
  Username   VARCHAR(30) NOT NULL UNIQUE,
  Password   TEXT NOT NULL,
  Flat_ID    VARCHAR(10),
  PRIMARY KEY (User_ID),
  FOREIGN KEY (Flat_ID)
    REFERENCES Flat(Flat_ID)
);

CREATE TABLE Events (
  Event_ID    INT NOT NULL AUTO_INCREMENT,
  Flat_ID     VARCHAR(10) NOT NULL,
  Title       VARCHAR(40),
  Description VARCHAR(150),
  Start_Time  DATETIME,
  End_Time    DATETIME,
  PRIMARY KEY (Event_ID, Flat_ID),
  FOREIGN KEY (Flat_ID)
    REFERENCES Flat(Flat_ID) ON DELETE CASCADE,
  CHECK (Start_Time < End_Time)
);

CREATE TABLE Bills (
  Bill_ID        INT NOT NULL AUTO_INCREMENT,
  Flat_ID        VARCHAR(10) NOT NULL,
  Initial_Amount DECIMAL(10,2) CHECK (Initial_Amount >= 0),
  Amount_Left    DECIMAL(10,2) CHECK (Amount_Left >= 0),
  Due_Date       DATE,
  Payment_Status CHAR(1) DEFAULT 'U' 
                   CHECK (Payment_Status IN ('U','P','F')),
  Title          VARCHAR(30),
  Recurring      BOOLEAN NOT NULL,
  Time_period    INT,
  Description    VARCHAR(100),
  Overdue        BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (Bill_ID),
  FOREIGN KEY (Flat_ID)
    REFERENCES Flat(Flat_ID)
);

CREATE TABLE user_payments (
  Payment_ID       INT NOT NULL AUTO_INCREMENT,
  User_ID          INT NOT NULL,
  Bill_ID          INT NOT NULL,
  User_Amount_paid DECIMAL(10,2) DEFAULT 0.00,
  User_Share_amount DECIMAL(10,2),
  User_Payment_status VARCHAR(20) DEFAULT 'not paid',
  PRIMARY KEY (Payment_ID),            -- now Payment_ID is explicitly the key
  FOREIGN KEY (User_ID) REFERENCES User(User_ID),
  FOREIGN KEY (Bill_ID) REFERENCES Bills(Bill_ID)
);


CREATE TABLE Groceries (
  Flat_ID       VARCHAR(10) NOT NULL,
  Item          VARCHAR(30) NOT NULL,
  Price         DECIMAL(7,2) CHECK (Price > 0),
  Quantity      INT CHECK (Quantity > 0),
  Checked_State BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (Flat_ID, Item),
  FOREIGN KEY (Flat_ID)
    REFERENCES Flat(Flat_ID)
);

CREATE TABLE Chores (
  Chore_ID    INT NOT NULL AUTO_INCREMENT,
  Flat_ID     VARCHAR(10) NOT NULL,
  Priority    ENUM('urgent','not-so-urgent','low-urgency') NOT NULL,
  Title       VARCHAR(30),
  Description VARCHAR(150),
  Completed   BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (Chore_ID),
  FOREIGN KEY (Flat_ID)
    REFERENCES Flat(Flat_ID) ON DELETE CASCADE,
  CHECK (Priority IN ('urgent','not-so-urgent','low-urgency'))
);


CREATE TABLE Chore_Assignment (
  User_ID  INT NOT NULL,
  Chore_ID INT NOT NULL,
  PRIMARY KEY (User_ID, Chore_ID),
  FOREIGN KEY (User_ID) REFERENCES User(User_ID),
  FOREIGN KEY (Chore_ID) REFERENCES Chores(Chore_ID)
);

CREATE TABLE Users_Events (
  User_ID  INT NOT NULL,
  Event_ID INT NOT NULL,
  PRIMARY KEY (User_ID, Event_ID),
  FOREIGN KEY (User_ID)  REFERENCES User(User_ID),
  FOREIGN KEY (Event_ID) REFERENCES Events(Event_ID)
);
