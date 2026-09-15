'use client';

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  FileWarning,
  Gavel,
  Globe2,
  GraduationCap,
  LifeBuoy,
  LockKeyhole,
  MessageCircleWarning,
  Scale,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type PolicyItem = {
  title: string;
  violation: string;
  solution: string;
  level: 'Warning' | 'Restriction' | 'Suspension' | 'Permanent Ban';
};

const ownerPolicies: PolicyItem[] = [
  {
    title: 'False or Misleading Information',
    violation:
      'Creating or maintaining an account or academy using intentionally false, misleading, or fraudulent information.',
    solution:
      'ilmora786 may request verification or correction. Serious or repeated violations may result in account restriction or suspension.',
    level: 'Suspension',
  },
  {
    title: 'Fake Academy Information',
    violation:
      'Providing false academy identity, ownership information, contact details, or intentionally misleading academy information.',
    solution:
      'The information may be reviewed and correction may be required. Serious or repeated violations may result in academy or owner account suspension.',
    level: 'Suspension',
  },
  {
    title: 'Spam and Platform Misuse',
    violation:
      'Using ilmora786 for excessive spam, irrelevant promotional activity, automated abuse, or repeated unwanted communication.',
    solution:
      'Content or activity may be restricted or removed. Continued misuse may result in feature restrictions or temporary suspension.',
    level: 'Restriction',
  },
  {
    title: 'Harassment or Threatening Behavior',
    violation:
      'Harassing, threatening, intimidating, bullying, or repeatedly sending inappropriate communications to another user.',
    solution:
      'Reports and available evidence may be reviewed. Serious confirmed violations may result in temporary suspension or permanent account closure.',
    level: 'Suspension',
  },
  {
    title: 'Unauthorized Use of User Data',
    violation:
      'Accessing, collecting, sharing, storing, or using another user’s personal or account information without proper authorization.',
    solution:
      'Access may be restricted while the matter is reviewed. Confirmed serious violations may result in suspension or permanent account closure.',
    level: 'Suspension',
  },
  {
    title: 'Unauthorized Account Access',
    violation:
      'Attempting to access another user’s account, session, credentials, or private information without permission.',
    solution:
      'The relevant account or session may be secured or locked while a security review is conducted.',
    level: 'Restriction',
  },
  {
    title: 'Security Abuse',
    violation:
      'Attempting to hack, exploit, bypass security controls, interfere with platform systems, or intentionally damage ilmora786.',
    solution:
      'The account may be immediately restricted and reviewed. Serious security violations may result in permanent account closure.',
    level: 'Permanent Ban',
  },
  {
    title: 'Fraud or Deception',
    violation:
      'Using ilmora786 to deceive users, commit fraud, manipulate platform processes, or obtain an unauthorized benefit through dishonest activity.',
    solution:
      'The account may be suspended while available evidence is reviewed. Confirmed serious fraud may result in permanent account closure.',
    level: 'Permanent Ban',
  },
  {
    title: 'Repeated Policy Violations',
    violation:
      'Repeatedly violating platform rules after receiving warnings, restrictions, or previous suspensions.',
    solution:
      'Enforcement may escalate based on the seriousness and history of the violations, including permanent account closure where appropriate.',
    level: 'Permanent Ban',
  },
];

