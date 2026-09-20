import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { cacheStatus, loadSettings } from '@/lib/database-settings';
import { getConfig } from '@/lib/config';
import { getStorage } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = getAuthInfoFromCookie(request);
  if (!auth?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const value = await loadSettings(true);
    if (!value) throw new Error('远程配置为空');

    const adminConfig = await getConfig();
    adminConfig.SiteConfig = {
      ...adminConfig.SiteConfig,
      SiteName: value.siteName || adminConfig.SiteConfig.SiteName,
      Announcement: value.announcement ?? adminConfig.SiteConfig.Announcement,
      SearchDownstreamMaxPage:
        value.searchDownstreamMaxPage ?? adminConfig.SiteConfig.SearchDownstreamMaxPage,
      SiteInterfaceCacheTime:
        value.siteInterfaceCacheTime ?? adminConfig.SiteConfig.SiteInterfaceCacheTime,
      DoubanProxyType:
        value.doubanProxyType ?? adminConfig.SiteConfig.DoubanProxyType,
      DoubanProxy: value.doubanProxy ?? adminConfig.SiteConfig.DoubanProxy,
      DoubanImageProxyType:
        value.doubanImageProxyType ?? adminConfig.SiteConfig.DoubanImageProxyType,
      DoubanImageProxy:
        value.doubanImageProxy ?? adminConfig.SiteConfig.DoubanImageProxy,
      DisableYellowFilter:
        value.disableYellowFilter ?? adminConfig.SiteConfig.DisableYellowFilter,
    };
    adminConfig.UserConfig.AllowRegister = Boolean(value.enableRegister);

    const storage = await getStorage();
    if (storage && typeof storage.setAdminConfig === 'function') {
      await storage.setAdminConfig(adminConfig);
    }

    return NextResponse.json({
      ok: true,
      source: cacheStatus()?.source || 'remote',
      updatedAt: new Date().toISOString(),
      replicated: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 502 }
    );
  }
}
