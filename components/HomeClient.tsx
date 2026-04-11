'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Dashboard from '@uppy/react/lib/Dashboard.js';
import Uppy, { type UppyFile } from '@uppy/core';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import { UppyEncryptPlugin, UppyEncrypt } from 'uppy-encrypt';
import { filesize } from 'filesize';
import { useNewUpload } from './NewUploadContext';
import { publicEnv } from '@/lib/env';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

async function createUpload(isMultipart = false) {
  const response = await fetch(`/api/upload/s3${isMultipart ? '/multipart' : ''}`, {
    method: 'POST',
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

function buildUppy(maxUploadSize: number, maxUploadFiles: number) {
  return new Uppy({
    allowMultipleUploadBatches: false,
    restrictions: {
      maxFileSize: maxUploadSize,
      maxTotalFileSize: maxUploadSize,
      maxNumberOfFiles: maxUploadFiles,
    },
  })
    .use(UppyEncryptPlugin)
    .use(AwsS3Multipart, {
      shouldUseMultipart: (file: UppyFile) => (file.size ?? 0) > 100 * 2 ** 20,
      allowedMetaFields: ['name', 'type'],
      getUploadParameters: async () => {
        const data = await createUpload();
        return {
          method: data.method,
          url: data.url,
          fields: {},
          headers: { 'Content-Type': 'application/octet-stream' },
        };
      },
      createMultipartUpload: async () => {
        return createUpload(true);
      },
      signPart: async (_file, { uploadId, key, partNumber, signal }) => {
        signal?.throwIfAborted();
        if (uploadId == null || key == null || partNumber == null) {
          throw new Error('Cannot sign without a key, an uploadId, and a partNumber');
        }
        const response = await fetch(`/api/upload/s3/multipart/${uploadId}/${partNumber}?key=${encodeURIComponent(key)}`, { signal });
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      },
      listParts: async (_file, { key, uploadId, signal }) => {
        signal?.throwIfAborted();
        const response = await fetch(`/api/upload/s3/multipart/${encodeURIComponent(uploadId)}?key=${encodeURIComponent(key)}`, { signal });
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      },
      completeMultipartUpload: async (_file, { key, uploadId, parts, signal }) => {
        signal?.throwIfAborted();
        const response = await fetch(`/api/upload/s3/multipart/${encodeURIComponent(uploadId)}/complete?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { accept: 'application/json' },
          body: JSON.stringify(parts),
          signal,
        });
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      },
      abortMultipartUpload: async (_file, { key, uploadId, signal }) => {
        const response = await fetch(`/api/upload/s3/multipart/${encodeURIComponent(uploadId)}?key=${encodeURIComponent(key)}`, {
          method: 'DELETE',
          signal,
        });
        if (!response.ok) throw new Error('Request failed');
      },
    });
}

export function HomeClient() {
  const { setShowButton, setHandler } = useNewUpload();
  const maxUploadFiles = publicEnv.maxUploadFiles;
  const maxUploadSize = publicEnv.maxUploadSize * 1_000_000;
  const expireOptions = publicEnv.expireOptions;
  const maxDownloadOptions = publicEnv.maxDownloadOptions;
  const showFaq = publicEnv.showFaq;

  const [expires, setExpires] = useState<number>(expireOptions[0] ?? 24);
  const [downloads, setDownloads] = useState<number>(maxDownloadOptions[0] ?? 10);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');

  const [uppy] = useState<Uppy>(() => buildUppy(maxUploadSize, maxUploadFiles));

  // Sync nav "New Upload" button + reset handler
  useEffect(() => {
    setShowButton(false);
    setHandler(() => setUrl(null));
  }, [setHandler, setShowButton]);

  // Uppy events — expires/downloads captured per-render
  useEffect(() => {
    const onUpload = () => setStatus('Encrypting & uploading…');
    const onComplete = async (result: { successful: UppyFile[] }) => {
      setStatus('Finalizing. Please wait…');

      if (!result.successful.length) {
        setStatus('');
        return;
      }

      const files = result.successful.map((file) => ({
        path: ((file as unknown as { uploadURL: string }).uploadURL).split('/').slice(-2).join('/'),
        data: (file.meta as unknown as { encryption: unknown }).encryption,
      }));

      const response = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({ expires, downloads, files }),
      });

      const data = (await response.json()) as { upload: string };
      const password = (result.successful[0].meta as unknown as { password: string }).password;
      const nextUrl = `${window.location.origin}/${data.upload.replace(/-/g, '')}#${password}`;
      setUrl(nextUrl);
      window.scrollTo(0, 0);
      setShowButton(true);

      uppy.cancelAll();
      const plugin = uppy.getPlugin('UppyEncryptPlugin');
      plugin?.setOptions({ password: UppyEncrypt.generatePassword() });
      setStatus('');
    };

    uppy.on('upload', onUpload);
    uppy.on('complete', onComplete as unknown as (result: unknown) => void);

    return () => {
      uppy.off('upload', onUpload);
      uppy.off('complete', onComplete as unknown as (result: unknown) => void);
    };
  }, [uppy, expires, downloads, setShowButton]);

  const copyLink = () => {
    const el = document.getElementById('share-input');
    if (el instanceof HTMLInputElement) {
      el.select();
      el.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(el.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <>
      {showFaq && <Script src="https://buttons.github.io/buttons.js" strategy="afterInteractive" />}

      {status && (
        <div aria-live="assertive" className="pointer-events-none fixed inset-0 z-20 flex items-end px-4 py-6 sm:items-start sm:p-6">
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-zinc-900 opacity-80 shadow-lg ring-2 ring-blue-600">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex w-0 flex-1 justify-between">
                    <span className="pr-4">
                      <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    <p className="w-0 flex-1 text-sm font-medium text-white">{status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`py-12 ${url ? 'hidden' : 'visible'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto sm:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-500">
              Free, ephemeral,{' '}
              <a href="https://github.com/0sumcode/0up" target="_blank" rel="noreferrer" className="underline">
                open-source
              </a>
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <span className="font-audiowide">0</span>-knowledge encrypted file uploads
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden pt-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Dashboard
              uppy={uppy}
              width={2432}
              height={384}
              theme="dark"
              showProgressDetails
              disableThumbnailGenerator
              doneButtonHandler={undefined as unknown as () => void}
              note={`${filesize(maxUploadSize, { round: 1 })} max upload size. Up to ${maxUploadFiles} files per upload.`}
              proudlyDisplayPoweredByUppy={false}
            />
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2">
                <div className="pt-2 text-xs text-zinc-300 md:text-base">
                  Expire in:{' '}
                  <select
                    value={expires}
                    onChange={(e) => setExpires(Number(e.target.value))}
                    id="expires"
                    name="expires"
                    className="mx-1 rounded-md border-0 bg-white/5 py-1.5 text-xs text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 md:mx-2 md:text-base [&_*]:text-black">
                    {expireOptions.map((value) => (
                      <option key={value} value={value}>
                        {value} Hour{value > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  or{' '}
                  <select
                    value={downloads}
                    onChange={(e) => setDownloads(Number(e.target.value))}
                    id="downloads"
                    name="downloads"
                    className="mx-1 rounded-md border-0 bg-white/5 py-1.5 text-xs text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 md:mx-2 md:text-base [&_*]:text-black">
                    {maxDownloadOptions.map((value) => (
                      <option key={value} value={value}>
                        {value} Download{value > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="py-2">
                  <p className="text-center text-xs leading-6 text-zinc-400 lg:text-right">
                    Uploading indicates acceptance of the{' '}
                    <a href="/terms" className="font-semibold text-zinc-200">
                      terms of service
                    </a>
                    .
                  </p>
                  <p className="text-center text-xs leading-6 text-zinc-400 lg:text-right">
                    We care about your data. Read our{' '}
                    <a href="/privacy" className="font-semibold text-zinc-200">
                      privacy policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {url && (
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">Your file(s) have been encrypted &amp; uploaded!</h1>
          <p className="mx-auto mt-10 max-w-xl text-center text-lg leading-8 text-zinc-300">Copy &amp; share the link below:</p>
          <form className="mx-auto mt-2 flex max-w-xl gap-x-4" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="share-input" className="sr-only">
              Share
            </label>
            <input
              id="share-input"
              name="share"
              type="text"
              value={url}
              readOnly
              className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <svg className="-ml-0.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z" />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </form>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setUrl(null);
              }}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              New Upload
            </a>
          </div>
        </div>
      )}

      {showFaq && (
        <div>
          <div className="mx-auto max-w-7xl divide-y divide-zinc-400/10 px-6 py-12 lg:px-8">
            <h2 className="text-2xl font-bold leading-10 tracking-tight text-white">Frequently asked questions</h2>
            <dl className="mt-10 space-y-8 divide-y divide-zinc-400/10">
              <div className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-white lg:col-span-5">
                  Can <span className="font-audiowide text-sm">0up</span> admins decrypt the files I upload?
                </dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-zinc-300">
                    No. The key required for decryption is never sent to <span className="font-audiowide text-sm">0up</span>, meaning we have no ability to
                    decrypt your uploads. Your file&apos;s meta data (file name, file type, etc) are also encrypted.
                  </p>
                </dd>
              </div>

              <div className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-white lg:col-span-5">
                  How does <span className="font-audiowide text-sm">0up</span> work?
                </dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-zinc-300">
                    Your files are encrypted by your web browser, with a key that is generated on your browser. The key is never sent to{' '}
                    <span className="font-audiowide text-sm">0up</span>, meaning only you and those you share the link with can download the decrypted files.
                  </p>
                </dd>
              </div>

              <div className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-white lg:col-span-5">Could you be sneaky and take a peak at our keys?</dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-zinc-300">
                    Your keys are passed as an anchor component in the URL (#YOUR_KEY_HERE). The anchor data is not sent as part of the request to the server
                    and isn&apos;t logged by the server. While that doesn&apos;t mean it&apos;s impossible for nefarious or bad code to leak the key, we&apos;re{' '}
                    <a href="https://github.com/0sumcode/0up" className="underline" target="_blank" rel="noreferrer">
                      open source
                    </a>{' '}
                    and encourage you to check our work!
                  </p>
                </dd>
              </div>

              <div className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-white lg:col-span-5">How do you make money?</dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-zinc-300">
                    We don&apos;t collect or sell user data, we don&apos;t include ads, and we don&apos;t have a paid plan. So, the short answer is, we
                    don&apos;t make money. This is simply a passion project.{' '}
                    <a href="https://github.com/0sumcode/0up" className="underline" target="_blank" rel="noreferrer">
                      Starring us on Github
                    </a>{' '}
                    would be much appreciated!
                  </p>
                  <div className="mt-2 flex space-x-4">
                    <div className="flex-none">
                      <a
                        className="github-button"
                        href="https://github.com/0sumcode/0up"
                        data-color-scheme="no-preference: light; light: light; dark: dark;"
                        data-icon="octicon-star"
                        data-size="large"
                        data-show-count="true"
                        aria-label="Star 0sumcode/0up on GitHub">
                        Star
                      </a>
                    </div>
                  </div>
                </dd>
              </div>

              <div className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-white lg:col-span-5">Do I have to trust you?</dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-zinc-300">
                    Nope.{' '}
                    <a href="https://github.com/0sumcode/0up" className="underline" target="_blank" rel="noreferrer">
                      Clone <span className="font-audiowide text-sm">0up</span>
                    </a>{' '}
                    and host it on your own infrastructure.
                  </p>
                </dd>
              </div>

              <div className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-white lg:col-span-5">What features will be added?</dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-zinc-300">
                    You tell us (and see what&apos;s in the works) on{' '}
                    <a href="https://github.com/0sumcode/0up" className="underline" target="_blank" rel="noreferrer">
                      Github
                    </a>
                    .
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
