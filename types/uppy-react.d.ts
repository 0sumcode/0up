declare module '@uppy/react/lib/Dashboard.js' {
  import type { ComponentType } from 'react';
  import type Uppy from '@uppy/core';
  interface DashboardProps {
    uppy: Uppy;
    width?: number | string;
    height?: number | string;
    theme?: 'dark' | 'light' | 'auto';
    inline?: boolean;
    note?: string;
    showProgressDetails?: boolean;
    disableThumbnailGenerator?: boolean;
    doneButtonHandler?: (() => void) | null | undefined;
    proudlyDisplayPoweredByUppy?: boolean;
    [key: string]: unknown;
  }
  const Dashboard: ComponentType<DashboardProps>;
  export default Dashboard;
}
