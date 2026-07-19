const progress = [
  {
    title: "Noorani Qaida",
    value: 0,
  },
  {
    title: "Reading Quran",
    value: 0,
  },
  {
    title: "Tajweed",
    value: 0,
  },
];

export default function LearningProgress() {

  return (

    <div className="bg-white rounded-2xl shadow p-6">

      <h2 className="font-bold text-xl">

        Learning Progress

      </h2>

      <div className="space-y-6 mt-6">

        {progress.map((item) => (

          <div key={item.title}>

            <div className="flex justify-between mb-2">

              <span>{item.title}</span>

              <span>{item.value}%</span>

            </div>

            <div className="h-3 bg-gray-200 rounded-full">

              <div
                style={{ width: `${item.value}%` }}
                className="bg-green-600 h-3 rounded-full"
              />

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}