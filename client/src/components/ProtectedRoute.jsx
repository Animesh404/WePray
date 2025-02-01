import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, loading, isSubscribed } = useAuth();
    // console.log(isSubscribed);
    // const user = localStorage.get('user');
    const location = useLocation();
    // console.log("protected User", user);
    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isSubscribed && user.role !== 'admin') {
        return <Navigate to="/#subscription" replace />;    
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string)
};

ProtectedRoute.defaultProps = {
    roles: []
};

export default ProtectedRoute