create table User (
    email varchar(30),
    username varchar(30),
    password varchar(15),
    flatID varchar(10)
);

create table Flat (
    flatID varchar(10),
    address varchar(50)
);

create table Event (
    eventID int,
    flatID varchar(10),
    title varchar(40),
    description varchar(150),
    event_date date,
    start_time time,
    end_time time,
);

create table Bills (
    flatID varchar(10),
    ammount decimal(7, 2),
    description varchar(150)
);

create table Groceries (
    flatID varchar(10),
    item varchar(30),
    price decimal(7, 2),
    qty int
);

create table Chores (
    flatID varchar(10),
    choreID int,
    priority varchar(30),
    title varchar(30),
    description varchar(150)
);

create table Chore_Assignment (
    userID varchar(30),
    choreID int
);

create table Users_Events (
    userID varchar(30),
    eventID int
);

