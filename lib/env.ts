export const publicEnv = {
  maxUploadSize: Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE ?? '1024'),
  maxUploadFiles: Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_FILES ?? '10'),
  expireOptions: JSON.parse(process.env.NEXT_PUBLIC_UPLOAD_EXPIRE_OPTIONS ?? '[24,12,6,3,1]') as number[],
  maxDownloadOptions: JSON.parse(process.env.NEXT_PUBLIC_UPLOAD_MAX_DOWNLOAD_OPTIONS ?? '[10,5,3,1]') as number[],
  showFaq: process.env.NEXT_PUBLIC_SHOW_FAQ === 'true',
  showDownloadWarning: process.env.NEXT_PUBLIC_SHOW_DOWNLOAD_WARNING === 'true',
  organizationName: process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? 'Your Company, Inc.',
  organizationContact: process.env.NEXT_PUBLIC_ORGANIZATION_CONTACT ?? '',
};

export const maxExpires = Math.max(...publicEnv.expireOptions);
export const maxDownloads = Math.max(...publicEnv.maxDownloadOptions);
