# Liam & Hannah: wedding website

Static site on GitHub Pages at https://liamandhannah.com (repo: ibhannahlyons/ibhannahlyons.github.io)

No build step. Edit the files, commit, push, and GitHub Pages republishes in a minute or two.

## Pages

| File | Page |
|---|---|
| `index.html` | Home / hero |
| `story.html` | Our story + Through the years gallery |
| `party.html` | Wedding party (Team Hannah & Team Liam) |
| `details.html` | Date, venue, schedule |
| `travel.html` | Hotels, airports, things to do |
| `cottages.html` | Stay at the Mill: how to book a cottage (linked from Travel) |
| `registry.html` | Honeymoon fund |

Unfinished bits are marked with `<!-- TODO -->` comments. Search for `TODO` to find them all.

## Colors

The site uses a dark theme only (jewel violets and orchid pinks, with mirror-silver buttons and hero
names). The colors are the tokens at the top of `css/style.css`.

## Honeymoon fund

**Right now the page shows only "Contribute any amount."** The experience ideas are kept in
`data/experiences.json` but hidden. To show them again, add `data-show-ideas` to the fund grid in
`registry.html`: `<div class="grid fund-solo" data-fund data-show-ideas>` (and drop `fund-solo`).

**Add or change an experience:** edit `data/experiences.json`.

```json
{
  "id": "sunset-dinner",              // short unique id
  "title": "Sunset dinner for two",   // also becomes the Venmo note
  "description": "A long, candlelit dinner...",
  "amount": 75,                        // suggested contribution (prefilled in Venmo)
  "photo": "img/honeymoon/dinner.jpg"
}
```

Put experience photos in `img/honeymoon/` (around 1200px wide, under 400 KB).

Every Contribute button opens
`https://venmo.com/?txn=pay&recipients=Hannah-Lyons-12&amount=…&note=…&audience=private`.
The "Contribute any amount" card leaves out the amount.

**Before invites go out:** tap a few Contribute buttons on an iPhone *and* an Android phone and check that the amount and note are prefilled. On desktop Venmo may only open the profile, which is why the page shows a QR code there.

## Stay at the Mill (cottages page)

`cottages.html` explains how to book a cottage at the Mill. It's linked from the "Where to stay"
cards on `travel.html`. It used to be a hidden, passphrase-only page; the old secret address
(`cottages-8fd2a997fd810f79.html`) now just redirects to `cottages.html` so links already shared keep working.

### Cottage hold

The Mill holds cottages A–E + H for Friday and all cottages for Saturday until **Feb 15, 2027**, then releases
them. The page doesn't list cottages or availability (too much to keep current); it tells guests to call
Rosalie at (804) 372-9810, ext. 2 to see what's still open.

## Wedding party

`party.html` builds its zigzag of polaroids from `data/party.json`: a `hannah` list and a `liam` list,
each person with `name`, `role` (e.g. "Maid of Honor" or "Matron of Honor", "Bridesmaid", "Best Man", "Groomsman"),
`relation` (e.g. "Hannah's sister") and `photo`. Put photos in `img/party/` (portrait, about
800px tall) and set `"photo": "img/party/their-name.jpg"`. With no photo, a "Photo coming soon"
placeholder shows. "Maid/Matron of Honor" and "Best Man" get a filled badge automatically.

**Secret flip photos (groomsmen):** add `"flipPhoto": "img/party/their-name.jpg"` next to `photo` and the
polaroid shows `photo` (the nice one) first, then turns over to `flipPhoto` (the bad one) on tap. No hint on
the page, on purpose. Shawn is set up this way: `shawn-good.jpg` front, `shawn.jpg` back.

## Through the years gallery (Our Story page)

Photos live in `img/years/` (with a `thumbs/` subfolder; don't edit that by hand), listed in `data/years.json`.

**Remove photos:** delete them from `img/years/`, then run
`python tools/galleries.py sync` to clear their thumbnails and rebuild the list.

**Add photos:** put the originals in any folder and run
`python tools/galleries.py import <that folder> years`. They're resized and added.

**Dates (Through the years):** each photo in `data/years.json` has a `date` (e.g. "March 2023")
shown under it. Edit it there; sync keeps it.
Imported photos are named by the date they were taken, so the gallery stays in time order.

Photos used elsewhere on the site (the home page hero, page banners, honeymoon cards) live in `img/site/`,
so deleting gallery photos never breaks a page.

## Link previews & calendar

- Every page has link-preview tags (`og:*`) so texted/shared links show a title, description and photo.
  Preview images are 1200×630 crops in `img/share/`.
- `liam-and-hannah-wedding.ics` is the "Apple / Outlook" calendar file (4:00–11:00 pm Eastern on
  March 18, 2028); the "Google Calendar" option is a link built from the same details.
- These use the full site address `https://liamandhannah.com/` (the page `<head>`s, the `.ics` file,
  and the Google Calendar links on `index.html` and `details.html`).

## Lucky clover hunt

One clover is hidden on each page (Home, Our Story, Wedding Party, Details, Travel, Honeymoon Fund,
Stay at the Mill). Where each one hides is the `SPOTS` list in `js/main.js`; add or remove a page there
and the "x of 7 found" count in the footer follows. Progress is saved in the visitor's browser.

## Custom domain (liamandhannah.com)

The domain is live. Its DNS has the four GitHub Pages `A` records for the apex and a `www` `CNAME` to
`ibhannahlyons.github.io`. Keep the `CNAME` file in this repo: deleting it turns the custom domain off.

## After changing CSS, JavaScript or the SVG sprite

Pages load `css/style.css`, `js/main.js`, `js/party.js`, `js/registry.js` and `img/botanical.svg` with a
`?v=...` tag (`js/party.js` also uses it for the clovers it draws). When you change one of those files,
bump its tag everywhere it appears (search for `?v=`) so browsers fetch the new version and nobody gets
a stale copy.

## Preview locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.
