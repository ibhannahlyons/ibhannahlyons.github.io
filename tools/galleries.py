"""Keep the Our Story galleries in sync with their photo folders.

    python tools/galleries.py sync
        After deleting photos from img/years/, removes their leftover
        thumbnails and rebuilds data/years.json.

    python tools/galleries.py import <folder> years
        Resizes original photos from <folder> into the gallery (2000px web copy +
        700px thumbnail, metadata stripped), then syncs. Files are named by the
        date they were taken, so the gallery runs in time order.

Captions: data/<gallery>.json entries may carry "date", "place" and "caption".
Edit them there; sync keeps them.

Needs Pillow (pip install pillow). For iPhone .heic photos also: pip install pillow-heif
For raw .dng photos also: pip install rawpy
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

SITE = Path(__file__).resolve().parent.parent
GALLERIES = ("years",)
EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".dng"}

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass


def save(im, path, size, quality):
    im = im.copy()
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)


def load_list(gallery):
    path = SITE / "data" / f"{gallery}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def write_list(gallery, photos):
    path = SITE / "data" / f"{gallery}.json"
    path.write_text(json.dumps(photos, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


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
        old = {p["file"]: p for p in load_list(g)}
        photos = []
        for f in fulls:
            thumb = thumb_dir / f.name
            if not thumb.exists():
                save(Image.open(f).convert("RGB"), thumb, 700, 74)
            with Image.open(thumb) as t:
                # keep any date/place/caption already written for this photo
                photos.append({**old.get(f.name, {}), "file": f.name, "w": t.width, "h": t.height})
        write_list(g, photos)
        print(f"{g}: {len(photos)} photos")


def open_any(path):
    if path.suffix.lower() == ".dng":
        import rawpy
        with rawpy.imread(str(path)) as raw:
            return Image.fromarray(raw.postprocess(use_camera_wb=True))
    return Image.open(path)


def date_taken(path):
    """EXIF capture date, or a yyyymmdd date in the filename, or None."""
    try:
        exif = Image.open(path).getexif()
        stamp = exif.get_ifd(0x8769).get(36867) or exif.get(306)
        if stamp:
            return datetime.strptime(str(stamp)[:19], "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    m = re.search(r"(20\d{2})(\d{2})(\d{2})", path.stem)
    if m:
        try:
            return datetime(int(m[1]), int(m[2]), int(m[3]))
        except ValueError:
            pass
    return None


def import_photos(folder, gallery):
    if gallery not in GALLERIES:
        sys.exit(f"gallery must be one of {GALLERIES}")
    out = SITE / "img" / gallery
    out.mkdir(parents=True, exist_ok=True)
    dates = {}
    for src in sorted(Path(folder).iterdir()):
        if src.suffix.lower() not in EXTS:
            continue
        taken = date_taken(src)
        slug = re.sub(r"[^a-z0-9]+", "-", src.stem.lower()).strip("-")
        name = f"{taken:%Y-%m-%d}-{slug}.jpg" if taken else f"undated-{slug}.jpg"
        try:
            im = ImageOps.exif_transpose(open_any(src)).convert("RGB")
        except Exception as e:  # unreadable file, e.g. .heic without pillow-heif
            print(f"  skipped {src.name}: {e}")
            continue
        save(im, out / name, 2000, 80)
        if taken:
            dates[name] = f"{taken:%B %Y}"
        print(f"  added {gallery}/{name}")
    sync()
    photos = load_list(gallery)
    for p in photos:
        if p["file"] in dates and "date" not in p:
            p["date"] = dates[p["file"]]
    write_list(gallery, photos)


if __name__ == "__main__":
    if sys.argv[1:2] == ["sync"]:
        sync()
    elif sys.argv[1:2] == ["import"] and len(sys.argv) == 4:
        import_photos(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
