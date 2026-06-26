function requiereSesion(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    next();
}

function requiereTecnico(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    if (req.session.usuario.CT_Rol !== 'Tecnico') {
        return res.redirect('/dashboard');
    }

    next();
}

function requiereSolicitante(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    if (req.session.usuario.CT_Rol !== 'Solicitante') {
        return res.redirect('/dashboard');
    }

    next();
}

module.exports = {
    requiereSesion,
    requiereTecnico,
    requiereSolicitante
};