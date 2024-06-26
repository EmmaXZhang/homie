//Outlet is what we want to return if user is login

import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = () => {
  const { userData } = useSelector((state) => state.auth);
  return userData ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
