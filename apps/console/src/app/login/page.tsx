import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ConsoleOtpLogin } from "@/components/login/ConsoleOtpLogin";
import { isConsoleDevPreview } from "@/lib/devPreview";

async function signOutFromConsole() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function LoginPage() {
  const session = await auth();
  const preview = isConsoleDevPreview();
  const googleOAuthConfigured = Boolean(
    process.env["AUTH_GOOGLE_ID"]?.trim() && process.env["AUTH_GOOGLE_SECRET"]?.trim(),
  );

  if (session?.user?.role === "operator") {
    redirect("/review");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">OPUS Console</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with a one-time code sent to your email. Only accounts with the OPERATOR role in the shared database
          can receive a code.
        </p>
        {session?.user ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Signed in as {session.user.email ?? "user"}, but this account is not an operator. Ask an administrator to
              grant OPERATOR in the database.
            </p>
            <form action={signOutFromConsole}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-2 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : null}
        {preview ? (
          <div className="mt-6 space-y-3">
            <Link
              href="/review"
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Open layout preview (no sign-in)
            </Link>
            <p className="text-center text-xs text-gray-500">
              Set <code className="rounded bg-gray-100 px-1">OPUS_CONSOLE_DEV_PREVIEW=1</code> in{" "}
              <code className="rounded bg-gray-100 px-1">.env.local</code> (development only).
            </p>
          </div>
        ) : null}
        {!session?.user ? <ConsoleOtpLogin googleOAuthConfigured={googleOAuthConfigured} /> : null}
        <p className="mt-6 text-center text-xs text-gray-400">
          New accounts must complete signup on the{" "}
          <a className="text-blue-600 underline" href={process.env["OPUS_STORE_PUBLIC_ORIGIN"] ?? "#"}>
            public site
          </a>{" "}
          first.
        </p>
      </div>
    </div>
  );
}