const studentPolicies: PolicyItem[] = [
  {
    title: 'Unauthorized Class Access',
    violation:
      'Attempting to join a class, course, lesson, or session that the student has not been assigned or authorized to access.',
    solution:
      'Unauthorized access will be blocked. Repeated attempts may result in a warning or temporary restriction.',
    level: 'Restriction',
  },
  {
    title: 'Unauthorized Class or Course Switching',
    violation:
      'Repeatedly attempting to bypass the academy’s assigned class or course structure without following the academy’s management process.',
    solution:
      'Students will only have access to authorized classes and courses. Changes will follow the academy’s own management process.',
    level: 'Restriction',
  },
  {
    title: 'Bypassing Platform Access Controls',
    violation:
      'Intentionally attempting to bypass assigned learning structures, permissions, authentication, or platform access controls.',
    solution:
      'Unauthorized access will be blocked. Depending on the circumstances, a warning, restriction, or temporary suspension may apply.',
    level: 'Warning',
  },
  {
    title: 'Spam',
    violation:
      'Sending repeated unwanted messages, requests, promotional material, or irrelevant content through the platform.',
    solution:
      'The content may be removed and a warning may be issued. Continued misuse may result in messaging or account restrictions.',
    level: 'Restriction',
  },
  {
    title: 'Harassment or Bullying',
    violation:
      'Harassing, bullying, intimidating, threatening, or repeatedly behaving inappropriately toward another user.',
    solution:
      'Reports may be reviewed with available evidence. Confirmed violations may result in warning, restriction, or temporary suspension.',
    level: 'Suspension',
  },
  {
    title: 'Inappropriate Content',
    violation:
      'Uploading, sending, or sharing abusive, obscene, unlawful, harmful, or unrelated content through the platform.',
    solution:
      'The content may be removed. Depending on severity, the account may receive a warning, restriction, suspension, or permanent ban.',
    level: 'Suspension',
  },
  {
    title: 'Threats or Serious Misconduct',
    violation:
      'Threatening another user or engaging in serious abusive, harmful, or disruptive behavior.',
    solution:
      'The account may be temporarily restricted while the incident is reviewed. Serious confirmed violations may result in permanent account closure.',
    level: 'Permanent Ban',
  },
  {
    title: 'Fake Account or Identity Misuse',
    violation:
      'Creating fake accounts, impersonating another person, or intentionally using another person’s account.',
    solution:
      'The account may be secured and identity verification may be required. Serious or repeated abuse may result in permanent closure.',
    level: 'Suspension',
  },
  {
    title: 'Fraud or Platform Abuse',
    violation:
      'Using the platform to deceive others, manipulate systems, or obtain an unauthorized advantage.',
    solution:
      'The account may be suspended while the matter is reviewed. Confirmed serious abuse may result in permanent account closure.',
    level: 'Permanent Ban',
  },
  {
    title: 'Security or Hacking Attempts',
    violation:
      'Attempting to hack, exploit, bypass security controls, access restricted systems, or interfere with platform infrastructure.',
    solution:
      'The account may be immediately locked and reviewed. Serious security violations may result in permanent account closure.',
    level: 'Permanent Ban',
  },
];

const enforcementLevels = [
  {
    number: '01',
    title: 'Warning',
    description:
      'The user is informed about the violation and may be given an opportunity to correct the behavior.',
    icon: AlertTriangle,
  },
  {
    number: '02',
    title: 'Restriction',
    description:
      'Specific account features or activities may be temporarily restricted while the account remains active.',
    icon: LockKeyhole,
  },
  {
    number: '03',
    title: 'Temporary Suspension',
    description:
      'Account access may be temporarily disabled for a defined period or while a review is completed.',
    icon: FileWarning,
  },
  {
    number: '04',
    title: 'Permanent Ban',
    description:
      'An account may be permanently closed for serious, fraudulent, dangerous, or repeated violations.',
    icon: Ban,
  },
];

