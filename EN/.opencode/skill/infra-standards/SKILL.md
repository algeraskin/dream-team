---
name: infra-standards
description: Infrastructure standards for devops — discovery procedure, mandatory rules, reference Dockerfile/compose/CI/K8s templates.
---

# infra-standards

For whom: devops.

## Discovery (Step 0, always first)

- Docker (Dockerfile(s), compose files)
- CI/CD (.github/, .gitlab-ci.yml, etc.)
- IaC (terraform/, etc.)
- Environments (dev/staging/prod markers, .env files, .env.example)

Follow found platforms and patterns; do not introduce a parallel platform without justification.

## Deliverables

Dockerfile(s); docker-compose dev/prod profiles; `.env.example`; run/migration scripts; deployment instructions.

## Mandatory rules

- Pin image versions (no `latest`).
- Verify local build before reporting.
- Secrets only via environment variables; never in images, compose files, or VCS.
- Multi-stage builds.
- Non-root user in containers.
- Healthcheck defined.
- Resource limits in compose/K8s.
- Tests run in CI.
- Deployment path: staging → prod.
- Rollback procedure documented.

## Reference Dockerfile

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
RUN useradd --create-home appuser
WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')" || exit 1
CMD ["python", "-m", "app"]
```

## Reference compose (prod profile)

```yaml
services:
  app:
    build: .
    image: app:1.0.0
    restart: unless-stopped
    env_file: .env
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Report: `06-integration/infra-report.md` — status, commands, edits, discrepancies, executable evidence, self-review summary (header per AGENTS.md §9).
