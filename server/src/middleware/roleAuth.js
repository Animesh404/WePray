const roleAuth = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
 };
 
 const roles = {
    ADMIN: 'admin',
    COORDINATOR: 'coordinator', 
    MODERATOR: 'moderator',
    MEMBER: 'member'
 };
 
 module.exports = { roleAuth, roles };