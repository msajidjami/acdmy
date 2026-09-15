'use client';

import {
  FileText,
  ShieldCheck,
  UserRound,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Ban,
  Scale,
  CreditCard,
  LockKeyhole,
  Gavel,
  Server,
  Copyright,
  ChevronDown,
  Globe2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type TermSection = {
  title: string;
  icon: React.ElementType;
  content: string;
  points?: string[];
};

const sections: TermSection[] = [
  {
    title: 'Acceptance of Terms',
    icon: FileText,
    content:
      'By creating an account or using ilmora786, you agree to use the platform responsibly and in accordance with these Terms of Service, the Privacy Policy, and applicable platform policies.',
    points: [
      'If you do not agree with these terms, you should not use the platform.',
      'Additional terms may apply to specific features or services.',
      'Academies may also establish their own internal policies.',
    ],
  },
  {
    title: 'About ilmora786',
    icon: Globe2,
    content:
      'ilmora786 is a broad educational technology platform intended to support learning and educational organizations across multiple fields, including academic education, science, technology, languages, Islamic education, mathematics, coding and professional skills.',
    points: [
      'The platform may provide account management, Academy management, classes, educational tools and communication features.',
      'Features may change, improve, be replaced or be discontinued over time.',
      'ilmora786 does not itself become the academic authority of an Academy.',
    ],
  },
  {
    title: 'User Accounts',
    icon: UserRound,
    content:
      'Users are responsible for maintaining accurate account information and protecting their account credentials.',
    points: [
      'Do not create accounts using intentionally false identity information.',
      'Do not share your password or authentication credentials with unauthorized people.',
      'Do not use another person’s account without permission.',
      'Notify the platform if you suspect unauthorized access.',
    ],
  },
  {
    title: 'Academy Owner Responsibilities',
    icon: Building2,
    content:
      'Academy Owners are responsible for the information, people, educational services and internal management they operate through their Academy.',
    points: [
      'Provide accurate Academy information.',
      'Use student and teacher information only for legitimate authorized purposes.',
      'Manage Academy-specific rules, schedules, classes and educational standards.',
      'Ensure that Academy activities comply with applicable requirements.',
      'Maintain appropriate control over Academy accounts and access.',
    ],
  },
  {
    title: 'Teacher Responsibilities',
    icon: GraduationCap,
    content:
      'Teachers use ilmora786 as part of an Academy or educational environment. Internal employment, performance, attendance, compensation and disciplinary matters are primarily managed by the relevant Academy.',
    points: [
      'Teachers should follow the Academy’s authorized rules and procedures.',
      'Teachers should protect student and Academy information.',
      'Teachers must not misuse platform access.',
      'Platform-level security, fraud, harassment and account-abuse rules continue to apply.',
    ],
  },
  {
    title: 'Student Responsibilities',
    icon: Users,
    content:
      'Students are expected to use ilmora786 responsibly and access only the classes, courses, accounts and features they are authorized to use.',
    points: [
      'Use your own account.',
      'Follow authorized class and course access.',
      'Respect teachers, students and other users.',
      'Do not attempt to bypass platform security or access controls.',
      'Do not use the platform for fraud, harassment or harmful activity.',
    ],
  },
  {
    title: 'Academy Internal Policies',
    icon: Scale,
    content:
      'Each Academy may establish its own policies concerning Teachers, Students, classes, courses, schedules, fees, attendance, teaching standards and internal administration.',
    points: [
      'ilmora786 does not replace an Academy’s internal management.',
      'Academies are responsible for communicating their internal rules to their users.',
      'Platform policies apply separately to security, account misuse, fraud, harassment and other platform-level issues.',
    ],
  },
  {
    title: 'Classes and Educational Services',
    icon: BookOpen,
    content:
      'Educational content, classes and services are generally provided or managed by Academies and their authorized educators. ilmora786 provides technology and platform functionality and does not guarantee a particular educational result.',
    points: [
      'Class availability may depend on the Academy.',
      'Schedules may be changed by authorized Academy users.',
      'Educational quality and curriculum may vary between Academies.',
      'Users should verify educational details directly with the relevant Academy.',
    ],
  },
  {
    title: 'Prohibited Activities',
    icon: Ban,
    content:
      'Users must not use ilmora786 to harm others, interfere with the platform, bypass security, commit fraud, or engage in unlawful or abusive activity.',
    points: [
      'Hacking or attempting to bypass security controls.',
      'Unauthorized account access.',
      'Fraud, deception or impersonation.',
      'Harassment, threats or serious abuse.',
      'Distribution of harmful or inappropriate content.',
      'Interference with platform availability or functionality.',
      'Unauthorized collection or misuse of personal information.',
    ],
  },
  {
    title: 'Intellectual Property',
    icon: Copyright,
    content:
      'The ilmora786 platform, software, branding, interface elements and original platform materials may be protected by applicable intellectual property laws. Users should respect the rights of ilmora786, Academies, Teachers and other content owners.',
    points: [
      'Do not copy or redistribute platform software without authorization.',
      'Do not misuse the ilmora786 name, logo or branding.',
      'Users should only upload content they have the right to use.',
      'Academy and Teacher content may remain subject to their own rights.',
    ],
  },
  {
    title: 'User Content',
    icon: MessageCircle,
    content:
      'Users and Academies may create, upload or share educational or other content through platform features. Users remain responsible for content they submit and must have appropriate rights to provide it.',
    points: [
      'Do not upload content that violates applicable rights or laws.',
      'Do not upload malicious software or harmful files.',
      'Do not intentionally submit false or misleading information.',
      'The platform may remove content that violates platform rules.',
    ],
  },
  {
    title: 'Fees and Payments',
    icon: CreditCard,
    content:
      'ilmora786 does not currently require all Academy fees to be paid through the platform. Payment arrangements may be determined by the relevant Academy and its Students.',
    points: [
      'An Academy may have its own fee policies.',
      'The platform is not automatically a party to private payment arrangements between an Academy and a Student.',
      'Future payment features may have additional terms.',
    ],
  },
  {
    title: 'Account Suspension and Termination',
    icon: Gavel,
    content:
      'ilmora786 may restrict, suspend or terminate access when necessary to protect the platform, users, security, or to address serious or repeated violations of applicable rules.',
    points: [
      'Warnings or feature restrictions may be used for some violations.',
      'Temporary suspension may be used while an incident is reviewed.',
      'Serious or repeated violations may result in permanent account closure.',
      'Where appropriate, users may have access to a review or appeal process.',
    ],
  },
  {
    title: 'Platform Security',
    icon: LockKeyhole,
    content:
      'Users must not attempt to interfere with platform security, authentication, infrastructure or availability.',
    points: [
      'Do not attempt unauthorized penetration or exploitation.',
      'Do not attempt to access protected data.',
      'Do not intentionally overload or disrupt platform systems.',
      'Report security concerns through an appropriate support channel.',
    ],
  },
  {
    title: 'Third-Party Services',
    icon: Server,
    content:
      'Some ilmora786 features may depend on third-party services such as hosting, databases, communication systems, video services, cloud infrastructure or other technology providers.',
    points: [
      'Third-party services may have their own terms and privacy policies.',
      'Availability of a third-party feature may depend on that provider.',
      'ilmora786 may replace or change service providers when necessary.',
    ],
  },
  {
    title: 'Disclaimer',
    icon: AlertTriangle,
    content:
      'ilmora786 is provided as an educational technology platform. While reasonable efforts may be made to maintain reliability and security, uninterrupted availability and error-free operation cannot be guaranteed.',
    points: [
      'Temporary outages may occur.',
      'Third-party service interruptions may affect some features.',
      'Educational outcomes are not guaranteed by the platform.',
      'Users should maintain appropriate backups of important information where necessary.',
    ],
  },
  {
    title: 'Changes to the Terms',
    icon: FileText,
    content:
      'These Terms of Service may be updated when the platform, services, technology or operational requirements change. Updated terms will be published on this page.',
  },
];

function TermCard({ section }: { section: TermSection }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <Icon size={21} />
          </div>

          <h2 className="text-base font-bold text-gray-950">
            {section.title}
          </h2>
        </div>

        <ChevronDown
          size={20}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-6 pt-5">
          <p className="text-sm leading-7 text-gray-700">
            {section.content}
          </p>

          {section.points && (
            <div className="mt-5 space-y-3">
              {section.points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 text-sm leading-6 text-gray-700"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-green-700"
                  />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-white via-green-50/40 to-white">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              <FileText size={18} />
              ilmora786 Legal Terms
            </div>

            <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              Terms of Service
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
              These terms describe the basic conditions for using ilmora786,
              including account responsibilities, Academy management,
              educational services, platform security and prohibited use.
            </p>

            <p className="mt-4 text-sm font-semibold text-green-700">
              Last Updated: September 2026
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/policies"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                Platform Policies
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:border-green-600 hover:text-green-700"
              >
                Privacy Policy
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8">
          <div className="flex gap-4">
            <Scale className="mt-1 shrink-0 text-green-700" size={25} />

            <div>
              <h2 className="text-xl font-black text-gray-950">
                A Platform for Many Fields of Education
              </h2>

              <p className="mt-2 text-sm leading-7 text-gray-700">
                ilmora786 is not limited to one subject or educational field.
                It is designed to support academic learning, science,
                technology, languages, Islamic education, mathematics, coding,
                professional skills and other educational activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {sections.map((section) => (
            <TermCard key={section.title} section={section} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-green-700 p-7 text-white sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <ShieldCheck size={25} />

                <h2 className="text-2xl font-black">
                  Use ilmora786 Responsibly
                </h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-green-50">
                Respect other users, protect account information, follow your
                Academy’s authorized procedures, and do not attempt to misuse
                or interfere with the platform.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl bg-white/10 p-5">
              <LockKeyhole size={45} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-5 py-12 text-center">
          <BookOpen className="mx-auto text-green-700" size={32} />

          <h2 className="mt-4 text-2xl font-black text-gray-950">
            Learn. Teach. Grow.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            By using ilmora786 responsibly, users help create a secure and
            productive environment for learning and teaching.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/privacy"
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:text-green-700"
            >
              Privacy Policy
            </Link>

            <Link
              href="/policies"
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:text-green-700"
            >
              Platform Policies
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}