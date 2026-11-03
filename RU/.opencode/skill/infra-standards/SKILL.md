---
name: infra-standards
description: Стандарты инфраструктуры для devops — процедура обнаружения, обязательные правила, референсные шаблоны Dockerfile/compose/CI/K8s.
---

# infra-standards

Для кого: devops.

## Поиск официальной документации

- Используйте `fetch` MCP для известных официальных документов и `ddg-search` MCP для поиска.
- Используйте `webfetch` только как fallback, когда `fetch` недоступен.
- Используйте `context7`, только если документация соответствующих инструментов/библиотек там покрыта.
- Цитируйте официальный источник, версию и тег образа в infra-отчёте; если MCP-инструменты недоступны, следуйте локальным паттернам проекта и зафиксируйте ограничение.

## Обнаружение (шаг 0, всегда первым)

- Docker (Dockerfile(s), compose-файлы)
- CI/CD (.github/, .gitlab-ci.yml и т.д.)
- IaC (terraform/ и т.д.)
- Окружения (маркеры dev/staging/prod, файлы .env, .env.example)

Следуйте найденным платформам и паттернам; не вводите параллельную платформу без обоснования.

## Результаты

Dockerfile(s); docker-compose профили dev/prod; `.env.example`; скрипты запуска/миграций; инструкции по развёртыванию.

## Обязательные правила

- Фиксируйте версии образов (не `latest`).
- Проверяйте локальную сборку перед отчётом.
- Секреты только через переменные окружения; никогда в образах, compose-файлах или VCS.
- Multi-stage сборки.
- Non-root пользователь в контейнерах.
- Определён healthcheck.
- Лимиты ресурсов в compose/K8s.
- Тесты запускаются в CI.
- Путь развёртывания: staging → prod.
- Процедура отката задокументирована.

## Референсный Dockerfile

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

## Референсный compose (профиль prod)

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

Отчёт: `06-integration/infra-report.md` — статус, команды, правки, расхождения, исполняемые доказательства, сводка self-review (шапка согласно AGENTS.md §9).
