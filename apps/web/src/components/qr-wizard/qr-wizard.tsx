'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, Copy, Loader2 } from 'lucide-react';
import {
  CONTENT_TYPE_REGISTRY,
  ContentType,
  QrCodeType,
  createQrCodeSchema,
  parseQrDesign,
  type CreateQrCodeDto,
} from '@qrgen/shared';
import { ApiError } from '@/lib/api-client';
import {
  useCreateQrCode,
  useUpdateQrContent,
  useUpdateQrDesign,
  useUpdateQrMeta,
} from '@/hooks/use-qr-codes';
import { useQrPreviewText } from '@/hooks/use-qr-preview-text';
import type { QrCode } from '@/lib/qr-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ContentTypePicker } from './content-type-picker';
import { ContentTypeFields, DEFAULT_CONTENT_DATA } from './content-fields';
import { DesignEditor } from './design-editor/design-editor';
import { QrLivePreview } from './qr-live-preview';
import { ExportMenu } from './export-menu';
import { CategorySelect } from './category-select';
import { TagsInput } from './tags-input';

function buildDefaultValues(existingQr?: QrCode): CreateQrCodeDto {
  if (existingQr) {
    return {
      type: existingQr.type,
      name: existingQr.name,
      tags: existingQr.tags,
      categoryId: existingQr.categoryId,
      notes: existingQr.notes ?? '',
      design: existingQr.design,
      content: { contentType: existingQr.contentType, data: existingQr.content },
    };
  }
  return {
    type: QrCodeType.DYNAMIC,
    name: '',
    tags: [],
    categoryId: null,
    notes: '',
    design: parseQrDesign({}),
    content: { contentType: ContentType.URL, data: DEFAULT_CONTENT_DATA[ContentType.URL] },
  };
}

