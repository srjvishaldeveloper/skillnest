# SkillNest LMS

**SkillNest — Learn. Grow. Get Hired.**

A modern, skill-based Learning Management System (LMS) for courses and career
learning. SkillNest provides role-based dashboards for Admins, Instructors,
Learners, and Guardians, covering courses, batches, sessions, assessments,
projects, scores, attendance, events, and notices.

## Tech Stack

- **Next.js 14** (App Router, Server Components, Server Actions)
- **TypeScript**
- **PostgreSQL** with **Prisma** ORM
- **Redis** + **BullMQ** (async media compression pipeline)
- **Tailwind CSS**
- **Custom JWT authentication** (`jose` + `bcryptjs`, httpOnly cookies)
- **AWS S3** file storage (images, videos, PDFs)
- **FFmpeg** (video compression & HLS streaming)
- **Sharp** (image compression)
- **hls.js** (HLS video playback)

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** (local or Docker)
- **Redis** (local or Docker) — required for video uploads
- **FFmpeg** (local install, or Docker for deployment)

## Quick Start (Docker — recommended for PostgreSQL + Redis)

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Copy env and edit values
cp .env.example .env

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed sample data
npx prisma db seed

# Start dev server (Next.js + media worker)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. Minimum required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret (min 32 chars) |
| `REDIS_URL` | Redis connection string (e.g. `redis://127.0.0.1:6379`) |
| `AWS_REGION` | S3 bucket region |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_S3_BUCKET_URL` | S3 bucket public URL |

See `.env.example` for all optional variables (SSO, payments, AI tutor, email, etc.).

## FFmpeg Setup

### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to a folder (e.g. `C:\ffmpeg`)
3. Set `FFMPEG_DIR=C:\ffmpeg` in `.env`
4. Or add it to your system PATH

### Linux / macOS
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

## Database

```bash
# Run pending migrations
npx prisma migrate dev

# Seed with test accounts
npx prisma db seed
```

See [docs/auth-notes.md](docs/auth-notes.md) for seeded test accounts.

## Running the App

```bash
# Development (Next.js + media worker together)
npm run dev

# Production build
npm run build
npm start
```

The `dev` and `start` scripts automatically run both the Next.js server and the media compression worker via `concurrently`.

## Media Processing Pipeline

- **Videos**: Uploaded via the UI → queued in BullMQ (Redis) → compressed to HLS (720p, CRF 26, AAC 96k) → uploaded to S3
- **Images**: Uploaded directly to S3 with Sharp compression (1920px, WebP 80)
- **Playback**: Videos stream via HLS (hls.js on most browsers, native on Safari)

## AWS S3 Setup

1. Create an S3 bucket with **public read** access (bucket policy or ACLs)
2. Create an IAM user with `PutObject`, `GetObject`, `ListBucket`, `DeleteObject` permissions
3. Set the credentials and bucket name in `.env`

### CloudFront (optional)

1. Create a CloudFront distribution pointing to the S3 bucket
2. Set `CLOUDFRONT_DOMAIN=https://xxxxx.cloudfront.net` in `.env`
3. All public URLs will automatically use the CDN domain

## Roles

| Auth role key | UI label   |
| ------------- | ---------- |
| admin         | Admin      |
| teacher       | Instructor |
| student       | Learner    |
| parent        | Guardian   |

The auth role keys are kept stable for the JWT/auth layer; only the UI labels
reflect the LMS terminology.
