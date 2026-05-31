# Character art for the animated ninja

The on-page ninja picks the best art it finds, automatically. You don't touch
any code — just drop a file in here.

## Easiest: one still image  →  `naruto.png`

Save the sprite you want as **`public/sprites/naruto.png`**.

That's it. The chibi placeholder is instantly replaced by your image, shown at
full size and animated with CSS motion (bobs when idle, leans when you drag it,
lunges + throws a kunai when clicked). No config, no frame counting.

- Use a PNG with a transparent background for best results.
- Any size works; it's scaled to ~92px tall with crisp pixels.

## Advanced: a full animation sheet  →  `ninja-sheet.png`

If you have a real sprite sheet with separate frames per action (idle / run /
throw / jump), save it as **`public/sprites/ninja-sheet.png`** and set the frame
size + `[col,row]` frames in `src/canvas/characters.ts` to match it. The
`SpriteAnimator` engine then plays true frame-by-frame animation. This takes
priority over the still image when present.

## Sourcing

- Free & legal (CC0): the **Ninja Adventure** pack — https://pixel-boy.itch.io/ninja-adventure-asset-pack
- For other sprites you find: this is your personal project, so sourcing the
  file is your call. Drop it in as above and it just works. (Don't commit
  copyrighted game rips to a *public* repo if you can avoid it.)

Until you add a file, the built-in pixel chibi is shown so the site is never
broken.
