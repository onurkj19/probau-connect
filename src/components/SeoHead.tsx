import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  schemas?: unknown[];
}

function upsertMetaDescription(content: string) {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const SeoHead = ({ title, description, canonicalPath, schemas = [] }: SeoHeadProps) => {
  useEffect(() => {
    document.title = title;
    upsertMetaDescription(description);
    upsertCanonical(`${window.location.origin}${canonicalPath}`);

    const scripts: HTMLScriptElement[] = [];
    schemas.forEach((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema-index", String(index));
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
      scripts.push(script);
    });

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [title, description, canonicalPath, schemas]);

  return null;
};

export default SeoHead;
