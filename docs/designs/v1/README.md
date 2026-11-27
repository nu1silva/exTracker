# exTracker designs

Clickable designs for the six tabs and the Add record form, in the Harbor theme.
Open `dashboard.html` in a browser. There is nothing to install or build; the
Archivo font loads from Google Fonts, with a system font when offline.

| File | Screen |
| --- | --- |
| `dashboard.html` | Dashboard |
| `accounts.html` | Accounts, with reconciling |
| `records.html` | Records, with filters and record details |
| `budgets.html` | Budgets |
| `analytics.html` | Analytics |
| `settings.html` | Settings |
| `add-record.html` | Add record, filled in. The empty form opens from the Add record button on every tab |

| File | Purpose |
| --- | --- |
| `theme.css` | Harbor colors and base type, light and dark. Use these tokens in the app |
| `components.css` | Buttons, fields, cards, rows, navigation and the phone layout (760px and below) |
| `parts/` | Navigation and the Add record form, shared by the screens |
| `prototype.js` | Makes the screens clickable. Not for the product |

## Light and dark

Light is the default: `class="ex ex-light"`. Dark is `class="ex"`. Switch in
Settings, Appearance, or add `?theme=dark` to a page's address.

## What is not real

- All names, accounts and amounts are sample data. "Today" is 25 November 2026.
- Nothing is saved except the theme choice.
- Month arrows, period menus, the Analytics account menu, exports, and the
  add, edit and delete buttons are drawn but do nothing. Save in the Add record
  form only closes it.

## Color rules

- Each category keeps its color in every chart. The order in `theme.css` is
  checked so that neighbors stay distinct for color-blind readers.
- Red is only for over the limit and for deleting. Being over the limit also
  gets a hatched bar and the word "over".
- Some category colors have low contrast on white, so always label them.
