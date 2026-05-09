const colors = require('colors'); // Change import to require

const logger = (req, res, next) => {
    const methodColors = {
        GET: 'green',
        POST: 'yellow',
        PUT: 'blue',
        DELETE: 'red'
    };
    const color = methodColors[req.method] || 'white';

    console.log(`${req.method} ${req.protocol} : ${req.get('host')} ${req.originalUrl}`[color]);
    next();
};

module.exports = logger; // Change export default to module.exports