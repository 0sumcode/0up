'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UppyDecrypt, uppyEncryptReady, type DecryptedMetaData } from 'uppy-encrypt';
import { filesize } from 'filesize';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Error as ErrorBox } from './Error';
import { ModalConfirm } from './ModalConfirm';
import { useNewUpload } from './NewUploadContext';
import { getFileTypeIcon } from '@/lib/getFileTypeIcon';
import { publicEnv } from '@/lib/env';

dayjs.extend(relativeTime);

interface UploadPayload {
  id: string;
  hash: string;
  expireAt: string;
  expireDownloads: number;
}

interface FilePayload {
  id: string;
  size: number;
  salt: string;
  header: string;
  metaHeader: string;
  metaData: string;
}

interface FileDownload {
  file: FilePayload;
  decryptor: UppyDecrypt;
  meta: DecryptedMetaData;
  decrypted?: Blob;
}

export function DownloadClient({ upload, files: serverFiles }: { upload: UploadPayload; files: FilePayload[] }) {
  const router = useRouter();
  const { setShowButton } = useNewUpload();

  const [files, setFiles] = useState<FileDownload[]>([]);
  const [showDownloadWarning, setShowDownloadWarning] = useState(publicEnv.showDownloadWarning);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reader, setReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const [reportInput, setReportInput] = useState('');
  const [error, setError] = useState<{ message: string; description: string }>({ message: '', description: '' });
  const [completed, setCompleted] = useState<'reported' | 'deleted' | null>(null);

  const expiresIn = dayjs().to(dayjs(upload.expireAt));

  useEffect(() => {
    setShowButton(true);
  }, [setShowButton]);

  // Reconcile file list when server data changes (after router.refresh)
  useEffect(() => {
    if (completed) return;
    if (serverFiles.length === 0) {
      setError({ message: 'No files found', description: 'Maximum downloads reached.' });
      return;
    }
    setFiles((prev) => {
      if (prev.length === 0) return prev;
      const ids = new Set(serverFiles.map((f) => f.id));
      return prev.filter((f) => ids.has(f.file.id));
    });
  }, [serverFiles, completed]);

  // Decrypt metadata once libsodium is ready
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await uppyEncryptReady();
      if (cancelled) return;
      const password = window.location.hash.substring(1);
      if (!UppyDecrypt.verifyPassword(upload.hash, password)) {
        setError({ message: 'Decryption failed', description: 'Invalid or no decryption key provided.' });
        return;
      }
      const next: FileDownload[] = [];
      for (const file of serverFiles) {
        const decryptor = new UppyDecrypt(password, file.salt, file.header);
        const meta = decryptor.getDecryptedMetaData(file.metaHeader, file.metaData);
        next.push({ file, decryptor, meta });
      }
      if (!cancelled) setFiles(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upload.hash]);

  const cancelDownload = () => {
    reader?.cancel();
    setDownloading(false);
  };

  const handleDownload = async (target: FileDownload) => {
    if (downloading) return;

    if (!target.decrypted) {
      setDownloading(true);
      const res = await fetch(`/api/download/s3/${upload.id}/${target.file.id}`, { cache: 'no-store' });
      if (!res.ok) {
        setError({ message: 'Download failed', description: 'Unable to fetch download URL.' });
        setDownloading(false);
        router.refresh();
        return;
      }
      const { url } = (await res.json()) as { url: string };
      const objectRes = await fetch(url);
      const bodyReader = objectRes.body?.getReader() ?? null;
      if (!bodyReader) {
        setError({ message: 'Decryption failed', description: 'Unable to initialize decryption.' });
        setDownloading(false);
        router.refresh();
        return;
      }
      setReader(bodyReader);

      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await bodyReader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
        }
        setProgress(Math.round((received / Number(target.file.size)) * 100));
      }

      setDownloading(false);
      setProgress(0);

      if (received < target.file.size) {
        router.refresh();
        return;
      }

      const chunksAll = new Uint8Array(received);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      try {
        target.decrypted = await target.decryptor.decryptFile(new Blob([chunksAll]));
      } catch {
        setError({ message: 'Decryption failed', description: 'Unable to decrypt selected file.' });
        router.refresh();
        return;
      }
    }

    router.refresh();
    if (target.decrypted) {
      const a = document.createElement('a');
      a.setAttribute('download', target.meta.name);
      const href = URL.createObjectURL(target.decrypted);
      a.href = href;
      a.setAttribute('target', '_blank');
      a.click();
      URL.revokeObjectURL(href);
    }
  };

  const confirmDelete = async () => {
    const res = await fetch(`/api/download/${upload.id}`, { method: 'DELETE' });
    setShowDeleteConfirm(false);
    if (!res.ok) {
      setError({ message: 'Delete failed', description: 'Unable to delete this upload. Please try again.' });
      return;
    }
    setCompleted('deleted');
  };

  const confirmReport = async () => {
    const res = await fetch(`/api/download/${upload.id}`, {
      method: 'PUT',
      body: JSON.stringify({ report: reportInput || 'Reported' }),
    });
    setShowReportConfirm(false);
    if (!res.ok) {
      setError({ message: 'Report failed', description: 'Unable to submit this report. Please try again.' });
      return;
    }
    setCompleted('reported');
  };

  return (
    <>
      {showDownloadWarning && (
        <ModalConfirm
          title="Confirm Download"
          cancelButton="Cancel download"
          confirmButton="I know and trust the sender"
          allowEscape={false}
          onClose={() => router.push('/')}
          onConfirm={() => setShowDownloadWarning(false)}>
          <span className="underline">Never</span> download files from someone you don&apos;t personally know and trust!
        </ModalConfirm>
      )}
      {!showDownloadWarning && showDeleteConfirm && (
        <ModalConfirm
          title="Delete Upload?"
          confirmButton="Delete"
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}>
          Are you sure you wish to delete this upload? You will lose access to all files. This action cannot be undone!
        </ModalConfirm>
      )}
      {!showDownloadWarning && !showDeleteConfirm && showReportConfirm && (
        <ModalConfirm
          title="Report Upload"
          confirmButton="Report"
          onClose={() => setShowReportConfirm(false)}
          onConfirm={confirmReport}>
          Once reported, this upload will be deleted. This action cannot be reversed!
          <textarea
            rows={4}
            name="comment"
            id="comment"
            placeholder="Report reason (malware, phishing, etc.)"
            required
            maxLength={1024}
            value={reportInput}
            onChange={(e) => setReportInput(e.target.value)}
            className="mt-4 block w-full rounded-md border-0 bg-zinc-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 md:w-96"
          />
        </ModalConfirm>
      )}

      {downloading && (
        <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            <div className="pointer-events-auto flex w-full max-w-md rounded-lg bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="w-0 flex-1 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="animate-pulse" xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 512 512">
                      <path
                        fill="#ffffff"
                        d="M256 464a208 208 0 1 1 0-416 208 208 0 1 1 0 416zM256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM376.9 294.6c4.5-4.2 7.1-10.1 7.1-16.3c0-12.3-10-22.3-22.3-22.3H304V160c0-17.7-14.3-32-32-32l-32 0c-17.7 0-32 14.3-32 32v96H150.3C138 256 128 266 128 278.3c0 6.2 2.6 12.1 7.1 16.3l107.1 99.9c3.8 3.5 8.7 5.5 13.8 5.5s10.1-2 13.8-5.5l107.1-99.9z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-white">Downloading…</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-700">
                      <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-zinc-800">
                <button
                  type="button"
                  onClick={cancelDownload}
                  className="flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {completed === 'reported' ? (
        <ErrorBox title="Upload reported">Thank you. This upload has been reported and removed.</ErrorBox>
      ) : completed === 'deleted' ? (
        <ErrorBox title="Upload deleted">This upload and all of its files have been permanently removed.</ErrorBox>
      ) : error.message ? (
        <ErrorBox title={error.message}>{error.description}</ErrorBox>
      ) : (
        <div className="px-4">
          <div className="mx-auto mt-12 max-w-2xl rounded-md bg-zinc-800 px-6 lg:px-8">
            <ul role="list" className="divide-y divide-zinc-700">
              {files.length ? (
                files.map((file) => (
                  <li key={file.file.id} className="flex items-center justify-between gap-x-6 py-5">
                    <div className="flex min-w-0 gap-x-4">
                      <div
                        className="h-12 w-12 flex-none"
                        dangerouslySetInnerHTML={{ __html: file.meta.type ? getFileTypeIcon(file.meta.type).icon : '' }}
                      />
                      <div className="min-w-0 flex-auto">
                        <p className="break-all text-sm font-semibold leading-6 text-white">
                          <a
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownload(file);
                            }}
                            className="hover:underline"
                            href="#">
                            {file.meta.name}
                          </a>
                        </p>
                        <p className="mt-1 truncate text-xs leading-5 text-zinc-500">{filesize(Number(file.file.size))}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloading}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-white/20 disabled:opacity-50">
                      Download
                    </button>
                  </li>
                ))
              ) : (
                <li className="flex animate-pulse items-center justify-between gap-x-6 py-5">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="flex-none" dangerouslySetInnerHTML={{ __html: getFileTypeIcon('application/octet-stream').icon }} />
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-white">Loading files…</p>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
          <div className="mx-auto mt-2 flex max-w-2xl rounded-md">
            <div className="flex-1 text-sm italic leading-6 text-zinc-400">Expires {expiresIn}</div>
            <div>
              <button
                type="button"
                onClick={() => setShowReportConfirm(true)}
                className="rounded bg-white/10 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-white/20">
                Report
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="ml-2 rounded bg-red-600/40 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-600/50">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
