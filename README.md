# INFO310 - SharedSpace

## Project Documentation:
[Shared Document](https://docs.google.com/document/d/1dsslKUIoFYGAVsMLgXbK1OL8lQxgPu3Gu_5K1Iog1M0/edit?usp=sharing)

[Feasability Study](https://docs.google.com/document/d/1JaLbUw4ipO6lABDCIq8vzGexEP9u_air5N-dcGxHvC8/edit?usp=sharing)

[SCRUM Spreadsheet](https://otagouni-my.sharepoint.com/:x:/r/personal/shofe999_student_otago_ac_nz/Documents/INFO310_Project_Management_SharedSpace.xlsm?d=w6ef4d4d876d34f4487d256dcabb2cecc&csf=1&web=1&e=T4PMRQ)

## Files / Folders:
`mysql-data/` - Holds all the mysql and DB files\
`node_modules/` - Contains modules used by node\
`sql/` - Stores the necceassary sql files for setting up the DB\
`views/` - Contains the page views that display data to the app\
`sql/db_setup.sql` - Responsible for creating the tables in the database

## Useful Commands:
>### Starting the application locally:
>```bash
>npm start
>```
> 
>### Running the db locally using docker:
>```bash
>docker compose up -d
>docker exec -it sharedspacemysql mysql -u root -p --default-character-set=utf8mb4
>```
