/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';
import { loadSettings } from '@/lib/database-settings';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('server-config called: ', request.url);

  const runtimeSettings = await loadSettings();
  const config = await getConfig();
  const result = {
    SiteName: runtimeSettings?.siteName || config.SiteConfig.SiteName,
    StorageType: runtimeSettings?.storageType || 'localstorage',
    EnableRegister: Boolean(runtimeSettings?.enableRegister),
  };
  return NextResponse.json(result);
}
