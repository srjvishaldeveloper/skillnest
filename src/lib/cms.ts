import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { cmsDefaults, cmsPageMeta, CmsContentMap, CmsPageKey } from "./cmsDefaults";

const cmsFilePath = path.join(process.cwd(), "src", "data", "cms-content.json");

type CmsStore = {
  pages: CmsContentMap;
};

function deepMerge<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) {
      return base as T;
    }

    return base.map((item, index) => {
      const overrideItem = override[index];
      return overrideItem === undefined ? item : deepMerge(item, overrideItem);
    }) as T;
  }

  if (
    base &&
    typeof base === "object" &&
    !Array.isArray(base) &&
    override &&
    typeof override === "object" &&
    !Array.isArray(override)
  ) {
    const output: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(override as Record<string, unknown>)) {
      const baseValue = (base as Record<string, unknown>)[key];
      const overrideValue = (override as Record<string, unknown>)[key];
      output[key] =
        baseValue !== undefined ? deepMerge(baseValue, overrideValue) : overrideValue;
    }
    return output as T;
  }

  return (override === undefined ? base : override) as T;
}

async function ensureCmsStore(): Promise<CmsStore> {
  try {
    const raw = await readFile(cmsFilePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CmsStore>;
    return {
      pages: deepMerge(cmsDefaults as unknown as CmsContentMap, parsed.pages || {}),
    };
  } catch {
    const initial: CmsStore = { pages: cmsDefaults as unknown as CmsContentMap };
    await mkdir(path.dirname(cmsFilePath), { recursive: true });
    await writeFile(cmsFilePath, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

export async function getAllCmsPages() {
  const store = await ensureCmsStore();
  return store.pages;
}

export async function getCmsPage<K extends CmsPageKey>(key: K): Promise<CmsContentMap[K]> {
  const store = await ensureCmsStore();
  return store.pages[key] || cmsDefaults[key];
}

export async function updateCmsPage<K extends CmsPageKey>(
  key: K,
  value: CmsContentMap[K]
) {
  const store = await ensureCmsStore();
  const nextStore: CmsStore = {
    pages: {
      ...store.pages,
      [key]: value,
    },
  };

  await mkdir(path.dirname(cmsFilePath), { recursive: true });
  await writeFile(cmsFilePath, JSON.stringify(nextStore, null, 2), "utf8");
  return nextStore.pages[key];
}

export { cmsDefaults, cmsPageMeta };
export type { CmsPageKey, CmsContentMap };
