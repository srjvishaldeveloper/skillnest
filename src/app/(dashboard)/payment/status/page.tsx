import Link from "next/link";
import prisma from "@/lib/prisma";
import { confirmOrder, type ConfirmResult } from "@/lib/payments";
import { confirmCartCheckout } from "@/lib/cartActions";
import ScreenshotUpload from "@/components/payment/ScreenshotUpload";

const PaymentStatusPage = async ({
  searchParams,
}: {
  searchParams: { txn?: string };
}) => {
  const txn = searchParams.txn;

  // check order details
  let manualPayment = false;
  let manualStatus = "PENDING";
  let hasScreenshot = false;
  let isCartCheckout = false;
  let cartSuccess = false;
  if (txn) {
    isCartCheckout = txn.startsWith("SNCART");

    const order = await prisma.order.findUnique({
      where: { merchantTxnId: txn },
      select: { paymentMethod: true, status: true, paymentProof: true },
    });
    if (order) {
      hasScreenshot = !!order.paymentProof;
      if (order.paymentMethod === "BANK_TRANSFER") {
        manualPayment = true;
        manualStatus = order.status;
      }
    }
  }

  let result: ConfirmResult | null = null;
  if (txn && !manualPayment) {
    if (isCartCheckout) {
      const cartResult = await confirmCartCheckout(txn);
      cartSuccess = cartResult.success;
      result = {
        status: cartResult.success ? "PAID" : cartResult.pending ? "PENDING" : "FAILED",
      };
    } else {
      result = await confirmOrder(txn);
    }
  } else if (manualPayment) {
    result = {
      status: manualStatus as any,
    };
  } else {
    result = { status: "NOTFOUND" };
  }

  const ui = {
    PAID: {
      icon: "🎉",
      color: "text-skillGreen",
      title: isCartCheckout ? "All courses purchased!" : "Payment successful!",
      sub: manualPayment
        ? "Admin has confirmed your payment. Start learning!"
        : isCartCheckout
        ? "You're enrolled in all courses. Start learning!"
        : "You're enrolled. Time to start learning.",
    },
    PENDING: {
      icon: "⏳",
      color: "text-skillYellow",
      title: "Payment pending",
      sub: manualPayment
        ? "Your payment proof has been submitted. Admin will confirm it shortly."
        : "We haven't received confirmation yet. If money was deducted, it will reflect shortly.",
    },
    FAILED: {
      icon: "❌",
      color: "text-red-500",
      title: "Payment failed",
      sub: "Your payment could not be completed.",
    },
    NOTFOUND: {
      icon: "🔍",
      color: "text-gray-500",
      title: "Order not found",
      sub: "We couldn't find this transaction.",
    },
  }[result.status];

  return (
    <div className="m-4 mt-0 flex flex-1 items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">{ui.icon}</div>
        <h1 className={`mt-3 text-xl font-bold ${ui.color}`}>{ui.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{ui.sub}</p>

        {result.status === "PAID" && hasScreenshot && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            ✅ Payment screenshot uploaded. Admin will verify your payment.
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          {result.status === "PAID" ? (
            <Link
              href={isCartCheckout ? "/my-learning" : result?.courseId ? `/learn/${result.courseId}` : "/my-learning"}
              className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
            >
              Start Learning
            </Link>
          ) : result.status === "PENDING" && txn ? (
            <Link
              href={`/payment/status?txn=${txn}`}
              className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
            >
              Refresh Status
            </Link>
          ) : (
            <Link
              href="/browse"
              className="rounded-md bg-skillBlue px-5 py-2 text-sm font-semibold text-white"
            >
              Back to Courses
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusPage;
