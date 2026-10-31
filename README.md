# Hannah & Liam: wedding website

Static site on GitHub Pages: https://ibhannahlyons.github.io (later: https://liamandhannah.com)

No build step. Edit the files, commit, push, and GitHub Pages republishes in a minute or two.

## Pages

| File | Page |
|---|---|
| `index.html` | Home / hero |
| `story.html` | Our story + engagement gallery |
| `details.html` | Date, venue, schedule |
| `travel.html` | Hotels, airports |
| `registry.html` | Honeymoon fund |

Placeholder text is marked with `<!-- TODO -->` comments. Search for `TODO` to find them all.

## Honeymoon fund

**Add or change an experience:** edit `data/experiences.json`.

```json
{
  "id": "sunset-dinner",              // short unique id, used by funds.json
  "title": "Sunset dinner for two",   // also becomes the Venmo note
  "description": "A long, candlelit dinner...",
  "amount": 75,                        // suggested contribution (prefilled in Venmo)
  "goal": 300,                         // optional; total for the progress bar
  "photo": "img/honeymoon/dinner.jpg"
}
```

Put experience photos in `img/honeymoon/` (around 1200px wide, under 400 KB).

**Update progress:** when a gift comes in, edit `data/funds.json` and add to that experience's total:

```json
{ "sunset-dinner": 150 }
```

The card then shows "$150 of $300 funded". Leave an id out (or remove `goal`) to hide its bar.

Every Contribute button opens
`https://venmo.com/?txn=pay&recipients=Hannah-Lyons-12&amount=…&note=…&audience=private`.
The "Contribute any amount" card leaves out the amount.

**Before invites go out:** tap a few Contribute buttons on an iPhone *and* an Android phone and check that the amount and note are prefilled. On desktop Venmo may only open the profile, which is why the page shows a QR code there.

## Family-only cottages page

The "Family & wedding party" link at the bottom of `travel.html` asks for a passphrase. The page it opens is
`cottages-<hash>.html`, where `<hash>` is the first 16 characters of the SHA-256 of the passphrase
(lowercased, with extra spaces trimmed). Nothing on the public pages links to it, and it is marked `noindex`.

To change the passphrase, rename the file:

```bash
python -c "import hashlib;print(hashlib.sha256('new passphrase'.encode()).hexdigest()[:16])"
git mv cottages-OLDHASH.html cottages-NEWHASH.html
```

This keeps casual guests out, but it is not real security. The repo is public, so anyone browsing it on GitHub
can see the file. Don't put anything truly private on that page.

### Cottage timeline

| Dates | Who can book |
|---|---|
| Now – Feb 18, 2027 | Family & wedding party (passphrase page) |
| Feb 18 – Mar 17, 2027 | All invited guests |
| Mar 17, 2027 | The venue opens the cottages to the public online |

**On Feb 18, 2027, open the page to all guests:**
1. On `travel.html`, add a card next to the Residence Inn that links to `cottages-<hash>.html` ("Stay at the Mill").
2. On the cottages page, change the intro ("we're giving you first pick... keep this page between us") to welcome all guests.
3. Update the rehearsal-dinner "both nights" note once that plan is settled.

## Gallery

Photos live in `img/gallery/` (2000px) and `img/gallery/thumbs/` (700px), listed in `data/gallery.json`.
The originals are not in this repo.

## Custom domain (liamandhannah.com)

Do these in order, after buying the domain:

1. At your domain registrar, add DNS records:
   - `A` records for `@` (the apex) → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `ibhannahlyons.github.io`
2. In this repo, add a file named `CNAME` (no extension) containing one line: `liamandhannah.com`. Commit and push.
   (Or set it under Settings → Pages → Custom domain, which creates the same file.)
3. Wait for DNS to resolve (minutes to a few hours). Settings → Pages will show a green check.
4. Tick **Enforce HTTPS** in Settings → Pages.

Don't add the `CNAME` file before DNS is set up. Otherwise github.io will redirect to a domain that doesn't work yet.

## Preview locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.
