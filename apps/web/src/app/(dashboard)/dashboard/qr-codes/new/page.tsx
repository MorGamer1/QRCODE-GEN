import { QrWizard } from '@/components/qr-wizard/qr-wizard';

export default function NewQrCodePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create a QR code</h1>
        <p className="text-sm text-muted-foreground">
          Choose a content type, then style it to match your brand.
        </p>
      </div>
      <QrWizard />
    </div>
  );
}