export function QrWizard({ existingQr }: { existingQr?: QrCode }) {
  const router = useRouter();
  const isEdit = Boolean(existingQr);
  const [logoDataUri, setLogoDataUri] = React.useState<string | null>(null);

  const form = useForm<CreateQrCodeDto>({
    resolver: zodResolver(createQrCodeSchema),
    defaultValues: buildDefaultValues(existingQr),
  });
  const { handleSubmit, setValue, register, formState, control } = form;

  // useWatch (rather than calling form.watch() imperatively during render) is the primitive
  // RHF documents for subscribing to nested field paths - it reliably re-renders this
  // component when a leaf field several levels under content.data changes, which watch()
  // occasionally misses right after the parent object was just replaced via setValue.
  const contentType = useWatch({ control, name: 'content.contentType' });
  const type = useWatch({ control, name: 'type' });
  const contentData = useWatch({ control, name: 'content.data' });
  const watchedDesign = useWatch({ control, name: 'design' });
  const design = watchedDesign ?? parseQrDesign({});
  const categoryId = useWatch({ control, name: 'categoryId' });
  const tags = useWatch({ control, name: 'tags' });
  const contentMeta = CONTENT_TYPE_REGISTRY[contentType];

  const { text: previewText } = useQrPreviewText(
    type,
    contentType,
    contentData,
    existingQr?.encodedPayload,
  );

  const createMutation = useCreateQrCode();
  const updateMeta = useUpdateQrMeta(existingQr?.id ?? '');
  const updateDesign = useUpdateQrDesign(existingQr?.id ?? '');
  const updateContent = useUpdateQrContent(existingQr?.id ?? '');
  const isSaving =
    createMutation.isPending ||
    updateMeta.isPending ||
    updateDesign.isPending ||
    updateContent.isPending;

  function handleContentTypeChange(newType: ContentType) {
    setValue('content.contentType', newType, { shouldDirty: true });
    setValue('content.data', DEFAULT_CONTENT_DATA[newType], { shouldDirty: true });
    if (CONTENT_TYPE_REGISTRY[newType].dynamicOnly) {
      setValue('type', QrCodeType.DYNAMIC, { shouldDirty: true });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && existingQr) {
        const tasks: Promise<unknown>[] = [
          updateMeta.mutateAsync({
            name: values.name,
            tags: values.tags,
            categoryId: values.categoryId,
            notes: values.notes || null,
          }),
          updateDesign.mutateAsync(values.design ?? parseQrDesign({})),
        ];
        if (existingQr.type === QrCodeType.DYNAMIC) {
          tasks.push(updateContent.mutateAsync(values.content));
        }
        await Promise.all(tasks);
        toast.success('Changes saved');
      } else {
        const created = await createMutation.mutateAsync(values);
        toast.success('QR code created');
        router.push(`/dashboard/qr-codes/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="qr-name">Name</Label>
                <Input id="qr-name" placeholder="My QR code" {...register('name')} />
                {formState.errors.name && (
                  <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Type</Label>
                {isEdit ? (
                  <div>
                    <Badge variant="secondary">
                      {existingQr!.type === QrCodeType.DYNAMIC ? 'Dynamic' : 'Static'} QR code
                    </Badge>
                  </div>
                ) : (
                  <TypeToggle
                    value={type}
                    onChange={(v) => setValue('type', v, { shouldDirty: true })}
                    forceDynamic={contentMeta.dynamicOnly}
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <CategorySelect
                    value={categoryId ?? null}
                    onChange={(id) => setValue('categoryId', id, { shouldDirty: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <TagsInput
                    value={tags ?? []}
                    onChange={(tags) => setValue('tags', tags, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qr-notes">Notes</Label>
                <Textarea
                  id="qr-notes"
                  rows={2}
                  placeholder="Internal notes, not shown to visitors"
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          {!isEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Content type</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentTypePicker value={contentType} onChange={handleContentTypeChange} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                </TabsList>
                <TabsContent value="content">
                  {isEdit && existingQr!.type === QrCodeType.STATIC ? (
                    <p className="text-sm text-muted-foreground">
                      Static QR codes can&apos;t be edited after creation - duplicate this one to
                      create a new code with different content.
                    </p>
                  ) : (
                    <>
                      {isEdit && (
                        <p className="mb-4 text-xs text-muted-foreground">
                          This QR code&apos;s image won&apos;t change - content updates apply
                          instantly to the existing short link.
                        </p>
                      )}
                      <ContentTypeFields contentType={contentType} prefix="content.data" />
                    </>
                  )}
                </TabsContent>
                <TabsContent value="design">
                  <DesignEditor onPreviewLogoChange={setLogoDataUri} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create QR code'}
          </Button>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <QrLivePreview text={previewText} design={design} logoDataUri={logoDataUri} />
          {isEdit && existingQr && (
            <div className="space-y-3">
              <ExportMenu qrId={existingQr.id} />
              {existingQr.type === QrCodeType.DYNAMIC && existingQr.shortCode && (
                <ShortUrlCard encodedPayload={existingQr.encodedPayload} />
              )}
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function TypeToggle({
  value,
  onChange,
  forceDynamic,
}: {
  value: QrCodeType;
  onChange: (v: QrCodeType) => void;
  forceDynamic: boolean;
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5">
      <button
        type="button"
        disabled={forceDynamic}
        onClick={() => onChange(QrCodeType.STATIC)}
        className={cn(
          'rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          value === QrCodeType.STATIC
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent',
        )}
      >
        Static
      </button>
      <button
        type="button"
        onClick={() => onChange(QrCodeType.DYNAMIC)}
        className={cn(
          'rounded px-3 py-1.5 text-sm font-medium transition-colors',
          value === QrCodeType.DYNAMIC
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent',
        )}
      >
        Dynamic
      </button>
      {forceDynamic && (
        <span className="self-center px-2 text-xs text-muted-foreground">
          This content type requires dynamic
        </span>
      )}
    </div>
  );
}

function ShortUrlCard({ encodedPayload }: { encodedPayload: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(encodedPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <span className="flex-1 truncate text-xs">{encodedPayload}</span>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
