'use client';

import { ProgressProvider as BProgressProvider } from '@bprogress/next/app';

const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <BProgressProvider
      shallowRouting
      height="0.3rem"
      color="#00B82E"
      options={{ showSpinner: true }}
    >
      {children}
    </BProgressProvider>
  );
};

export default ProgressProvider;