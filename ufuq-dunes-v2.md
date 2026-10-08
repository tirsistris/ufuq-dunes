# Ufuq v2 «Дюны» — перенос Page 2 из Figma в новый репо один в один

Цель: собрать живой прототип, который **совпадает с Figma Page 2** (14 фреймов, 2 темы) — те же шрифты, цвета, размеры, отступы. Не редизайн, не «по мотивам». Старый репо `ufuq-cove-share` не трогать: это v1 «до» для кейса.

## Источник правды — Figma (читать через Figma MCP)
Файл: https://www.figma.com/design/McEpqCTJzqND3gyGahm4ry — страница **Page 2**.

| Состояние | Night | Day |
|---|---|---|
| Home | 90:8017 | 90:8103 |
| 1 · Enter amount | 90:6627 | 90:7344 |
| 2 · Confirm | 90:6784 | 90:7495 |
| 3 · Calculating impact | 90:7298 | 90:7926 |
| 4 · Projected impact | 90:7233 | 90:7962 |
| 5 · Not enough money | 90:6915 | 90:7620 |
| 6 · Above channel limit | 90:7073 | 90:7772 |

Ссылка на фрейм: `https://www.figma.com/design/McEpqCTJzqND3gyGahm4ry?node-id=90-8017` (двоеточие → дефис).
Для каждого фрейма: `get_design_context` (размеры, отступы, стили) + `get_screenshot` (эталон). Цвета — из переменных Figma (коллекция «Fluid / tokens», режимы **Dunes Day / Dunes Night**), не с картинки. Если значение в разметке расходится с переменной — брать переменную и записать расхождение.

## Репо и стек
- Новая папка: `C:\Users\ADMIN\Desktop\rove bank\ufuq-dunes`, `git init`, новый проект Vercel `ufuq-dunes`.
- Статичный сайт: один `index.html` + `styles.css` + `app.js`, без фреймворков (как v1).
- Шрифт: **Inter** (variable, self-host в `/fonts`), как в Figma. Стили текста — из Figma (HIG/*, Ufuq/Amount 44): кегль, интерлиньяж, начертание один в один. `font-variant-numeric: tabular-nums` для сумм.
- Иконки: SVG из пака Миши Наера (round line, активный таб — round solid), брать те же, что в Figma: magnifying-glass, bell, x, backspace, exclamation-triangle, clock, calendar/arrows-left-right/person (line + solid). Источник: https://mishanaer-icons.vercel.app/icons/round/{line|solid}/{name}.svg
- Знак риала: официальный SAMA (U+20C1) как SVG — тот же контур, что в компоненте Figma «Riyal sign (SAMA)».
- Дюны экранов 3–4: экспортировать слой «Scene · vector» из фреймов 3/4 как SVG (обе темы), вставить как есть. Размытия Figma → CSS `filter: blur()`; матовая карточка → `backdrop-filter: blur(24px)`.
- Прод деплоит только Баатр: команды — в `C:\Users\ADMIN\Desktop\ufuq-case-review\deploy-dunes.txt`.

## Витрина (как в v1)
Телефон 390×844 + панель справа: **Theme** (Auto / Light / Dark) и **States** (Home, 1–6). Язык — только EN (AR в v2 не рисовали, кнопку AR не показывать). `?theme=light|dark|auto`, `?state=home|1..6`. Auto следит за `prefers-color-scheme`.

## Поведение (как прототип в Figma)
- Home → «Transfer by phone number» → 1.
- 1 → Continue → 2; крестик → Home.
- 2 → Confirm → 3; Back → 1.
- 3 → через 1500 мс сам → 4. На 3 кнопки нет.
- 4 → Done → Home.
- 5 и 6 — крестик → Home; ⌫ → 1.
- Клавиатура на 1 вводит сумму по-настоящему: > 5 650 → состояние 5, > 2 500 (и ≤ 5 650) → состояние 6, иначе Continue активна. Тексты и цифры — как во фреймах.
- Переходы: 240 мс ease-out между экранами, 160 мс внутри шторки (сумма/бар меняются на месте). Только WAAPI. `prefers-reduced-motion` → только прозрачность.

## Приёмка (вместо старых 57 стражей)
1. **Сверка рядом:** для каждого из 14 состояний — PNG приложения 390×844 @1x и `get_screenshot` фрейма рядом, плюс наложение 50%. Лист `compare-board.png`. Расхождение позиций > 2 px или любого цвета — красным, не чинить молча.
2. **Контраст** (скриптом, по токенам): главное число на небе ≥ 7 (худшее место неба), сегменты ≥ 3, текст ≥ 4.5. Эталоны из Figma: число 9.77/7.20; Available 14.8/11.0; Spent 7.62/4.65; Upcoming 4.20/3.32; CTA 5.53/4.81; ошибка 7.12/6.42 (ночь/день).
3. **Зоны нажатия ≥ 44** — проверка по DOM.
Без кадров ничего не принимается. Отчёт по пунктам.

## Шаги (каждый — СТОП после кадров)
- **s1:** каркас, Inter, токены обеих тем, витрина, Home Night/Day. Лист сверки только для Home.
- **s2:** шторка: состояния 1, 2, 5, 6 + клавиатура и логика суммы.
- **s3:** состояния 3, 4 (SVG-дюны, матовая карточка), все переходы.
- **s4:** полный лист сверки 14 состояний, контраст, зоны, `deploy-dunes.txt`.

## Вне объёма v2
Арабский/RTL; профиль и таб Account; «Add recipient» (кнопка есть, экрана нет — не вести никуда, не прятать).
