import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PropTypes from "prop-types";

const PrivateRoute = ({ roles = [] }) => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Rôles définis et que l'utilisateur n'est pas autorisé
    if (roles.length > 0 && !roles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

PrivateRoute.propTypes = {
    roles: PropTypes.func.isRequired,
};

export default PrivateRoute;