function PolicyCard({ policy }: { policy: PolicyItem }) {
  const [open, setOpen] = useState(false);

  const levelClasses = {
    Warning: 'bg-amber-50 text-amber-700 border-amber-200',
    Restriction: 'bg-blue-50 text-blue-700 border-blue-200',
    Suspension: 'bg-orange-50 text-orange-700 border-orange-200',
    'Permanent Ban': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 p-5 text-left"
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 transition-colors group-hover:bg-green-700 group-hover:text-white">
            <ShieldCheck size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold leading-6 text-gray-950">
              {policy.title}
            </h3>

            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${levelClasses[policy.level]}`}
            >
              {policy.level}
            </span>
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500">
          <ChevronDown
            size={19}
            className={`transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 px-5 pb-6 pt-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-500">
                Violation
              </p>

              <p className="text-sm leading-7 text-gray-700">
                {policy.violation}
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-green-100 bg-green-50/70 p-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-green-700">
                Platform Response
              </p>

              <p className="text-sm leading-7 text-gray-700">
                {policy.solution}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  dark?: boolean;
}) {
  return (
    <div className="mb-9 flex items-start gap-4">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
          dark ? 'bg-green-600 text-white' : 'bg-gray-950 text-white'
        }`}
      >
        <Icon size={26} />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
          {eyebrow}
        </p>

        <h2
          className={`mt-2 text-3xl font-black tracking-tight ${
            dark ? 'text-white' : 'text-gray-950'
          }`}
        >
          {title}
        </h2>

        {description && (
          <p
            className={`mt-2 max-w-2xl text-sm leading-7 ${
              dark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-gray-950 via-gray-900 to-green-950">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-300">
              <ShieldCheck size={16} />
              ilmora786 • Platform Policies
            </div>

            <h1 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Platform Policies
              <span className="block text-green-400">
                Built for Trust & Safety
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-gray-300 sm:text-lg">
              These policies establish the basic standards for responsible use
              of ilmora786 across academic education, science, technology,
              languages, Islamic education, mathematics, coding, professional
              skills, and other areas of learning.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-green-400"
              >
                <ShieldCheck size={17} />
                Privacy Policy
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/terms"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-green-400 hover:text-green-300"
              >
                <FileText size={17} />
                Terms of Service
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-400">
              <span>Policy Framework</span>
              <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
              <span>Responsible Platform Use</span>
              <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
              <span>User Safety & Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Navigation */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4 sm:px-6 lg:px-8">
          <span className="mr-2 text-xs font-black uppercase tracking-widest text-gray-400">
            Legal & Policies
          </span>

          <Link
            href="/privacy"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
          >
            Terms of Service
          </Link>

          <span className="rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
            Platform Policies
          </span>
        </div>
      </section>

      {/* Policy Principle */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-green-200 bg-green-50 p-7 sm:p-9">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-green-100 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white shadow-sm">
              <Scale size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-green-700">
                Scope of These Policies
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-950">
                Platform Rules vs. Academy Management
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-700">
                These policies govern use of the ilmora786 platform. They do
                not replace or control the internal management policies of an
                Academy. Each Academy may establish its own rules regarding
                Teachers, Students, classes, subjects, schedules, fees,
                educational standards, attendance, performance, and day-to-day
                administration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Policies */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Academy Owner"
          title="Owner Platform Rules"
          description="Academy Owners are expected to use ilmora786 honestly, securely, lawfully, and responsibly."
          icon={UserCog}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {ownerPolicies.map((policy) => (
            <PolicyCard key={policy.title} policy={policy} />
          ))}
        </div>
      </section>

      {/* Teacher Clarification */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gray-950 p-7 text-white shadow-xl sm:p-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-green-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white">
              <GraduationCap size={25} />
            </div>

            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-widest text-green-400">
                Academy Responsibility
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Teacher Management Remains With Each Academy
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-300">
                ilmora786 does not establish a general disciplinary framework
                for Teachers regarding their internal Academy responsibilities.
                Each Academy is responsible for defining and managing its own
                Teacher policies, expectations, attendance requirements,
                teaching standards, performance procedures, and internal
                disciplinary processes.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-green-400"
                />

                <p className="text-sm leading-6 text-gray-300">
                  Platform-level security, fraud, harassment, account abuse,
                  unauthorized access, and other serious violations remain
                  subject to these general platform policies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Policies */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Student"
          title="Student Platform Rules"
          description="Students are expected to use ilmora786 responsibly and only access accounts, classes, courses, and features they are authorized to use."
          icon={GraduationCap}
          dark={false}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {studentPolicies.map((policy) => (
            <PolicyCard key={policy.title} policy={policy} />
          ))}
        </div>
      </section>

      {/* Enforcement */}
      <section className="mt-10 border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-lg">
              <Gavel size={25} />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-green-700">
              Enforcement Framework
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
              How Violations Are Handled
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Enforcement may depend on the seriousness, frequency, available
              evidence, security impact, and circumstances of the violation.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {enforcementLevels.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.number}
                  className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-wider text-green-700">
                      {item.number}
                    </span>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white transition-colors group-hover:bg-green-700">
                      <Icon size={18} />
                    </div>
                  </div>

                  <h3 className="mt-6 text-lg font-black text-gray-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <p className="text-sm leading-6 text-amber-900">
              Enforcement is not necessarily automatic or identical for every
              incident. ilmora786 may consider the nature and circumstances of
              a reported violation before taking action.
            </p>
          </div>
        </div>
      </section>

      {/* Reporting & Appeal */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Safety & Support
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Reporting, Review & Appeals
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            ilmora786 provides a structured approach for reporting serious
            platform issues and reviewing certain enforcement actions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:shadow-lg sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <MessageCircleWarning size={24} />
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-950">
              Report a Violation
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              If you believe another user has seriously violated these
              policies, you may report the issue through the available
              reporting system. Clear information and supporting evidence can
              help with review.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Describe what happened clearly.',
                'Provide relevant user, academy, or class information.',
                'Include screenshots or other available evidence.',
                'Do not submit false or intentionally misleading reports.',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-green-700"
                  />

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:shadow-lg sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <LifeBuoy size={24} />
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-950">
              Review and Appeal
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              Where an account has been restricted or suspended, ilmora786 may
              provide a review or appeal process depending on the nature of the
              action.
            </p>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Users requesting review should provide accurate information and
              relevant evidence. False or abusive appeals may themselves be
              treated as platform misuse.
            </p>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Review Principle
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                Reviews may consider the available evidence, nature of the
                incident, account history, and relevant circumstances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <CreditCard size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-green-700">
                Financial Arrangements
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-950">
                Fees and Payments
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                ilmora786 does not currently require all Academy fees to be
                paid through the platform. Payment arrangements between an
                Academy and its Students may follow the method agreed upon by
                the Academy.
              </p>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                Optional payment features may be introduced in the future and
                will be governed by their applicable terms when introduced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Security */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-green-700 p-7 text-white shadow-xl sm:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <LockKeyhole size={25} />

                <h2 className="text-2xl text-black">
                  Protect Your Account
                </h2>
              </div>

              <p className="mt-3 text-sm leading-7  text-black">
                Keep your password private, use accurate account information,
                and never share your login credentials with another person.
                Users are responsible for activity performed through their
                accounts.
              </p>

              <div className="mt-5 text-black flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  Keep credentials private
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  Use accurate information
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  Report suspicious activity
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 rounded-3xl border border-white/10 bg-white/10 p-7 sm:block">
              <ShieldCheck size={58} />
            </div>
          </div>
        </div>
      </section>

      {/* Final Legal Navigation */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white">
            <BookOpen size={27} />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-green-700">
            ilmora786
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Learn. Teach. Grow.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600">
            ilmora786 connects learners, teachers, and educational
            organizations across different fields of knowledge. Responsible
            use of the platform helps maintain a secure, respectful, and
            productive learning environment.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
            >
              <ShieldCheck size={16} />
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
            >
              <FileText size={16} />
              Terms of Service
            </Link>

            <span className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700">
              <Globe2 size={16} />
              Platform Policies
            </span>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-400">
            © {new Date().getFullYear()} ilmora786. All rights reserved.
          </div>
        </div>
      </section>
    </main>
  );
}