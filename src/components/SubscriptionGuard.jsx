import { Navigate } from "react-router-dom";

const allowedRoles = ["HR", "MANAGER", "OWNER"];

export default function SubscriptionGuard({ user, subscription, children }) {

  if (!allowedRoles.includes(user?.role)) {
    return <h3>❌ You are not allowed to access AI features</h3>;
  }

  if (!subscription?.is_active) {
    return <Navigate to="/subscriptions" />;
  }

  return children;
}
