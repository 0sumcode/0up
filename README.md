## What is 0up?

[0up](https://0up.io) is a zero-knowledge, open-source, encrypted file sharing service.

## What is zero-knowledge?

From [Wikipedia](https://en.wikipedia.org/wiki/Zero-knowledge_service): Zero-knowledge refers to an online service that stores, transfers or manipulates data in a way that maintains a high level of confidentiality, where the data is only accessible to the data's owner (the client), and not to the service provider.

## How 0up works

1. Files are encrypted browser-side before being uploaded to an S3 compatible storage service.
2. A shareable link is generated with the decryption key as part of the anchor component (`#`) of the URL. (Anchor components are never sent to the server and therefore the decryption key always remains with the client.)
3. Using the generated link, files can be downloaded and decrypted browser-side.

# Host your own instance of 0up

In addition to the hosted version of 0up (https://0up.io), you're free to clone, customize, and host 0up in your own environment.

## What you'll need:

1. An account with an S3-compatible storage service. We recommend [Backblaze B2](https://www.backblaze.com/cloud-storage-v1)
2. A PostgreSQL database
3. Node.JS 18+

## Create an S3 bucket

Using the S3-compatible provider of your choice, create a new bucket. For our examples below, we'll be using [Backblaze B2](https://www.backblaze.com/cloud-storage-v1)

Create a public bucket. Adding encryption is optional, and arguably redundant, but it doesn't hurt.

![image](https://github.com/0sumcode/0up/assets/1061040/7708011c-ac09-405c-a025-ec596fa9c94e)

### Add an expiration policy

We want files to automatically be deleted after 24 hours. To do that, we'll create a custom lifecycle policy.

Click on `Lifecycle Settings` and select `Use custom lifecycle rules`

![image](https://github.com/0sumcode/0up/assets/1061040/12443b36-6464-4389-a0be-bb31b57b175a)

We'll create a prefix of `1/` and apply a 1-day lifecycle policy to it.

### Enable CORS

CORS must be enabled on your S3 bucket to allow uploads and downloads. For B2, this requires [installing the B2 CLI](https://www.backblaze.com/docs/cloud-storage-command-line-tools) (the `CORS Rules` option in the B2 web interface will not suffice for our purposes).

Once you've installed and configured the B2 CLI, we can set the CORS rules with the following command. Make sure to set your particular values for `allowedOrigins`, and `your-bucket-name`:

```bash
b2 update-bucket \
--corsRules '[{"corsRuleName": "downloadFromAnyOriginWithUpload","allowedOrigins": ["http://localhost:5173","https://your-site.example"],"allowedHeaders": ["*"],"allowedOperations": ["s3_head","s3_get","s3_put"],"exposeHeaders": ["ETag"],"maxAgeSeconds": 3600}]' \
your-bucket-name allPrivate
```

## Create a PostgreSQL database

Create a PostgreSQL database, making note of the credentials (user, password, host, database name) as we'll need those during configuration.

## Get the code

To get started hosting your own instance of 0up, clone (or fork and clone) this repo.

```bash
git clone https://github.com/0sumcode/0up.git
cd 0up
npm i
```

## Configuration

Copy `.env.example` to `.env`. Then open and edit the `.env` file and configure the database and S3 parameters accordingly.

```bash
cp .env.example .env
```

Next, deploy the database schema:

```bash
npx prisma migrate deploy
```

## Starting a dev instance

Now that all your configuration parameters have been set, you should be able to test your instance locally. The dev instance makes it easy to test and make customizations.

```bash
npm run dev
```

## Deploying to production

Your 0up instance can easily be deployed to virtually any hosting platform so long as it can run Node.JS and talk to a PostgreSQL database - including frontend hosting platforms like [Vercel](https://vercel.com/docs/getting-started-with-vercel).

Once you've setup your production environment, ensure you've enabled CORS as noted above for your production domain and set your `.env` variables to your production values. To build for production, run:

```bash
npm run build
```

### Cleanup Cron Job

A database cleanup cronjob (`GET https://your.host.here/api/cron/cleanup`) can be called at regular intervals to purge expired data from the database. The request requires an `Authorization` header with the value you've set in your .env file under `PRIVATE_CRON_SECRET`. You may use a service like [Pipedream](https://pipedream.com) for this, or simply create a cronjob to run a command like:

```bash
curl -H "Authorization: YOUR_CRON_SECRET" "https://your.host.here/api/cron/cleanup"
```
