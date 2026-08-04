'use client';

import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadField } from '../file-upload-field';
import { Field, getFieldError } from './shared';

const PDF_MIME_TYPES = ['application/pdf'];
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 25 * 1024 * 1024;

export function PdfFields({ prefix }: { prefix: string }) {
  const { control, register, formState } = useFormContext();
  const { errors } = formState;
  const [fileName, setFileName] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Field id="c-file" label="PDF file" error={getFieldError(errors, `${prefix}.fileId`)}>
        <Controller
          name={`${prefix}.fileId`}
          control={control}
          render={({ field }) => (
            <FileUploadField
              purpose="content"
              accept={PDF_MIME_TYPES}
              maxSizeBytes={MAX_SIZE}
              value={field.value ?? null}
              fileName={fileName}
              helperText="PDF, up to 25MB"
              onChange={(fileId, meta) => {
                field.onChange(fileId);
                setFileName(meta?.fileName ?? null);
              }}
            />
          )}
        />
      </Field>
      <Field id="c-title" label="Title" optional error={getFieldError(errors, `${prefix}.title`)}>
        <Input
          id="c-title"
          placeholder="Shown on the landing page"
          {...register(`${prefix}.title`)}
        />
      </Field>
    </div>
  );
}

export function ImageFields({ prefix }: { prefix: string }) {
  const { control, register, formState } = useFormContext();
  const { errors } = formState;
  const [fileName, setFileName] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Field id="c-file" label="Image file" error={getFieldError(errors, `${prefix}.fileId`)}>
        <Controller
          name={`${prefix}.fileId`}
          control={control}
          render={({ field }) => (
            <FileUploadField
              purpose="content"
              accept={IMAGE_MIME_TYPES}
              maxSizeBytes={MAX_SIZE}
              value={field.value ?? null}
              fileName={fileName}
              helperText="PNG, JPEG, WebP or GIF, up to 25MB"
              onChange={(fileId, meta) => {
                field.onChange(fileId);
                setFileName(meta?.fileName ?? null);
              }}
            />
          )}
        />
      </Field>
      <Field id="c-title" label="Title" optional error={getFieldError(errors, `${prefix}.title`)}>
        <Input id="c-title" {...register(`${prefix}.title`)} />
      </Field>
      <Field
        id="c-caption"
        label="Caption"
        optional
        error={getFieldError(errors, `${prefix}.caption`)}
      >
        <Textarea id="c-caption" rows={2} {...register(`${prefix}.caption`)} />
      </Field>
    </div>
  );
}
