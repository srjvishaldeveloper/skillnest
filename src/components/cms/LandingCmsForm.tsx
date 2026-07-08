"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { LandingCmsContent } from "@/lib/cmsDefaults";

type LandingCmsFormProps = {
  initialContent: LandingCmsContent;
};

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
  ? { -readonly [K in keyof T]: Mutable<T[K]> }
  : T;

type EditableLandingCmsContent = Mutable<LandingCmsContent>;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-300 dark:border-zinc-700/80 bg-white dark:bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition focus:border-skillBlue focus:ring-2 focus:ring-skillBlue/20 shadow-sm";
const textareaClass =
  "mt-1.5 w-full rounded-xl border border-gray-300 dark:border-zinc-700/80 bg-white dark:bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition focus:border-skillBlue focus:ring-2 focus:ring-skillBlue/20 shadow-sm";
const cardClass = "rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0D0D0E] p-5 shadow-sm";
const sectionClass = "space-y-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/90 bg-gray-50/80 dark:bg-[#121214] p-5 shadow-sm";

const uploadButtonClass =
  "mt-2 inline-flex items-center rounded-xl border border-skillBlue/30 bg-skillBlue/10 dark:bg-skillBlue/20 px-4 py-2 text-xs font-semibold text-skillBlue dark:text-sky-400 transition hover:bg-skillBlue/20 disabled:opacity-60";

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
    {label}
    {children}
  </label>
);

