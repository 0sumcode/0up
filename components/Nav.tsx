'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useNewUpload } from './NewUploadContext';

export function Nav() {
  const { showButton, triggerHandler } = useNewUpload();
  const pathname = usePathname();
  const router = useRouter();

  const handleNewUpload = () => {
    if (pathname !== '/') {
      router.push('/');
    } else {
      triggerHandler();
    }
  };

  return (
    <nav className="bg-zinc-800 opacity-80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <div className="font-audiowide text-3xl text-white">
                <a href="/">0up</a>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {showButton && (
                <button
                  type="button"
                  onClick={handleNewUpload}
                  className="relative inline-flex items-center gap-x-1.5 rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
                  <svg className="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  New Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
