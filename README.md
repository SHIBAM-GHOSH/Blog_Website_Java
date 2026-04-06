# Stellar Blogs

`Stellar Blogs` is a Spring Boot blog application with a custom frontend, MySQL persistence, user authentication, admin moderation, inline media support, and a news-style blog reading page.

## Technologies Used

- Java 25
- Spring Boot 4.0.4
- Spring Web MVC
- Spring Data JPA
- MySQL Connector/J
- Jackson Databind
- Maven
- HTML, CSS, JavaScript

## Main Features

- User registration and login with email and password
- Guest mode for browsing posts without creating content
- Admin account for removing posts and user accounts
- Create blog posts with category, cover image, top video, and inline images between paragraphs
- Edit your own posts
- View posts on a dedicated blog open page with a news-style layout
- Category-based homepage sections
- Media upload support for images and videos

## Project Structure

- Backend Java code: `src/main/java`
- Frontend static files: `src/main/resources/static`
- App configuration: `src/main/resources/application.properties`

## Prerequisites

- JDK 25 installed
- Maven installed and available in `PATH`
- MySQL Server running locally
- Internet connection for the first Maven dependency download

## Database Configuration

The app uses this local MySQL database by default:

- Database: `blogdb`
- URL: `jdbc:mysql://localhost:3306/blogdb?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC`

Update these values in `src/main/resources/application.properties` if your local setup is different:

- `spring.datasource.username`
- `spring.datasource.password`

## Default Admin Account

The app creates a default admin account from `application.properties`:

- Email: `admin@stellarblogs.local`
- Password: `Admin@12345`

Change these values before using the project in a real environment.

## Run the Application

From the project folder:

```powershell
mvn spring-boot:run
```

If port `8080` is already in use, run it on `8081`:

```powershell
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

## Application URL

- Frontend: `http://localhost:8080`
- Or `http://localhost:8081` if you start it on port `8081`

## Important API Endpoints

- `GET /api/blogs` -> get all blog posts
- `GET /api/blogs/{id}` -> get a single blog post
- `POST /api/blogs` -> create a post
- `PUT /api/blogs/{id}` -> edit a post
- `GET /api/auth/session` -> get current login session
- `POST /api/auth/register` -> register a user
- `POST /api/auth/login` -> log in
- `POST /api/auth/logout` -> log out
- `GET /api/admin/users` -> admin user list
- `DELETE /api/admin/users/{id}` -> admin delete user
- `DELETE /api/admin/blogs/{id}` -> admin delete post

## Build the Project

```powershell
mvn clean package
```

Run the generated jar:

```powershell
java -jar target\stellar-blogs-0.0.1-SNAPSHOT.jar
```

## Run Tests

```powershell
mvn test
```

## Notes

- The frontend is served directly by Spring Boot from `src/main/resources/static`
- Uploaded files are stored in the local `uploads` folder
- The project now uses Maven only
