var Sequelize = require('sequelize');

// Define your models --- SEQUELIZE ---
var database = new Sequelize('postgres://postgres:adm123@localhost:5432/manage-lite-rest');
var Role = database.define('roles', {
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

var Settings = database.define('settings', {
    theme : {
        type : Sequelize.STRING,
        allowNull : false
    }
});

var Collaborator = database.define('collaborators', {
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

var Project = database.define('projects', {
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

var Sprint = database.define('sprints', {
    name : {
        type : Sequelize.STRING,
        allowNull : false,
        //unique : true
    },
    start : {
        type : Sequelize.DATE
    },
    end : {
        type : Sequelize.DATE
    }
});

var Story = database.define('stories', {
    title : {
        type : Sequelize.STRING,
        allowNull : false,
        unique : true
    },
    description : {
        type : Sequelize.TEXT
    }
});

Role.hasOne(Collaborator, {
    as : 'role'
});
Project.hasMany(Sprint, {
    as : 'sprints'
});
Sprint.belongsTo(Project);
Sprint.hasMany(Story, {
    as : 'stories'
});
Story.belongsTo(Sprint);
Project.hasMany(Story, {
    as : 'stories'
});
Story.belongsTo(Project);

module.exports = {
    database : database,
    Role : Role,
    Settings : Settings,
    Collaborator : Collaborator,
    Project : Project,
    Sprint : Sprint,
    Story: Story
};