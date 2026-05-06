# Stack
- Frontend: Next.js 16 (App Router), React, Tailwind CSS
- Backend: Spring Boot 3.x, Java 17
- DB migrations: Flyway (migrations en src/main/resources/db/migration)
- Package manager: npm (frontend), Maven (backend)

# Estructura
- /frontend → Next.js app
- / → Spring Boot app

# Convenciones

- Migrations Flyway: V{número}__{descripcion}.sql
- Entidades JPA en /model, repositorios en /repository, controladores en / controller

# Comandos
- Frontend: pnpm dev / pnpm build
- Backend: ./mvnw spring-boot:run