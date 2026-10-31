"""Keep the Our Story galleries in sync with their photo folders.

    python tools/galleries.py sync
        After deleting photos from img/engagement/ or img/years/, removes their
        leftover thumbnails and rebuilds data/engagement.json and data/years.json.

    python tools/galleries.py import <folder> <engagement|years>
        Resizes original photos from <folder> into the gallery (2000px web copy +
        700px thumbnail, metadata stripped), then syncs.

Needs Pillow (pip install pillow). For iPhone .heic photos also: pip install pillow-heif
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

SITE = Path(__file__).resolve().parent.parent
GALLERIES = ("engagement", "years")
EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass


def save(im, path, size, quality):
    im = im.copy()
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)


def sync():
    for g in GALLERIES:
        full_dir = SITE / "img" / g
        thumb_dir = full_dir / "thumbs"
        thumb_dir.mkdir(parents=True, exist_ok=True)
        fulls = sorted(full_dir.glob("*.jpg"))
        names = {f.name for f in fulls}
        for t in thumb_dir.glob("*.jpg"):
            if t.name not in names:
                t.unlink()
                print(f"  removed leftover thumbnail {g}/thumbs/{t.name}")
        photos = []
        for f in fulls:
            thumb = thumb_dir / f.name
            if not thumb.exists():
                save(Image.open(f).convert("RGB"), thumb, 700, 74)
            with Image.open(thumb) as t:
                photos.append({"file": f.name, "w": t.width, "h": t.height})
        (SITE / "data" / f"{g}.json").write_text(json.dumps(photos, indent=1) + "\n")
        print(f"{g}: {len(photos)} photos")


def import_photos(folder, gallery):
    if gallery not in GALLERIES:
        sys.exit(f"gallery must be one of {GALLERIES}")
    out = SITE / "img" / gallery
    out.mkdir(parents=True, exist_ok=True)
    for src in sorted(Path(folder).iterdir()):
        if src.suffix.lower() not in EXTS:
            continue
        name = re.sub(r"[^a-z0-9]+", "-", src.stem.lower()).strip("-") + ".jpg"
        try:
            im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        except Exception as e:  # unreadable file, e.g. .heic without pillow-heif
            print(f"  skipped {src.name}: {e}")
            continue
        save(im, out / name, 2000, 80)
        print(f"  added {gallery}/{name}")
    sync()


if __name__ == "__main__":
    if sys.argv[1:2] == ["sync"]:
        sync()
    elif sys.argv[1:2] == ["import"] and len(sys.argv) == 4:
        import_photos(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
