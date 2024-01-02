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
2. A PostgreSQL database (free hosted providers like [Supabase](https://supabase.com/) work great)
3. Node.JS 18+

To get started hosting your own instance of 0up, clone (or fork and clone) this repo.

```bash
git clone https://github.com/0sumcode/0up.git
```

TODO more coming soon...
