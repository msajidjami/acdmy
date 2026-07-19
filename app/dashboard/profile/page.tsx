import WelcomeHero from "@/app/components/dashboard/WelcomeHero";
import StatsCards from "@/app/components/dashboard/StatsCards";
import QuickActions from "@/app/components/dashboard/QuickActions";
import UpcomingClasses from "@/app/components/dashboard/UpcomingClasses";
import LearningProgress from "@/app/components/dashboard/LearningProgress";

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      <WelcomeHero />

      <StatsCards />

      <div className="grid lg:grid-cols-2 gap-8">

        <UpcomingClasses />

        <LearningProgress />

      </div>

      <QuickActions />

    </div>
  );
}