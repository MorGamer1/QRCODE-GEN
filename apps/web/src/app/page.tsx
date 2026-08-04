import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Github,
  Lock,
  Palette,
  QrCode,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { buildQrScene, renderSceneToSvg } from '@qrgen/qr-engine';
import { QR_DESIGN_PRESETS } from '@qrgen/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const oceanPreset = QR_DESIGN_PRESETS.find((p) => p.id === 'ocean-gradient')!.design;
const heroScene = buildQrScene('https://qrgen.app', { ...oceanPreset, size: 320, margin: 2 });
const heroSvg = renderSceneToSvg(heroScene);

const FEATURES = [
  {
    icon: QrCode,
    title: '16 content types',
    description: 'URLs, Wi-Fi, vCards, crypto wallets, app store links, events, and more - all in one generator.',
  },
  {
    icon: Zap,
    title: 'Static & dynamic codes',
    description: 'Dynamic codes redirect through a short link you can retarget instantly, without reprinting a thing.',
  },
  {
    icon: Palette,
    title: 'Full visual control',
    description: 'Module shapes, eye styles, gradients, logos, and frames - exported as PNG, SVG, PDF, EPS, or WebP.',
  },
  {
    icon: BarChart3,
    title: 'Real-time analytics',
    description: 'Scans by device, browser, location, and time, with heatmaps, geo maps, and CSV/JSON export.',
  },
  {
    icon: Shield,
    title: 'Built-in security',
    description: 'Rate limiting, 2FA, audit logs, password-protected codes, and scan limits out of the box.',
  },
  {
    icon: Lock,
    title: 'Self-hosted & open',
    description: 'Your data stays on your infrastructure. One Docker Compose command to run the whole stack.',
  },
];

const CONTENT_TYPES = [
  'URL',
  'Wi-Fi',
  'vCard',
  'Email',
  'SMS',
  'WhatsApp',
  'Phone',
  'Location',
  'Event',
  'Crypto',
  'PDF',
  'Image',
  'App Store',
  'Social',
  'Text',
  'Custom',
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#content-types" className="transition-colors hover:text-foreground">
              Content types
            </a>
            <a href="#self-hosted" className="transition-colors hover:text-foreground">
              Self-hosting
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:py-32">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Open-source & self-hosted
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              QR codes, <span className="text-primary">styled</span> and <span className="text-primary">tracked</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Generate static and dynamic QR codes for anything - URLs, Wi-Fi, vCards, payments, and more. Customize
              every pixel, then track every scan in real time. Run it all on your own infrastructure.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create your first QR code <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#self-hosted">
                  <Github className="h-4 w-4" /> Self-host it
                </a>
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative rotate-2 rounded-2xl border bg-card p-6 shadow-xl transition-transform hover:rotate-0">
              <div
                className="h-64 w-64 sm:h-72 sm:w-72"
                role="img"
                aria-label="Sample styled QR code generated by QRGen"
                dangerouslySetInnerHTML={{ __html: heroSvg }}
              />
              <div className="absolute -left-4 -top-4 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium shadow-md">
                Dynamic
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium shadow-md">
                1,204 scans
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything a commercial QR platform has</h2>
              <p className="mt-4 text-muted-foreground">
                Without the recurring bill, the vendor lock-in, or your visitors&apos; data leaving your servers.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="content-types" className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One generator, sixteen content types</h2>
              <p className="mt-4 text-muted-foreground">Pick a type, fill in the details, and QRGen builds the payload for you.</p>
            </div>
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
              {CONTENT_TYPES.map((type) => (
                <span
                  key={type}
                  className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="self-hosted" className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container">
            <Card className="mx-auto max-w-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Your infrastructure, your data</CardTitle>
                <CardDescription className="max-w-lg">
                  QRGen ships as a Docker Compose stack: web app, API, PostgreSQL, Redis, and a reverse proxy. No
                  external services required, no usage caps, no analytics shared with a third party.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo iconOnly className="text-foreground" />
          <p>&copy; {new Date().getFullYear()} QRGen. Self-hosted QR code platform.</p>
        </div>
      </footer>
    </div>
  );
}
