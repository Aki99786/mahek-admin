import { isLoggedIn, useUserDetailStore } from "@/store/store";
import { Navigate, useLocation } from "react-router";
import LoadingSpinner from "@/shared-component/loading/LoadingSpinner";
import { useSessionProbe } from "./useSessionProbe";

const ProjectGuard = ({ children }: { children: React.ReactNode }) => {
  const userDetail = useUserDetailStore((state) => state.userDetail);
  const location = useLocation();
  const checking = useSessionProbe();

  if (checking) {
    return <LoadingSpinner />;
  }

  const loggedIn = isLoggedIn(userDetail);

  if (!loggedIn) {
    if (location.pathname !== "/auth/login") {
      return <Navigate to="/auth/login" replace />;
    }
    return children;
  }

  if (loggedIn && location.pathname === "/auth/login") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProjectGuard;
