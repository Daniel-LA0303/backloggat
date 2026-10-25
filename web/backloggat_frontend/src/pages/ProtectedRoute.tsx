import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAtuh";


export default function ProtectedRoute() {

    const {user} = useAuth();

    return user === null
        ? <Navigate to="/login" />
        : <Outlet />
}