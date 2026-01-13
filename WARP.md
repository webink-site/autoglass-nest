# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NestJS REST API backend for an autoglass website with PostgreSQL database, Redis caching, and Docker deployment. Built with Prisma ORM and designed to work with a Nuxt.js frontend.

## Development Commands

### Initial Setup
```bash
# Use Node.js 20 (if nvm is installed)
nvm use

# Install dependencies
npm install

# Start PostgreSQL database
docker compose up -d postgres

# Run database migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed

# Generate Prisma client (after schema changes)
npx prisma generate
```

### Development
```bash
# Start with hot reload (default port 3001)
npm run start:dev

# Start with debugger
npm run start:debug

# Build for production
npm run build

# Run production build locally
npm run start:prod
```

### Database Management
```bash
# Apply migrations to development database
npx prisma migrate dev

# Apply migrations in production (no prompts)
npx prisma migrate deploy

# Open Prisma Studio (visual database editor)
npx prisma studio

# Seed database with test data
npx prisma db seed
```

### Testing & Quality
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov

# Run linter with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

### Docker Operations
```bash
# Development environment (PostgreSQL only)
docker compose up -d

# Stop development environment
docker compose down

# Production environment (full stack)
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f api
```

## Architecture

### Module Structure
The application follows NestJS modular architecture with these core modules:

- **GlobalsModule** (`src/globals/`): Site-wide settings (contact info, address, coordinates)
- **ServiceModule** (`src/service/`): Auto glass services with pricing by transport type
- **WrapModule** (`src/wrap/`): Vehicle wrapping services with elements and packages
- **GalleryModule** (`src/gallery/`): Image/video gallery for services
- **FileModule** (`src/file/`): File upload handling (images/videos)
- **FormModule** (`src/form/`): Form submissions from frontend
- **PrismaModule** (`src/prisma/`): Global database client (exports PrismaService)

### Database Schema (Prisma)
Key entities and relationships:

**Service** - Main service entity
- Has pricing by transport type (SEDAN, BUSINESS, SUV, MINIBUS) with variations
- Multiple images: `cardImage`, `headerImage`, `video` (single references)
- `galleryItems` array for additional images
- All images reference `GalleryItem` model

**WrapElement & WrapPackage** - Vehicle wrapping
- `WrapElement`: Individual wrapping elements with prices by transport type
- `WrapPackage`: Predefined bundles of elements (stores element IDs)

**GalleryItem** - File storage
- Polymorphic: can belong to Service gallery or be standalone
- `fileType` enum: IMAGE or VIDEO
- Related services via `serviceCardImages`, `serviceHeaderImages`, `serviceVideos`

**Globals** - Site configuration (single row, ID 1)

### Transport Types
All pricing uses the `TransportType` enum:
- `SEDAN` - Легковые (sedans)
- `BUSINESS` - Бизнес-класс (business class)
- `SUV` - Джипы / Минивены (SUVs/minivans)
- `MINIBUS` - Микроавтобусы (minibuses)

### File Uploads
- Files stored in `uploads/` directory at project root
- Served statically via NestJS at `/uploads` path
- `ServeStaticModule` configured in `app.module.ts`
- Max file size: 10MB (configurable via `MAX_FILE_SIZE` env var)

### API Structure
All API endpoints prefixed with `/api` (likely via controller prefix or global prefix):
- `GET /api/globals` - Site settings
- `GET /api/services` - List all services
- `GET /api/services/:id` - Service details with pricing and gallery
- `GET /api/wrap/elements` - Wrapping elements
- `GET /api/wrap/packages` - Wrapping packages
- `GET /api/gallery` - Gallery items
- `POST /api/files/upload` - Upload files

### CORS Configuration
Development origins allowed:
- `http://localhost:3000` (Nuxt.js frontend)
- `http://localhost:3001` (API itself)
- `http://localhost:5173` (Vite dev server)

Production: Configure via `ALLOWED_ORIGINS` environment variable

## Deployment

### GitHub Actions CI/CD
Auto-deploys to VPS on push to `main` branch:

1. **Test Job**: Runs linting, tests, migrations on PostgreSQL test database
2. **Build Job**: Creates Docker image, pushes to GitHub Container Registry
3. **Deploy Job**: SSH to VPS, pulls image, restarts containers

Required GitHub Secrets:
- `VPS_HOST`, `VPS_USER`, `SSH_PRIVATE_KEY`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `JWT_SECRET`, `REDIS_PASSWORD`

### Production Stack
- Nginx reverse proxy with SSL (ports 80/443)
- NestJS API (port 3001) in Docker
- PostgreSQL database
- Redis for caching

Full deployment instructions in `DEPLOYMENT.md`

## Environment Variables

Copy `.env.example` to `.env` for local development. Key variables:

```
DATABASE_URL=postgresql://user:password@host:port/dbname?schema=public
JWT_SECRET=<32+ character secure random string>
JWT_EXPIRES_IN=7d
REDIS_PASSWORD=<secure password>
NODE_ENV=development|production
PORT=3001
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=10485760
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

## Code Style & Conventions

- Uses ESLint with Prettier for code formatting
- TypeScript strict mode enabled
- Class-based controllers and services (NestJS standard)
- DTOs use `class-validator` and `class-transformer` for validation
- All database access through Prisma ORM (no raw SQL)

### Common Patterns

**Creating a new module:**
```bash
nest g module feature
nest g controller feature
nest g service feature
```

**Adding Prisma model access:**
1. Define model in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_feature`
3. Inject `PrismaService` into service (it's global)

**File uploads:**
- Use `@UploadedFile()` decorator with `FileInterceptor`
- Files saved to `uploads/` directory
- Return file URL path for frontend

## Testing

- Tests use Jest framework
- Test files: `*.spec.ts` (unit) in `src/`
- E2E tests: `test/*.e2e-spec.ts`
- GitHub Actions runs tests with PostgreSQL service container
- Note: `--passWithNoTests` flag used in CI (minimal test coverage currently)

## Common Issues

**Prisma client not generated:**
```bash
npx prisma generate
```

**Database connection errors:**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running: `docker compose up -d postgres`
- Verify port 5433 (dev) or 5432 (prod) is not in use

**Port 3001 already in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**File upload permissions:**
- Ensure `uploads/` directory exists and is writable
- In Docker: directory created with correct ownership in Dockerfile

## Related Documentation

- Full deployment guide: `DEPLOYMENT.md`
- Database schema: `prisma/schema.prisma`
- API documentation: Swagger at `/api/docs` (when running)
- Frontend repository: Nuxt.js (separate repo)
