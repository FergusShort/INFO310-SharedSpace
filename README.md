# INFO310 - SharedSpace

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
> &nbsp;

