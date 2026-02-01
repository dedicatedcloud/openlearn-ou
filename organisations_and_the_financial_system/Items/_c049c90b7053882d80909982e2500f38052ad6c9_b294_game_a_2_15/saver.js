/* uses JQuery */

var Saver = function() {
    this.online = false;
    this.localStorage = (typeof Storage !== 'undefined');
    this.activityId = '';
    this.itemId = '';
    this.courseId = '';
    this.saveMsg = document.getElementById('save-msg') || null;

    this.retrieve = function(cfg) {
        if (this.online) {
            this.retrieveDataFromVLE(cfg);
        } else {
            if (this.localStorage) {
                var outObj = {};
                var name, item, p;

                for (p in cfg.names) {
                    if (cfg.names.hasOwnProperty(p)) {
                        name = cfg.names[p];
                        item = localStorage.getItem(this.activity_id + name);

                        if (item === null) {
                            outObj[name] = '';
                        } else {
                            outObj[name] = decodeURIComponent(item);
                        }
                    }
                }

                cfg.callback(outObj);
                console.log('Retrieved ' + ((cfg.user) ? 'user' : 'group') + ' data: ', outObj);
            }
        }
    };

    this.retrieveDataFromVLE = function(cfg) {
        var user = (cfg.user !== false);
        var ok = function(data) {
            var outObj = {};

            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    outObj[k] = decodeURIComponent(data[k]);
                }
            }

            cfg.callback(outObj);
            console.log('Retrieved ' + ((user) ? 'user' : 'group') + ' data: ', outObj);
        };
        var error = function(msg) {
            if (msg !== null) {
                console.log(msg);
            }

            cfg.callback({});
            console.log('get_server_data has failed.');
        };

        //console.log('Data to be retreived: ' + cfg.names);
        VLE.get_server_data(user, cfg.names, ok, error, this.activityId, this.itemId, this.courseId);
    };

    this.save = function(cfg) {
        var saveObj = {};
        if (this.saveMsg !== null) {
            $(this.saveMsg)
                .fadeIn(1000, function() {
                    $(this).fadeOut();
                })
                .css('display', 'inline-block');
        }

        /*for (var p in cfg.values) {
            if (cfg.values.hasOwnProperty(p)) {
                saveObj[p] = encodeURIComponent(cfg.values[p]);
            }
        }*/
        //delete saveObj.previous;
        saveObj = cfg.values;
        //console.log("in this.save ", saveObj)

        console.log(((cfg.user) ? 'User' : 'Group') + ' data to be saved: ', cfg.values);

        if (this.online) {
            this.saveDataToVLE(saveObj, cfg);
        } else { /* don't use local storage unless offline */
            if (this.localStorage) {
                //TODO alert message on first save - Any data saved in this context will only be available later on this device. Continue?
                for (p in saveObj) {
                    if (saveObj.hasOwnProperty(p)) {
                        localStorage.setItem(this.activity_id + p, saveObj[p]);
                    }
                }
                cfg.callback(true);
            } else {
                cfg.callback(false);
                $(this.saveMsg).text('cannot save offline');
            }
        }
    };

    this.saveDataToVLE = function(saveObj, cfg) {
        var user = (cfg.user !== false);
        var ok = function() {
            cfg.callback(true);
            console.log('set_server_data (' + (user ? 'user' : 'group') + ') was successful');
        };
        var error = function(msg) {
            if (msg !== null) {
                console.log(msg);
            }
            cfg.callback(false);
            console.log('set_server_data has failed');
        };
        var previousValues = cfg.previous;
        var retry = cfg.retry || null;

        //console.log("IN SAVEDATATOVLE: ", saveObj, previousValues);

        VLE.set_server_data(user, saveObj, ok, error, previousValues, retry, this.activityId, this.itemId, this.courseId);
    };

    this.makeIdFromOrigin = function() {
        var theId = '';
        var theOrigin, i;

        /*
            takes the alpha-numeric characters from the origin and pathname and uses
            them to make an 'activity id' which should be safe for use with the VLE
        */
        if (!window.location.origin) { /* i.e. IE */
            window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }

        theOrigin = window.location.origin + window.location.pathname;

        for (i = 0; i < theOrigin.length; i++) {
            if (theOrigin.charCodeAt(i) > 96 && theOrigin.charCodeAt(i) < 123) {
                theId += theOrigin.charAt(i);
            }
        }
        for (i = 0; i < theOrigin.length; i++) {
            if (theOrigin.charCodeAt(i) > 64 && theOrigin.charCodeAt(i) < 91) {
                theId += theOrigin.charAt(i);
            }
        }
        for (i = 0; i < theOrigin.length; i++) {
            if (theOrigin.charCodeAt(i) > 47 && theOrigin.charCodeAt(i) < 58) {
                theId += theOrigin.charAt(i);
            }
        }

        // since this id is only to be used for local storage it can be more than 20 characters
        return theId;
    };

    if (VLE.serverversion === true) {
        this.online = true;
        this.activityId = VLE.get_param('activityId') || VLE.get_param('_a');
        this.itemId = VLE.get_param('documentId') || VLE.get_param('_i');
        this.courseId = VLE.get_param('courseId') || VLE.get_param('_c');
    } else {
        this.activity_id = this.makeIdFromOrigin();
    }

    /*return {
        save: this.save,
        retrieve: this.retrieve
    };*/

    return this;
};