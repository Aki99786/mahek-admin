import { useEffect, useState } from "react";
import { me } from "@/http/Services/auth";
import { isLoggedIn, useUserDetailStore } from "@/store/store";

let probed = false;

/**
 * One-time session check at app start: refreshes user details from
 * GET /auth/me, or clears them when the cookie session is gone (401).
 * Returns true while the probe is in flight for a user who looks logged in.
 */
export function useSessionProbe() {
  const userDetail = useUserDetailStore((state) => state.userDetail);
  const setUserDetail = useUserDetailStore((state) => state.setUserDetail);
  const clearUserDetail = useUserDetailStore((state) => state.clearUserDetail);
  const [checking, setChecking] = useState(!probed && isLoggedIn(userDetail));

  useEffect(() => {
    if (probed) return;
    probed = true;

    if (!isLoggedIn(userDetail)) return;

    me()
      .then((res) => {
        const user = res?.data?.user;
        if (user) setUserDetail(user);
      })
      .catch(() => {
        // The api interceptor already clears the store on 401; be explicit.
        clearUserDetail();
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return checking;
}
