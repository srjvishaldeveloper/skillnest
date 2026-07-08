import prisma from "@/lib/prisma";

export default async function AdminChallengesPage() {
  const challenges = await prisma.dailyChallenge.findMany({
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
      participants: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 30,
  });

  return (
    <div className="p-6 flex-1">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-skillDark">Daily Challenges</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage daily coding challenges</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Problem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Difficulty</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">XP Reward</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Participants</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(c.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-skillDark">{c.problem.title}</span>
                    <div className="text-xs text-gray-400">/{c.problem.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.problem.difficulty === "EASY" ? "bg-green-50 text-green-600" :
                      c.problem.difficulty === "MEDIUM" ? "bg-yellow-50 text-yellow-600" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {c.problem.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{c.xpReward} XP</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{c.participants.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {challenges.length === 0 && (
            <div className="text-center py-12 text-gray-400">No daily challenges configured.</div>
          )}
        </div>
      </div>
    </div>
  );
}
