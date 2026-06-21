# Docker Cleanup in Production (Coolify Server)

This server runs everything through **Coolify + Docker**: the frontend apps, the
Postgres database(s), and Coolify itself. Over time, deploys leave behind unused
images and build cache that eat disk space. This doc explains how to inspect and
safely reclaim that space.

> **Context:** the server has a single **50 GB** disk. There is no separate
> "SSD vs volume" — Docker volumes (where database data lives) are just
> directories on that same 50 GB disk.

---

## 1. Inspect before you clean

Always look before you delete. Run these first.

### `docker system df`

Shows a summary of what Docker is using, broken into four categories.

```bash
docker system df
```

Example output:

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          29        15        7.975GB   1.934GB (24%)
Containers      15        15        13.95MB   0B (0%)
Local Volumes   15        8         236.7MB   616B (0%)
Build Cache     36        17        1.685GB   0B
```

How to read it:

| Row | What it is | Notes |
|---|---|---|
| **Images** | Container images pulled/built for each app | Old deploy versions accumulate here — usually the biggest reclaimable chunk |
| **Containers** | Running/stopped containers | Tiny; the writable layer on top of images |
| **Local Volumes** | **Persistent data — this is where your databases live** | Do **not** blindly prune these (see warning below) |
| **Build Cache** | Intermediate layers from building images | Often 1–2 GB of reclaimable junk |

The **RECLAIMABLE** column tells you how much each category can free up.

### `df -h /` — overall disk usage

```bash
df -h /
```

Tells you how much of the 50 GB is actually used across the whole system (not
just Docker). This is the number to watch — if `Use%` climbs toward 80–90%, act.

### `free -h` — available RAM

```bash
free -h
```

Not disk, but the real constraint when adding more services (e.g. a second
Postgres). Keep a comfortable buffer of available RAM (~700 MB–1 GB+).

---

## 2. Cleanup commands (least → most aggressive)

### `docker image prune` — remove dangling images only

```bash
docker image prune
```

- **What it does:** removes only **dangling** images (untagged leftover layers).
- **When to run:** routine, safe maintenance. Run anytime.
- **Tradeoff:** none — it never touches images an app is using. May reclaim
  **0 B** if you have no dangling images (that's normal, not an error).

### `docker image prune -a` — remove all unused images

```bash
docker image prune -a
```

- **What it does:** removes every image **not currently used by a running
  container** — including old, still-tagged versions from previous deploys.
- **When to run:** when the `Images` RECLAIMABLE number is large (e.g. >1 GB) and
  you want the space back.
- **Tradeoff:** ⚠️ the **next deploy of each app is slower**, because Docker must
  re-pull/rebuild base layers it just deleted. Safe on Coolify (it rebuilds on
  deploy), just expect one slower build per app afterward.

### `docker builder prune` — clear build cache

```bash
docker builder prune
```

- **What it does:** clears the **Build Cache** (intermediate build layers).
- **When to run:** when `Build Cache` is large (often 1–2 GB) and disk is tight.
- **Tradeoff:** ⚠️ the **next image build is slower** since the cache is gone.
  No effect on running apps or data.

### `docker system prune` — broad cleanup

```bash
docker system prune
```

- **What it does:** removes stopped containers, dangling images, unused networks,
  and (with `-a`) all unused images. Add `--volumes` to also remove unused
  volumes — **see the warning below.**
- **When to run:** periodic deeper cleanup when several categories are bloated.
- **Tradeoff:** combines the slowdowns of the commands above. Prompts for
  confirmation before deleting.

---

## 3. ⚠️ NEVER do this on the production DB server

```bash
# DO NOT RUN — this can delete your database data
docker system prune --volumes
docker volume prune
```

- **Local Volumes hold your persistent database data.** Pruning volumes can
  **permanently delete a database** if its container isn't running at that moment
  (e.g. mid-redeploy, or a stopped service).
- There is no undo. Always leave volumes alone unless you have a **verified
  backup** and know exactly which volume you're removing.
- If you must remove a specific volume, identify it explicitly first:
  ```bash
  docker volume ls
  docker volume inspect <volume-name>
  ```

---

## 4. Recommended routine

1. **Inspect:** `docker system df` + `df -h /`.
2. **Safe pass (anytime):** `docker image prune`.
3. **If disk is getting tight (>80% used):**
   - `docker image prune -a` (reclaims old image versions)
   - `docker builder prune` (reclaims build cache)
   - Accept that the next deploy/build per app will be slower.
4. **Re-check:** `docker system df` to confirm space was reclaimed.
5. **Never** touch volumes without a backup and a specific target.

> Rule of thumb: on a 50 GB box, images + build cache are the things that grow.
> Database **volumes** stay small (hundreds of MB) — leave them alone.
