import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSupabaseSession(request: NextRequest) {
  const config = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/sales")) {
    return NextResponse.next({ request });
  }

  if (!config.isConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isLoginPage = pathname === "/sales/login";

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/sales/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/sales";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
