import { isLoggedIn, useUserDetailStore } from "@/store/store";
import { Navigate } from "react-router";
import LoadingSpinner from "@/shared-component/loading/LoadingSpinner";
import { useSessionProbe } from "./useSessionProbe";

const AuthGuard = ({ children }: any) => {
  const userDetail = useUserDetailStore((state) => state.userDetail);
  const checking = useSessionProbe();

  if (checking) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn(userDetail)) {
    return <Navigate to={"/auth/login"} />;
  }

  return children;
};

export default AuthGuard;
