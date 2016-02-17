var Sequelize = require('sequelize');

// Define your models --- SEQUELIZE ---
var database = new Sequelize('postgres://postgres:adm123@localhost:5432/manage-lite-rest');
var Role = database.define('Role', {
    name : {
        type : Sequelize.STRING,
        allowNull : false
    },
    enabled : {
        type : Sequelize.BOOLEAN,
        allowNull : false,
        defaultValue : true
    }
});

var Settings = database.define('Settings', {
    theme : {
        type : Sequelize.STRING,
        allowNull : false
    }
});

var Collaborator = database.define('Collaborators', {
    email : {
        type : Sequelize.STRING,
        allowNull : false,
        unique : true,
        validate : {
            isEmail : true
        }
    },
    name : {
        type : Sequelize.STRING
    },
    username : {
        type : Sequelize.STRING,
        allowNull : false,
        unique : true
    },
    enabled : {
        type : Sequelize.BOOLEAN,
        allowNull : false,
        defaultValue : true
    }
});

var Project = database.define('Projects', {
    name : {
        type : Sequelize.STRING,
        allowNull : false,
        unique : true
    },
    archived : {
        type : Sequelize.BOOLEAN,
        allowNull : false,
        defaultValue : false
    }
});

var Sprint = database.define('Sprints', {
    name : {
        type : Sequelize.STRING,
        allowNull : false,
        unique : true
    },
    startsAt : {
        type : Sequelize.DATE
    },
    endsAt : {
        type : Sequelize.DATE
    }
});

Role.hasOne(Collaborator, {
    as : 'DefaultRole'
});
Project.hasMany(Sprint, {
    as : 'Sprints'
});

module.exports = {
    database : database,
    Role : Role,
    Settings : Settings,
    Collaborator : Collaborator,
    Project : Project,
    Sprint : Sprint
};