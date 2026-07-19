import {
  BookOpen,
  CalendarDays,
  Award,
  GraduationCap,
} from "lucide-react";

const stats = [
  {
    title: "Enrolled Courses",
    value: "0",
    icon: BookOpen,
  },
  {
    title: "Upcoming Classes",
    value: "0",
    icon: CalendarDays,
  },
  {
    title: "Homework",
    value: "0",
    icon: GraduationCap,
  },
  {
    title: "Certificates",
    value: "0",
    icon: Award,
  },
];

export default function StatsCards() {
  return (
    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">

      {stats.map((item) => {

        const Icon = item.icon;

        return (

          <div
            key={item.title}
            className="bg-white rounded-2xl shadow p-6"
          >

            <div className="flex justify-between">

              <div>

                <p className="text-gray-500">

                  {item.title}

                </p>

                <h2 className="text-3xl font-bold mt-2">

                  {item.value}

                </h2>

              </div>

              <Icon
                className="text-green-600"
                size={40}
              />

            </div>

          </div>

        );

      })}

    </div>
  );
}