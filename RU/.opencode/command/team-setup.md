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
9. Спросить про компакцию по контрольным точкам (`compact_policy`): `plugin` (рекомендуется — плагин team-compact компактит сессию автоматически после каждого шага пайплайна) / `prompt` (team-lead публикует строку `[COMPACT]`, заказчик компактит вручную ctrl+x c).
10. Спросить про автопродолжение после компакции (`after_compaction_auto`): on (рекомендуется — конвейер продолжает сам после компакции каждого шага; team-lead сначала перечитывает state.json) / off (team-lead после каждой компакции ждёт заказчика). Спрашивать только при `compact_policy` = `plugin`; при `prompt` записать `false` (ручная компакция не продолжает автоматически).
11. Создать `team-workspace/<slug>/` с директориями 00-requirements … 08-delivery, `state.json` (схема по AGENTS.md §10, settings заполнены из шагов 6–10) и `models.json`.
12. `git init` + первичный коммит, если репозитория нет.
13. Отчитаться заказчику: режим heartbeat; режим запуска; учёт токенов; политика компакции; автопродолжение; напоминание перезапустить opencode для применения моделей.
14. Принять ТЗ.

## Режим `--settings`

- Без опроса моделей. Без пересоздания workspace.
- Только вопросы режимов: heartbeat, launch_mode, tokens_log, compact_policy, after_compaction_auto.
- Обновить `state.json → settings`; удалить устаревшие поля `custom_flow` / `show_subagent_prompt`.
- `settings.regression_mode` здесь НЕ настраивается (team-lead спрашивает перед финальным тестированием).