const ActionButton = ({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
      tone === "danger"
        ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
        : "border border-skillBlue/20 bg-skillBlue/5 text-skillBlue hover:bg-skillBlue/10"
    }`}
  >
    {children}
  </button>
);

const UploadField = ({
  accept,
  currentUrl,
  onUploaded,
}: {
  accept: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      onUploaded(data.url);
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="mt-2">
      <label className={uploadButtonClass}>
        {uploading ? "Uploading to S3..." : "Upload to S3"}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
      {currentUrl && (
        <p className="mt-2 break-all text-xs text-gray-500">{currentUrl}</p>
      )}
    </div>
  );
};

const LandingCmsForm = ({ initialContent }: LandingCmsFormProps) => {
  const [form, setForm] = useState<EditableLandingCmsContent>(() =>
    clone(initialContent) as unknown as EditableLandingCmsContent
  );
  const [saving, setSaving] = useState(false);

  const update = (
    updater: (current: EditableLandingCmsContent) => EditableLandingCmsContent
  ) => {
    setForm((current) => updater(clone(current)));
  };

  const save = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/cms/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: form }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Landing CMS save failed");
      }

      setForm(clone(data.content));
      toast.success("Landing page content updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save landing content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Landing Page CMS</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Edit the complete landing page with real input fields. The hero and story video
            boxes are now backend-managed from here.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-skillBlue hover:bg-skillBlue/90 px-6 py-2.5 text-sm font-semibold text-white transition shadow-md hover:shadow-lg disabled:opacity-60 active:scale-95 w-fit"
        >
          {saving ? "Saving..." : "Save Landing Page"}
        </button>
      </div>

      <div className="mt-2 space-y-6">
        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🌐</span> SEO & Brand
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO Title">
              <input
                className={inputClass}
                value={form.seo.title}
                onChange={(e) =>
                  update((draft) => {
                    draft.seo.title = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Brand Name">
              <input
                className={inputClass}
                value={form.brand.name}
                onChange={(e) =>
                  update((draft) => {
                    draft.brand.name = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <Field label="SEO Description">
            <textarea
              rows={3}
              className={textareaClass}
              value={form.seo.description}
              onChange={(e) =>
                update((draft) => {
                  draft.seo.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <Field label="Brand Tagline">
            <input
              className={inputClass}
              value={form.brand.tagline}
              onChange={(e) =>
                update((draft) => {
                  draft.brand.tagline = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-5">
            {form.navLinks.map((item, index) => (
              <Field key={index} label={`Nav Link ${index + 1}`}>
                <input
                  className={inputClass}
                  value={item}
                  onChange={(e) =>
                    update((draft) => {
                      draft.navLinks[index] = e.target.value;
                      return draft;
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🚀</span> Hero Section
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow">
              <input
                className={inputClass}
                value={form.hero.eyebrow}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.eyebrow = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Primary CTA Label">
              <input
                className={inputClass}
                value={form.hero.primaryCtaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.primaryCtaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Title Prefix">
              <input
                className={inputClass}
                value={form.hero.titlePrefix}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.titlePrefix = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Primary CTA Link">
              <input
                className={inputClass}
                value={form.hero.primaryCtaHref}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.primaryCtaHref = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Title Highlight">
              <input
                className={inputClass}
                value={form.hero.titleHighlight}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.titleHighlight = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Hero Video Label">
              <input
                className={inputClass}
                value={form.hero.mediaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.mediaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Title Suffix">
              <input
                className={inputClass}
                value={form.hero.titleSuffix}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.titleSuffix = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Hero Video URL">
              <>
                <input
                  className={inputClass}
                  value={form.hero.videoUrl}
                  onChange={(e) =>
                    update((draft) => {
                      draft.hero.videoUrl = e.target.value;
                      return draft;
                    })
                  }
                  placeholder="YouTube/Vimeo URL or /upload/video.mp4"
                />
                <UploadField
                  accept="video/*"
                  currentUrl={form.hero.videoUrl}
                  onUploaded={(url) =>
                    update((draft) => {
                      draft.hero.videoUrl = url;
                      return draft;
                    })
                  }
                />
              </>
            </Field>
            <Field label="Review Count">
              <input
                className={inputClass}
                value={form.hero.reviewCount}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.reviewCount = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Hero Thumbnail URL">
              <>
                <input
                  className={inputClass}
                  value={form.hero.thumbnailUrl}
                  onChange={(e) =>
                    update((draft) => {
                      draft.hero.thumbnailUrl = e.target.value;
                      return draft;
                    })
                  }
                  placeholder="Optional poster image URL"
                />
                <UploadField
                  accept="image/*"
                  currentUrl={form.hero.thumbnailUrl}
                  onUploaded={(url) =>
                    update((draft) => {
                      draft.hero.thumbnailUrl = url;
                      return draft;
                    })
                  }
                />
              </>
            </Field>
            <Field label="Review Label">
              <input
                className={inputClass}
                value={form.hero.reviewLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.reviewLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Learner Count">
              <input
                className={inputClass}
                value={form.hero.learnerCount}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.learnerCount = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Learner Label">
              <input
                className={inputClass}
                value={form.hero.learnerLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.hero.learnerLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <Field label="Hero Description">
            <textarea
              rows={4}
              className={textareaClass}
              value={form.hero.description}
              onChange={(e) =>
                update((draft) => {
                  draft.hero.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🌟</span> Success Stories
          </h3>
          <Field label="Section Title">
            <input
              className={inputClass}
              value={form.successStories.title}
              onChange={(e) =>
                update((draft) => {
                  draft.successStories.title = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <div className="flex justify-end">
            <ActionButton
              onClick={() =>
                update((draft) => {
                  draft.successStories.cards.push({
                    name: "",
                    role: "",
                    quote: "",
                    videoUrl: "",
                    mediaLabel: "Learner story",
                  });
                  return draft;
                })
              }
            >
              + Add Story
            </ActionButton>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {form.successStories.cards.map((card, index) => (
              <div key={index} className={cardClass}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Story Card {index + 1}</h4>
                  {form.successStories.cards.length > 1 && (
                    <ActionButton
                      tone="danger"
                      onClick={() =>
                        update((draft) => {
                          draft.successStories.cards.splice(index, 1);
                          return draft;
                        })
                      }
                    >
                      Remove
                    </ActionButton>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={card.name}
                      onChange={(e) =>
                        update((draft) => {
                          draft.successStories.cards[index].name = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Role">
                    <input
                      className={inputClass}
                      value={card.role}
                      onChange={(e) =>
                        update((draft) => {
                          draft.successStories.cards[index].role = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Video Label">
                    <input
                      className={inputClass}
                      value={card.mediaLabel}
                      onChange={(e) =>
                        update((draft) => {
                          draft.successStories.cards[index].mediaLabel = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Video URL">
                    <>
                      <input
                        className={inputClass}
                        value={card.videoUrl}
                        onChange={(e) =>
                          update((draft) => {
                            draft.successStories.cards[index].videoUrl = e.target.value;
                            return draft;
                          })
                        }
                        placeholder="YouTube, Vimeo, or /upload/story.mp4"
                      />
                      <UploadField
                        accept="video/*"
                        currentUrl={card.videoUrl}
                        onUploaded={(url) =>
                          update((draft) => {
                            draft.successStories.cards[index].videoUrl = url;
                            return draft;
                          })
                        }
                      />
                    </>
                  </Field>
                  <Field label="Quote">
                    <textarea
                      rows={4}
                      className={textareaClass}
                      value={card.quote}
                      onChange={(e) =>
                        update((draft) => {
                          draft.successStories.cards[index].quote = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🔥</span> Popular Course
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Course Title">
              <input
                className={inputClass}
                value={form.popularCourse.title}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.title = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Author">
              <input
                className={inputClass}
                value={form.popularCourse.author}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.author = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Mentor Label">
              <input
                className={inputClass}
                value={form.popularCourse.mentor}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.mentor = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Video Label">
              <input
                className={inputClass}
                value={form.popularCourse.mediaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.mediaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Level">
              <input
                className={inputClass}
                value={form.popularCourse.level}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.level = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Video URL">
              <>
                <input
                  className={inputClass}
                  value={form.popularCourse.videoUrl}
                  onChange={(e) =>
                    update((draft) => {
                      draft.popularCourse.videoUrl = e.target.value;
                      return draft;
                    })
                  }
                />
                <UploadField
                  accept="video/*"
                  currentUrl={form.popularCourse.videoUrl}
                  onUploaded={(url) =>
                    update((draft) => {
                      draft.popularCourse.videoUrl = url;
                      return draft;
                    })
                  }
                />
              </>
            </Field>
            <Field label="Duration">
              <input
                className={inputClass}
                value={form.popularCourse.duration}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.duration = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Students">
              <input
                className={inputClass}
                value={form.popularCourse.students}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.students = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Old Price">
              <input
                className={inputClass}
                value={form.popularCourse.oldPrice}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.oldPrice = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Current Price">
              <input
                className={inputClass}
                value={form.popularCourse.price}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.price = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Label">
              <input
                className={inputClass}
                value={form.popularCourse.ctaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.ctaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Link">
              <input
                className={inputClass}
                value={form.popularCourse.ctaHref}
                onChange={(e) =>
                  update((draft) => {
                    draft.popularCourse.ctaHref = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={4}
              className={textareaClass}
              value={form.popularCourse.description}
              onChange={(e) =>
                update((draft) => {
                  draft.popularCourse.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📖</span> About Section
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow">
              <input
                className={inputClass}
                value={form.about.eyebrow}
                onChange={(e) =>
                  update((draft) => {
                    draft.about.eyebrow = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Label">
              <input
                className={inputClass}
                value={form.about.ctaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.about.ctaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Title">
              <input
                className={inputClass}
                value={form.about.title}
                onChange={(e) =>
                  update((draft) => {
                    draft.about.title = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Link">
              <input
                className={inputClass}
                value={form.about.ctaHref}
                onChange={(e) =>
                  update((draft) => {
                    draft.about.ctaHref = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Video Label">
              <input
                className={inputClass}
                value={form.about.mediaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.about.mediaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Video URL">
              <>
                <input
                  className={inputClass}
                  value={form.about.videoUrl}
                  onChange={(e) =>
                    update((draft) => {
                      draft.about.videoUrl = e.target.value;
                      return draft;
                    })
                  }
                />
                <UploadField
                  accept="video/*"
                  currentUrl={form.about.videoUrl}
                  onUploaded={(url) =>
                    update((draft) => {
                      draft.about.videoUrl = url;
                      return draft;
                    })
                  }
                />
              </>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={4}
              className={textareaClass}
              value={form.about.description}
              onChange={(e) =>
                update((draft) => {
                  draft.about.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>✨</span> Why Choose Us
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow">
              <input
                className={inputClass}
                value={form.difference.eyebrow}
                onChange={(e) =>
                  update((draft) => {
                    draft.difference.eyebrow = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Title">
              <input
                className={inputClass}
                value={form.difference.title}
                onChange={(e) =>
                  update((draft) => {
                    draft.difference.title = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={4}
              className={textareaClass}
              value={form.difference.description}
              onChange={(e) =>
                update((draft) => {
                  draft.difference.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            {form.difference.features.map((feature, index) => (
              <Field key={index} label={`Feature ${index + 1}`}>
                <input
                  className={inputClass}
                  value={feature}
                  onChange={(e) =>
                    update((draft) => {
                      draft.difference.features[index] = e.target.value;
                      return draft;
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-semibold text-skillDark">Explore Courses Section</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Section Title">
              <input
                className={inputClass}
                value={form.courses.title}
                onChange={(e) =>
                  update((draft) => {
                    draft.courses.title = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Section CTA Label">
              <input
                className={inputClass}
                value={form.courses.ctaLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.courses.ctaLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Section CTA Link">
              <input
                className={inputClass}
                value={form.courses.ctaHref}
                onChange={(e) =>
                  update((draft) => {
                    draft.courses.ctaHref = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <div className={cardClass}>
            <p className="text-sm text-gray-600">
              Landing page course cards now come from real published courses. Super admin can
              create or publish a course from the course manager, and it will appear on the
              landing page and the public Explore All Courses page automatically.
            </p>
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💬</span> Testimonials
          </h3>
          <Field label="Section Title">
            <input
              className={inputClass}
              value={form.testimonials.title}
              onChange={(e) =>
                update((draft) => {
                  draft.testimonials.title = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <div className="flex justify-end">
            <ActionButton
              onClick={() =>
                update((draft) => {
                  draft.testimonials.items.push({
                    name: "",
                    role: "",
                    quote: "",
                  });
                  return draft;
                })
              }
            >
              + Add Review
            </ActionButton>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {form.testimonials.items.map((item, index) => (
              <div key={index} className={cardClass}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Testimonial {index + 1}
                  </h4>
                  {form.testimonials.items.length > 1 && (
                    <ActionButton
                      tone="danger"
                      onClick={() =>
                        update((draft) => {
                          draft.testimonials.items.splice(index, 1);
                          return draft;
                        })
                      }
                    >
                      Remove
                    </ActionButton>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={item.name}
                      onChange={(e) =>
                        update((draft) => {
                          draft.testimonials.items[index].name = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Role">
                    <input
                      className={inputClass}
                      value={item.role}
                      onChange={(e) =>
                        update((draft) => {
                          draft.testimonials.items[index].role = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Quote">
                    <textarea
                      rows={4}
                      className={textareaClass}
                      value={item.quote}
                      onChange={(e) =>
                        update((draft) => {
                          draft.testimonials.items[index].quote = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>❓</span> FAQs
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Section Title">
              <input
                className={inputClass}
                value={form.faqs.title}
                onChange={(e) =>
                  update((draft) => {
                    draft.faqs.title = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Contact Button Label">
              <input
                className={inputClass}
                value={form.faqs.contactLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.faqs.contactLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Contact Button Link">
              <input
                className={inputClass}
                value={form.faqs.contactHref}
                onChange={(e) =>
                  update((draft) => {
                    draft.faqs.contactHref = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <Field label="FAQ Description">
            <textarea
              rows={3}
              className={textareaClass}
              value={form.faqs.description}
              onChange={(e) =>
                update((draft) => {
                  draft.faqs.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <div className="flex justify-end">
            <ActionButton
              onClick={() =>
                update((draft) => {
                  draft.faqs.items.push({
                    question: "",
                    answer: "",
                    open: false,
                  });
                  return draft;
                })
              }
            >
              + Add FAQ
            </ActionButton>
          </div>
          <div className="space-y-4">
            {form.faqs.items.map((item, index) => (
              <div key={index} className={cardClass}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">FAQ {index + 1}</h4>
                  {form.faqs.items.length > 1 && (
                    <ActionButton
                      tone="danger"
                      onClick={() =>
                        update((draft) => {
                          draft.faqs.items.splice(index, 1);
                          return draft;
                        })
                      }
                    >
                      Remove
                    </ActionButton>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <Field label="Question">
                    <input
                      className={inputClass}
                      value={item.question}
                      onChange={(e) =>
                        update((draft) => {
                          draft.faqs.items[index].question = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Answer">
                    <textarea
                      rows={3}
                      className={textareaClass}
                      value={item.answer}
                      onChange={(e) =>
                        update((draft) => {
                          draft.faqs.items[index].answer = e.target.value;
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.open}
                      onChange={(e) =>
                        update((draft) => {
                          draft.faqs.items[index].open = e.target.checked;
                          return draft;
                        })
                      }
                    />
                    Open by default
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>⚡</span> SkillNest in Action Tabs
          </h3>
          <Field label="Section Header Title">
            <input
              className={inputClass}
              value={form.inAction?.title || "See SkillNest in action"}
              onChange={(e) =>
                update((draft) => {
                  if (!draft.inAction) {
                    draft.inAction = { title: "", videoUrl: "/testvideo.mp4", tabs: [] };
                  }
                  draft.inAction.title = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="In Action Video (Direct Link)">
              <input
                className={inputClass}
                placeholder="Or paste video link (e.g. /testvideo.mp4 or https://...)"
                value={form.inAction?.videoUrl || ""}
                onChange={(e) =>
                  update((draft) => {
                    if (!draft.inAction) {
                      draft.inAction = { title: "", videoUrl: "/testvideo.mp4", tabs: [] };
                    }
                    draft.inAction.videoUrl = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                Upload Video File
              </span>
              <UploadField
                accept="video/*"
                currentUrl={form.inAction?.videoUrl}
                onUploaded={(url) =>
                  update((draft) => {
                    if (!draft.inAction) {
                      draft.inAction = { title: "", videoUrl: "", tabs: [] };
                    }
                    draft.inAction.videoUrl = url;
                    return draft;
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-4">
            {(form.inAction?.tabs || []).map((t, index) => (
              <div key={index} className="rounded-xl border border-gray-200 dark:border-zinc-850 bg-white/50 dark:bg-black/20 p-4 space-y-3">
                <p className="text-xs font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-1">
                  Tab {index + 1}: {t.tab}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Tab Label">
                    <input
                      className={inputClass}
                      value={t.tab}
                      onChange={(e) =>
                        update((draft) => {
                          if (draft.inAction && draft.inAction.tabs[index]) {
                            draft.inAction.tabs[index].tab = e.target.value;
                          }
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Lesson / Subtitle Label">
                    <input
                      className={inputClass}
                      value={t.lesson}
                      onChange={(e) =>
                        update((draft) => {
                          if (draft.inAction && draft.inAction.tabs[index]) {
                            draft.inAction.tabs[index].lesson = e.target.value;
                          }
                          return draft;
                        })
                      }
                    />
                  </Field>
                  <Field label="Eyebrow Text">
                    <input
                      className={inputClass}
                      value={t.eyebrow}
                      onChange={(e) =>
                        update((draft) => {
                          if (draft.inAction && draft.inAction.tabs[index]) {
                            draft.inAction.tabs[index].eyebrow = e.target.value;
                          }
                          return draft;
                        })
                      }
                    />
                  </Field>
                </div>
                <Field label="Tab Paragraph Description">
                  <textarea
                    rows={2}
                    className={textareaClass}
                    value={t.title}
                    onChange={(e) =>
                      update((draft) => {
                        if (draft.inAction && draft.inAction.tabs[index]) {
                          draft.inAction.tabs[index].title = e.target.value;
                        }
                        return draft;
                      })
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎯</span> Final CTA & Footer
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="CTA Eyebrow">
              <input
                className={inputClass}
                value={form.cta.eyebrow}
                onChange={(e) =>
                  update((draft) => {
                    draft.cta.eyebrow = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Button Label">
              <input
                className={inputClass}
                value={form.cta.buttonLabel}
                onChange={(e) =>
                  update((draft) => {
                    draft.cta.buttonLabel = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Title Prefix">
              <input
                className={inputClass}
                value={form.cta.titlePrefix}
                onChange={(e) =>
                  update((draft) => {
                    draft.cta.titlePrefix = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Button Link">
              <input
                className={inputClass}
                value={form.cta.buttonHref}
                onChange={(e) =>
                  update((draft) => {
                    draft.cta.buttonHref = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="CTA Title Highlight">
              <input
                className={inputClass}
                value={form.cta.titleHighlight}
                onChange={(e) =>
                  update((draft) => {
                    draft.cta.titleHighlight = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="Footer Copyright">
              <input
                className={inputClass}
                value={form.footer.copyright}
                onChange={(e) =>
                  update((draft) => {
                    draft.footer.copyright = e.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </div>
          <Field label="CTA Description">
            <textarea
              rows={4}
              className={textareaClass}
              value={form.cta.description}
              onChange={(e) =>
                update((draft) => {
                  draft.cta.description = e.target.value;
                  return draft;
                })
              }
            />
          </Field>
        </div>
      </div>
    </div>
  );
};

export default LandingCmsForm;
