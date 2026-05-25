"use client";

const steps = [
  {
    number: "01",
    title: "Daftar & Pilih Materi",
    description: "Buat akun gratis dalam hitungan detik, lalu pilih materi sesuai kebutuhan CPNS-mu — TWK, TIU, atau TKP.",
    emoji: "🚀",
    color: "from-sky-500 to-cyan-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    numberColor: "text-sky-500",
  },
  {
    number: "02",
    title: "Tonton Video & Pelajari Materi",
    description: "Akses ratusan video interaktif dan bacaan materi yang disusun sistematis untuk memperkuat pemahamanmu.",
    emoji: "📚",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    numberColor: "text-purple-500",
  },
  {
    number: "03",
    title: "Kerjakan Soal & Pantau Progress",
    description: "Latihan dengan ribuan soal, ikuti ujian simulasi resmi, dan pantau perkembanganmu lewat dashboard analitik.",
    emoji: "🏆",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    numberColor: "text-amber-500",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 text-purple-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
            🎯 Cara Kerja
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Cara Belajar di{" "}
            <span className="bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
              EduHub
            </span>
          </h2>
          <p className="text-lg text-slate-600">
            Tiga langkah sederhana menuju kelulusan CPNS impianmu.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-200 via-purple-200 to-amber-200 -translate-y-1/2 z-0 mx-32" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="group flex flex-col items-center text-center">
                {/* Number badge */}
                <div className={`relative mb-6`}>
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <span className="text-2xl">{step.emoji}</span>
                  </div>
                  <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}>
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                </div>

                {/* Card */}
                <div className={`${step.bgColor} border ${step.borderColor} rounded-3xl p-7 w-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2`}>
                  <div className={`text-5xl font-black ${step.numberColor} opacity-10 mb-2 select-none`}>
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Connector arrow — mobile */}
                {i < steps.length - 1 && (
                  <div className="flex items-center justify-center mt-4 lg:hidden">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-sky-300 to-purple-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
