/*
* Copyright (c) 2011 Eran Hammer-Lahav. All rights reserved. Copyrights licensed under the New BSD License.
* See LICENSE file included with this code project for license terms.
*/

// Load modules

var Hapi = require('hapi');
var Db = require('./db');
var Project = require('./project');
var User = require('./user');
var Stream = require('./stream');


// Check invitation code

exports.get = {
    
    auth: {

        mode: 'none'
    },

    handler: function (request) {

        // Check invitation code type

        var inviteRegex = /^project:([^:]+):([^:]+):([^:]+)$/;
        var parts = inviteRegex.exec(request.params.id);

        if (parts &&
            parts.length === 4) {

            // Project invitation code

            var projectId = parts[1];
            var pid = parts[2];
            var code = parts[3];

            // Load project (not using Project.load since active user is not a member)

            Db.get('project', projectId, function (project, err) {

                if (project) {

                    // Lookup code

                    var projectPid = null;

                    for (var i = 0, il = project.participants.length; i < il; ++i) {

                        if (project.participants[i].pid &&
                            project.participants[i].pid === pid) {

                            if (project.participants[i].code &&
                                project.participants[i].code === code) {

                                projectPid = project.participants[i];
                                break;
                            }
                            else {

                                // Invalid code
                                break;
                            }
                        }
                    }

                    if (projectPid) {

                        User.quick(projectPid.inviter, function (inviter) {

                            var about = { title: project.title, project: project._id };

                            if (inviter &&
                                inviter.display) {

                                about.inviter = inviter.display;
                            }

                            request.reply(about);
                        });
                    }
                    else {

                        request.reply(Hapi.Error.badRequest('Invalid invitation code'));
                    }
                }
                else {

                    request.reply(err);
                }
            });
        }
        else {

            // Registration invitation code

            exports.load(request.params.id, function (invite, err) {

                if (err === null) {

                    request.reply(invite);
                }
                else {

                    request.reply(err);
                }
            });
        }
    }
};


// Claim a project invitation

exports.claim = {
    
    handler: function (request) {

        var inviteRegex = /^project:([^:]+):([^:]+):([^:]+)$/;
        var parts = inviteRegex.exec(request.params.id);

        if (parts &&
            parts.length === 4) {

            var projectId = parts[1];
            var pid = parts[2];
            var code = parts[3];

            // Load project (not using Project.load since active user is not a member)

            Db.get('project', projectId, function (project, err) {

                if (project) {

                    // Lookup code

                    var projectPid = null;

                    for (var i = 0, il = project.participants.length; i < il; ++i) {

                        if (project.participants[i].pid &&
                            project.participants[i].pid === pid) {

                            if (project.participants[i].code &&
                                project.participants[i].code === code) {

                                projectPid = project.participants[i];
                                break;
                            }
                            else {

                                // Invalid code
                                break;
                            }
                        }
                    }

                    if (projectPid) {

                        Project.replacePid(project, projectPid.pid, request.session.user, function (err) {

                            if (err === null) {

                                Stream.update({ object: 'project', project: projectId }, request);
                                request.reply({ status: 'ok', project: projectId });
                            }
                            else {

                                request.reply(err);
                            }
                        });
                    }
                    else {

                        request.reply(Hapi.Error.badRequest('Invalid invitation code'));
                    }
                }
                else {

                    request.reply(err);
                }
            });
        }
        else {

            request.reply(Hapi.Error.badRequest('Invalid invitation format'));
        }
    }
};


// Load invitation

exports.load = function (code, callback) {

    Db.queryUnique('invite', { code: code }, function (invite, err) {

        //    { "_id": "4d8629d32d0cba57313953b4",
        //      "code": "emu2011",
        //      "notes": "Eran's friends",
        //      "count": 0,
        //      "limit": 10,
        //      "expires" : 1332173847002 }

        if (err === null) {

            if (invite) {

                // Check expiration

                if ((invite.expires || Infinity) > Date.now()) {

                    // Check count

                    if (invite.limit === undefined ||
                        invite.count === undefined ||
                        invite.count <= invite.limit) {

                        callback(invite, null);
                    }
                    else {

                        callback(null, Hapi.Error.badRequest('Invitation code reached limit'));
                    }
                }
                else {

                    callback(null, Hapi.Error.badRequest('Invitation Code expired'));
                }
            }
            else {

                callback(null, Hapi.Error.notFound('Invitation code not found'));
            }
        }
        else {

            callback(null, err);
        }
    });
};




