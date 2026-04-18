import { useEffect } from 'react';

interface MetaOptions {
  /** Page title — sẽ append " | FocusProof" tự động trừ khi appendBrand=false. */
  title: string;
  description?: string;
  /** Path canonical (vd: "/pricing"). Nếu omit → window.location.pathname. */
  canonicalPath?: string;
  ogImage?: string;
  appendBrand?: boolean;
  /** noindex robots meta (vd: 404, dashboard private). */
  noindex?: boolean;
}

const SITE_NAME = 'FocusProof';
const DEFAULT_OG_IMAGE = '/og-image.png';

/**
 * useMeta — Cập nhật document.head: title, description, OG, twitter, canonical, robots.
 * Cleanup: khôi phục title cũ khi unmount.
 */
export function useMeta({
  title,
  description,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  appendBrand = true,
  noindex = false,
}: MetaOptions) {
  useEffect(() => {
    const fullTitle = appendBrand ? `${title} | ${SITE_NAME}` : title;
    const prevTitle = document.title;
    document.title = fullTitle;

    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${canonicalPath ?? window.location.pathname}`
        : '';

    const tags: Array<[selector: string, attr: 'name' | 'property', key: string, value: string]> = [];

    if (description) {
      tags.push(['meta[name="description"]', 'name', 'description', description]);
      tags.push(['meta[property="og:description"]', 'property', 'og:description', description]);
      tags.push(['meta[name="twitter:description"]', 'name', 'twitter:description', description]);
    }
    tags.push(['meta[property="og:title"]', 'property', 'og:title', fullTitle]);
    tags.push(['meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle]);
    tags.push(['meta[property="og:type"]', 'property', 'og:type', 'website']);
    tags.push(['meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME]);
    tags.push(['meta[property="og:image"]', 'property', 'og:image', ogImage]);
    tags.push(['meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image']);
    tags.push(['meta[name="twitter:image"]', 'name', 'twitter:image', ogImage]);
    if (url) tags.push(['meta[property="og:url"]', 'property', 'og:url', url]);
    tags.push([
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow',
    ]);

    tags.forEach(([selector, attr, key, value]) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    });

    // Canonical link
    if (url) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonicalPath, ogImage, appendBrand, noindex]);
}
