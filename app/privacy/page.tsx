'use client';

import {
  ShieldCheck,
  Database,
  UserRound,
  GraduationCap,
  Building2,
  Cookie,
  LockKeyhole,
  Share2,
  Trash2,
  Baby,
  FileText,
  ChevronDown,
  Globe2,
  ArrowRight,
  CheckCircle2,
  Mail,
  Server,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type PrivacySection = {
  title: string;
  icon: React.ElementType;
  content: string;
  points?: string[];
};

const sections: PrivacySection[] = [
  {
    title: 'Information We Collect',
    icon: Database,
    content:
      'When you create or use an ilmora786 account, we may collect information needed to provide the platform and its educational services. The information collected may depend on your role and the features you use.',
    points: [
      'Name and account profile information.',
      'Email address and other account contact information.',
      'Academy name, description, ownership and organizational information.',
      'Student and Teacher profile information provided through an Academy.',
      'Class, course, enrollment and educational activity information.',
      'Login, security and authentication information.',
      'Technical information such as browser, device, IP address and general usage information.',
    ],
  },
  {
    title: 'Account Information',
    icon: UserRound,
    content:
      'We use account information to create and maintain your account, authenticate access, communicate important service information, and provide features appropriate to your role.',
    points: [
      'You should provide accurate information when creating an account.',
      'You are responsible for keeping your login credentials secure.',
      'You should notify the platform if you believe your account has been accessed without authorization.',
    ],
  },
  {
    title: 'Academy Information',
    icon: Building2,
    content:
      'Academies may provide organizational information, educational programs, classes, schedules and related information so that ilmora786 can provide academy management and learning features.',
    points: [
      'Academy Owners are responsible for providing information they are authorized to provide.',
      'Academies should only share personal information through the platform when they have an appropriate basis or authorization to do so.',
      'Academies remain responsible for their own internal management and educational policies.',
    ],
  },
  {
    title: 'Student and Teacher Information',
    icon: GraduationCap,
    content:
      'Depending on how an Academy uses ilmora786, educational information may be created or provided for Students and Teachers. Access to this information is intended to follow the platform roles and the Academy’s authorized use of the system.',
    points: [
      'Students may have access to information related to their own learning activities.',
      'Teachers may access information required for authorized teaching activities.',
      'Academy Owners may manage information needed for their Academy operations.',
      'Access should not be used for unrelated purposes or unauthorized data collection.',
    ],
  },
  {
    title: 'How We Use Information',
    icon: Settings2,
    content:
      'Information may be used to operate, maintain, secure and improve ilmora786 and to provide educational platform features.',
    points: [
      'Create and manage user accounts.',
      'Provide Academy, class, course and learning features.',
      'Authenticate users and protect accounts.',
      'Detect fraud, abuse, unauthorized access and security incidents.',
      'Provide support and respond to user requests.',
      'Improve platform performance, reliability and functionality.',
      'Communicate important service, security or policy information.',
    ],
  },
  {
    title: 'Cookies and Similar Technologies',
    icon: Cookie,
    content:
      'ilmora786 may use cookies, local storage or similar technologies required for authentication, security, preferences and platform functionality.',
    points: [
      'Authentication cookies may keep you signed in.',
      'Security-related technologies may help protect accounts and sessions.',
      'Preference information may be used to improve the user experience.',
      'Some third-party services may use their own technologies according to their respective policies.',
    ],
  },
  {
    title: 'Data Sharing',
    icon: Share2,
    content:
      'We do not treat user information as public information simply because an account exists. Information may be shared or made accessible where necessary to operate the platform, provide an Academy service, comply with applicable requirements, protect users, or respond to security incidents.',
    points: [
      'Authorized Academy users may access information needed for Academy operations.',
      'Service providers may process information required to provide hosting, database, communication, authentication, video or other technical services.',
      'Information may be disclosed where required by applicable law or lawful process.',
      'Information may be used or disclosed when reasonably necessary to investigate fraud, abuse or security incidents.',
    ],
  },
  {
    title: 'Third-Party Services',
    icon: Server,
    content:
      'ilmora786 may use third-party infrastructure or services to operate specific features. Examples may include hosting, databases, cloud storage, authentication, communication, video conferencing, analytics or other technical services.',
    points: [
      'Third-party services may process limited information required for their function.',
      'Their own privacy policies and terms may also apply.',
      'We aim to use third-party services appropriate for the relevant platform function.',
    ],
  },
  {
    title: 'Data Security',
    icon: LockKeyhole,
    content:
      'We take reasonable technical and organizational measures to protect account and platform information against unauthorized access, misuse, alteration or loss. However, no internet service can guarantee absolute security.',
    points: [
      'Use a strong and unique password.',
      'Do not share your login credentials.',
      'Log out from shared or public devices.',
      'Report suspicious account activity as soon as possible.',
    ],
  },
  {
    title: 'Data Retention',
    icon: FileText,
    content:
      'Information may be retained for as long as reasonably necessary to provide services, maintain records, protect security, resolve disputes, comply with applicable requirements, or fulfill legitimate operational purposes.',
    points: [
      'Different types of information may have different retention periods.',
      'Some records may need to remain available after an account is closed.',
      'When information is no longer reasonably required, it may be deleted or anonymized where appropriate.',
    ],
  },
  {
    title: 'Account and Data Deletion',
    icon: Trash2,
    content:
      'Users may request account closure or deletion of applicable personal information through the available support or account-management process. Some information may need to be retained where required for security, legal, operational or dispute-resolution purposes.',
    points: [
      'Account deletion may affect access to classes, courses and platform history.',
      'Academy-managed records may also be subject to the Academy’s own policies.',
      'Deletion requests may require reasonable verification to prevent unauthorized deletion requests.',
    ],
  },
  {
    title: 'Children and Minor Users',
    icon: Baby,
    content:
      'Educational platforms may be used by students who are minors. Where a minor uses ilmora786 through an Academy or educational organization, the Academy and relevant responsible adults should ensure that the use of the platform is appropriate and authorized.',
    points: [
      'Academies should provide only information they are authorized to provide.',
      'Parents, guardians and responsible educational organizations should supervise minor users where appropriate.',
      'We do not intentionally request unnecessary personal information from minors.',
    ],
  },
  {
    title: 'Your Privacy Rights',
    icon: UserRound,
    content:
      'Depending on applicable law and circumstances, users may have rights relating to access, correction, deletion or other handling of their personal information.',
    points: [
      'Request access to applicable personal information.',
      'Request correction of inaccurate information.',
      'Request deletion where applicable.',
      'Ask questions about how information is used.',
      'Raise a privacy concern through the available contact process.',
    ],
  },
  {
    title: 'Changes to This Privacy Policy',
    icon: FileText,
    content:
      'We may update this Privacy Policy when the platform, services, technology or legal requirements change. The updated version will be published on this page with an updated effective date where appropriate.',
  },
];

function PrivacyCard({ section }: { section: PrivacySection }) {
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

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-white via-green-50/40 to-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              <ShieldCheck size={18} />
              ilmora786 Privacy
            </div>

            <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              Privacy Policy
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
              This Privacy Policy explains how ilmora786 may collect, use,
              protect, retain and manage information when you use our
              educational platform.
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
                href="/terms"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:border-green-600 hover:text-green-700"
              >
                Terms of Service
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 shrink-0 text-green-700" size={25} />

            <div>
              <h2 className="text-xl font-black text-gray-950">
                Our Privacy Approach
              </h2>

              <p className="mt-2 text-sm leading-7 text-gray-700">
                ilmora786 is designed to support learning across academic,
                scientific, technical, language, Islamic and professional
                fields. We aim to collect and use information for legitimate
                platform, educational, security and operational purposes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {sections.map((section) => (
            <PrivacyCard key={section.title} section={section} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gray-950 p-7 text-white sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-600">
              <Mail size={23} />
            </div>

            <div>
              <h2 className="text-2xl font-black">
                Privacy Questions or Requests
              </h2>

              <p className="mt-2 text-sm leading-7 text-gray-300">
                If you have a privacy question, data-access request,
                correction request, deletion request, or security concern,
                please use the official contact method provided by ilmora786.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-5 py-12 text-center">
          <LockKeyhole className="mx-auto text-green-700" size={32} />

          <h2 className="mt-4 text-2xl font-black text-gray-950">
            Your Information Matters
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            Responsible handling of information is an important part of
            building a trustworthy educational platform.
          </p>
        </div>
      </section>
    </main>
  );
}