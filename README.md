# Solaris Mission Clock

Widget horario animado para Notion, publicado con GitHub Pages.

Esta versión usa selección de layout por JavaScript según el tamaño real del iframe. No depende de un único breakpoint CSS: cambia entre `micro`, `compact`, `low`, `wide` y `tall`.

## Funciones

- Hora 24 h en `Europe/Madrid`.
- Actualización cada segundo.
- Temporada automática:
  - empieza el 1 de septiembre
  - termina el 31 de agosto
  - cambia sola: `2025/26 → 2026/27 → 2027/28`
- Barras de temporada, mes, semana y día.
- Órbita animada con estela ligada al cohete.
- Responsive real para iframes de Notion.

## Crear repo nuevo

```bash
git init
git add .
git commit -m "Initial Solaris mission clock"
git branch -M main
gh repo create solaris-clock-widget --public --source=. --remote=origin --push
```

## GitHub Pages

```txt
Settings → Pages → Build and deployment → GitHub Actions
```

## Embeber en Notion

```txt
/embed
```

Pega la URL de GitHub Pages.
