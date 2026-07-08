import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CartCheckoutButton from "./CartCheckoutButton";
import CartRemoveButton from "./CartRemoveButton";

const CartPage = async () => {
  const session = await getSession();
  if (session?.role !== "student") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Cart</h1>
        <p className="mt-4 text-sm text-gray-400">Please login as a student to view your cart.</p>
      </div>
    );
  }

  const items = await prisma.cart.findMany({
    where: { studentId: session.userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
          img: true,
          instructor: { select: { name: true } },
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = items.reduce((s, i) => s + i.course.price, 0);
  const enrolled = await prisma.enrollment.findMany({
    where: { studentId: session.userId },
    select: { courseId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.courseId));

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <h1 className="text-lg font-semibold">Shopping Cart ({items.length})</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link
            href="/browse"
            className="inline-block rounded-md bg-skillBlue px-6 py-2 text-sm font-semibold text-white hover:bg-skillBlue/90"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-3">
            {items.map((item) => {
              const avgRating = item.course.reviews.length
                ? item.course.reviews.reduce((s, r) => s + r.rating, 0) / item.course.reviews.length
                : 0;
              const alreadyEnrolled = enrolledIds.has(item.course.id);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 flex gap-4"
                >
                  <div className="w-40 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.course.img ? (
                      <img src={item.course.img} alt={item.course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/course/${item.course.id}`} className="font-semibold text-gray-900 hover:text-skillBlue line-clamp-1">
                      {item.course.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{item.course.instructor.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>⭐ {avgRating.toFixed(1)}</span>
                      <span>{item.course._count.enrollments} learners</span>
                      <span>{item.course._count.modules} modules</span>
                    </div>
                    {alreadyEnrolled && (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Already enrolled
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <CartRemoveButton courseId={item.course.id} />
                    <span className="font-bold text-lg text-gray-900">₹{item.course.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white p-6 sticky top-20">
              <h2 className="font-bold text-lg mb-4">Total</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="truncate mr-2">{item.course.title}</span>
                    <span className="font-medium shrink-0">₹{item.course.price}</span>
                  </div>
                ))}
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <CartCheckoutButton total={total} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
