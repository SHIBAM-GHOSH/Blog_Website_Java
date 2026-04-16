# Stellar Blogs

`Stellar Blogs` is a Spring Boot blog application with a custom frontend, MySQL persistence, user authentication, admin moderation, inline media support, and a news-style blog reading page.

## Technologies Used

- Java 25
- Spring Boot 4.0.4
- Spring Web MVC
- Spring Data JPA
- MySQL Connector/J
- Maven
- HTML, CSS, JavaScript

## Main Features

- Create blog posts with simple text paragraph.
- Edit your own posts
- Category-based homepage sections


## Project Structure

- Backend Java code: `src/main/java`
- Frontend static files: `src/main/resources/static`
- App configuration: `src/main/resources/application.properties`


## Run the Application

From the project folder:

```powershell
mvn spring-boot:run
```


## Application URL

- Frontend: `http://localhost:8080`


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
