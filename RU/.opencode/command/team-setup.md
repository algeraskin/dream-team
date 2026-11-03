---
description: Онбординг проекта — опрос моделей для всех 12 ролей, настройка режимов, создание workspace
agent: team-lead
---

# /team-setup — онбординг проекта

Агент: только team-lead. Аргументы: $ARGUMENTS (slug проекта или `--settings` для перенастройки только режимов).

## Стандартный режим

1. Slug проекта — из аргументов или вопросом заказчику через инструмент `question`.
2. Проверка повторного онбординга: если `team-workspace/<slug>/models.json` существует, показать его и спросить, оставить или перенастроить.
3. Список доступных моделей: выполнить `opencode models` через bash; при недоступности — известный список провайдеров.
4. Опрос по всем 12 ролям по одной через `question`:
   team-lead, analyst, architect, scout, researcher, backend-dev, frontend-dev, code-reviewer, security, tester, integrator, devops.
   Вопрос: «Модель для роли `<роль>`» с подсказками и рекомендациями.
5. Записать `model: <provider/model>` во фронтматтер каждого `.opencode/agent/<роль>.md` и в `team-workspace/<slug>/models.json` (канонический источник).
6. Спросить про режим прогресса (heartbeat): on (рекомендуется) / off.
7. Спросить про режим запуска субагентов: `auto` (рекомендуется) / `confirm` / `custom-flow`.
8. Спросить про учёт токенов: on (рекомендуется) / off.
9. Создать `team-workspace/<slug>/` с директориями 00-requirements … 08-delivery, `state.json` (схема по AGENTS.md §10, settings заполнены из шагов 6–8) и `models.json`.
10. `git init` + первичный коммит, если репозитория нет.
11. Отчитаться заказчику: режим heartbeat; режим запуска; учёт токенов; напоминание перезапустить opencode для применения моделей.
12. Принять ТЗ.

## Режим `--settings`

- Без опроса моделей. Без пересоздания workspace.
- Только вопросы режимов: heartbeat, launch_mode, tokens_log.
- Обновить `state.json → settings`; удалить устаревшие поля `custom_flow` / `show_subagent_prompt`.
- `settings.regression_mode` здесь НЕ настраивается (team-lead спрашивает перед финальным тестированием).
