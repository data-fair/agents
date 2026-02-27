# Contributing to Agents

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### Development Setup

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Start development dependencies (MongoDB, Elasticsearch, etc.):
   ```bash
   npm run dev-deps
   ```

3. Start the API server:
   ```bash
   npm run dev-api
   ```

4. Start the UI development server:
   ```bash
   npm run dev-ui
   ```

The application will be available at `http://localhost:8080` (or the port specified in `.env`).

### Running Tests

```bash
npm run test
```

### Code Style

This project uses:
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting (via ESLint)
- Conventional Commits for commit messages

Run linting:
```bash
npm run lint
```

Run linting with auto-fix:
```bash
npm run lint-fix
```

### Building

To build the application for production:

```bash
npm run build
```

### Docker

Build the Docker image:
```bash
docker build -t agents .
```

Run the container:
```bash
docker run -p 8080:8080 agents
```
