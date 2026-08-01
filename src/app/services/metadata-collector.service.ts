import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MetadataCollectorService {
  /**
   * Collects system and browser metadata for support requests
   */
  public collectMetadata(
    accountId: string | null,
    environment: string,
    currentUrl: string,
    activeWheelId: string | null
  ): SupportRequestMetadata {
    return {
      accountId,
      environment,
      browser: this.getBrowserInfo(),
      os: this.getOperatingSystem(),
      currentUrl,
      timestamp: new Date().toISOString(),
      timezone: this.getTimezone(),
      activeWheelId,
    };
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      const match = userAgent.match(/Chrome\/([0-9]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Chrome ${version}`;
    }

    // Edge
    if (userAgent.includes('Edge') || userAgent.includes('Edg/')) {
      const match = userAgent.match(/(?:Edge|Edg)\/([0-9]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Edge ${version}`;
    }

    // Firefox
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/([0-9]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Firefox ${version}`;
    }

    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/([0-9.]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Safari ${version}`;
    }

    // Opera
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      const match = userAgent.match(/(?:Opera|OPR)\/([0-9]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Opera ${version}`;
    }

    // Fallback
    return `Unknown Browser (${userAgent.substring(0, 50)}...)`;
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    // Windows
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
    if (userAgent.includes('Windows')) return 'Windows (Unknown Version)';

    // macOS
    if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X ([0-9_]+)/);
      if (match) {
        const version = match[1].replace(/_/g, '.');
        return `macOS ${version}`;
      }
      return 'macOS (Unknown Version)';
    }

    // Linux
    if (userAgent.includes('Linux')) {
      if (userAgent.includes('Ubuntu')) return 'Ubuntu Linux';
      if (userAgent.includes('Debian')) return 'Debian Linux';
      if (userAgent.includes('Fedora')) return 'Fedora Linux';
      if (userAgent.includes('CentOS')) return 'CentOS Linux';
      return 'Linux (Unknown Distribution)';
    }

    // Mobile OS
    if (userAgent.includes('iPhone OS')) {
      const match = userAgent.match(/iPhone OS ([0-9_]+)/);
      const version = match ? match[1].replace(/_/g, '.') : 'Unknown';
      return `iOS ${version}`;
    }

    if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android ([0-9.]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Android ${version}`;
    }

    // Fallback using platform
    if (platform) {
      return `Unknown OS (${platform})`;
    }

    return 'Unknown Operating System';
  }

  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('Could not determine timezone:', error);
      return 'Unknown Timezone';
    }
  }
}
