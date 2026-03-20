/**
 * Boto Simulator LMS Adapter (SCORM 2004 4th Edition)
 * Mocks iSpring LMS API for compatibility with WebSoft LMS.
 */

(function (window) {

function readStandaloneProfile() {
    try {
        var params = new URLSearchParams(window.location.search || '');
        var storedStudentId = localStorage.getItem('standalone_student_id') || '';
        var storedStudentName = localStorage.getItem('standalone_student_name') || '';
        var storedEmail = localStorage.getItem('standalone_email') || '';
        var storedFirstName = localStorage.getItem('standalone_first_name') || '';
        var storedLastName = localStorage.getItem('standalone_last_name') || '';

        var studentId = params.get('student_id') || params.get('email') || storedStudentId || storedEmail || '';
        var email = params.get('email') || storedEmail || studentId || '';
        var fallbackName = [storedFirstName, storedLastName].filter(Boolean).join(' ').trim();
        var studentName = params.get('student_name') || storedStudentName || fallbackName || email || studentId || '';

        if (studentId) {
            localStorage.setItem('standalone_student_id', studentId);
            localStorage.setItem('standalone_email', email || studentId);
        }
        if (studentName) {
            localStorage.setItem('standalone_student_name', studentName);
        }

        return {
            studentId: studentId || null,
            studentName: studentName || null,
            email: email || null
        };
    } catch (e) {
        return { studentId: null, studentName: null, email: null };
    }
}

    // Internal API finder (SCORM 2004)
    function findSCORMAPI(win) {
        var attempts = 0;
        while ((!win.API_1484_11) && (win.parent) && (win.parent !== win) && (attempts <= 10)) {
            attempts++;
            win = win.parent;
        }
        return win.API_1484_11;
    }

    // SCORM 1.2 fallback
    function findSCORM12API(win) {
        var attempts = 0;
        while ((!win.API) && (win.parent) && (win.parent !== win) && (attempts <= 10)) {
            attempts++;
            win = win.parent;
        }
        return win.API;
    }

    // The actual SCORM Logic Implementation
    var SCORM_IMPL = {
        api: null,
        version: '2004',
        initialized: false,
        params: null,
        standalone: false,

        initialize: function (params) {
            this.params = params;
            this.version = (params && params.scorm2004) ? '2004' : '1.2';
            this.standalone = false;

            try {
                var win = window;

                if (this.version === '2004') {
                    this.api = findSCORMAPI(win);
                    if (!this.api && window.opener) this.api = findSCORMAPI(window.opener);
                    // Fallback to SCORM 1.2 if 2004 API not found
                    if (!this.api) {
                        this.api = findSCORM12API(win);
                        if (!this.api && window.opener) this.api = findSCORM12API(window.opener);
                        if (this.api) {
                            this.version = '1.2';
                            console.log('[LMS] SCORM 2004 API not found, falling back to 1.2');
                        }
                    }
                } else {
                    this.api = findSCORM12API(win);
                    if (!this.api && window.opener) this.api = findSCORM12API(window.opener);
                    // Fallback to SCORM 2004 if 1.2 API not found
                    if (!this.api) {
                        this.api = findSCORMAPI(win);
                        if (!this.api && window.opener) this.api = findSCORMAPI(window.opener);
                        if (this.api) {
                            this.version = '2004';
                            console.log('[LMS] SCORM 1.2 API not found, falling back to 2004');
                        }
                    }
                }

                if (!this.api) {
                    var standaloneProfile = readStandaloneProfile();
                    console.log('[LMS] API not found - standalone mode');
                    this.standalone = true;
                    this.initialized = !!standaloneProfile.studentId;
                    return this.initialized;
                }

                var result = (this.version === '2004') ? this.api.Initialize('') : this.api.LMSInitialize('');

                if (result.toString() === 'true') {
                    this.initialized = true;
                    this.setStatus('incomplete');
                    console.log('[LMS] Initialized (' + this.version + ')');
                    return true;
                }
                return false;
            } catch (e) {
                console.warn('[LMS] Init failed:', e);
                return false;
            }
        },

        setStatus: function (status) {
            if (this.standalone) return;
            if (!this.initialized) return;
            try {
                if (this.version === '2004') {
                    if (status === 'passed' || status === 'failed') {
                        this.api.SetValue('cmi.success_status', status);
                        this.api.SetValue('cmi.completion_status', 'completed');
                    } else {
                        this.api.SetValue('cmi.completion_status', status);
                        this.api.SetValue('cmi.success_status', 'unknown');
                    }
                    this.api.Commit('');
                } else {
                    this.api.LMSSetValue('cmi.core.lesson_status', status);
                    this.api.LMSCommit('');
                }
            } catch (e) { console.error(e); }
        },

        setScore: function (score, maxScore, minScore) {
            if (this.standalone) return;
            if (!this.initialized) return;
            maxScore = maxScore || (this.params ? this.params.totalScore : 100);
            minScore = minScore || 0;

            try {
                if (this.version === '2004') {
                    var scaled = Math.min(Math.max(score / maxScore, 0), 1);
                    this.api.SetValue('cmi.score.raw', score.toString());
                    this.api.SetValue('cmi.score.min', minScore.toString());
                    this.api.SetValue('cmi.score.max', maxScore.toString());
                    this.api.SetValue('cmi.score.scaled', scaled.toFixed(4));
                    this.api.Commit('');
                } else {
                    this.api.LMSSetValue('cmi.core.score.raw', score.toString());
                    this.api.LMSSetValue('cmi.core.score.max', maxScore.toString());
                    this.api.LMSSetValue('cmi.core.score.min', minScore.toString());
                    this.api.LMSCommit('');
                }
            } catch (e) { console.error(e); }
        },

        getStudentId: function () {
            if (this.standalone) {
                return readStandaloneProfile().studentId;
            }
            if (!this.initialized || !this.api) return null;
            try {
                if (this.version === '2004') {
                    return this.api.GetValue('cmi.learner_id') || null;
                } else {
                    return this.api.LMSGetValue('cmi.core.student_id') || null;
                }
            } catch (e) { return null; }
        },

        getStudentName: function () {
            if (this.standalone) {
                return readStandaloneProfile().studentName;
            }
            if (!this.initialized || !this.api) return null;
            try {
                if (this.version === '2004') {
                    return this.api.GetValue('cmi.learner_name') || null;
                } else {
                    return this.api.LMSGetValue('cmi.core.student_name') || null;
                }
            } catch (e) { return null; }
        },

        terminate: function () {
            if (this.standalone) {
                this.initialized = false;
                return;
            }
            if (!this.initialized) return;
            try {
                if (this.version === '2004') {
                    this.api.SetValue('cmi.exit', 'normal'); // or suspend
                    this.api.Terminate('');
                } else {
                    this.api.LMSFinish('');
                }
                this.initialized = false;
            } catch (e) { console.error(e); }
        }
    };

    // Mock iSpring LMS Object
    function iSpringLMS(id, version, params) {
        this.id = id;
        this.version = version;
        this.params = params;
    }

    iSpringLMS.prototype.initialize = function (callback) {
        var success = SCORM_IMPL.initialize(this.params);
        if (callback) callback();
        return success;
    };

    iSpringLMS.prototype.start = function (player) {
        // Mock start method, usually connects player events to LMS
        console.log('[LMS] iSpringLMS.start called');
    };

    iSpringLMS.prototype.closeLms = function () {
        SCORM_IMPL.terminate();
    };

    // Additional methods expected by some LMSs
    iSpringLMS.prototype.commit = function () {
        if (SCORM_IMPL.initialized && SCORM_IMPL.api) {
            if (SCORM_IMPL.version === '2004') {
                SCORM_IMPL.api.Commit('');
            } else {
                SCORM_IMPL.api.LMSCommit('');
            }
        }
    };

    // Global iSpring Namespace
    window.iSpring = window.iSpring || {};
    window.iSpring.LMS = {
        create: function (id, version, params) {
            console.log('[LMS] iSpring.LMS.create called with:', id, version, params);
            var instance = new iSpringLMS(id, version, params);

            // Expose the implementation for our React app to use
            window.LMS_API = {
                initialize: function () { return true; }, // Already initialized by index.html/player.html
                isAvailable: function () { return SCORM_IMPL.initialized; },
                setStatus: function (s) { SCORM_IMPL.setStatus(s); },
                setScore: function (s, max) { SCORM_IMPL.setScore(s, max); },
                finish: function () { SCORM_IMPL.terminate(); },
                getStudentId: function () { return SCORM_IMPL.getStudentId(); },
                getStudentName: function () { return SCORM_IMPL.getStudentName(); }
            };

            return instance;
        },
        instance: function () {
            // Return the last created instance or a dummy
            return new iSpringLMS("dummy", "2004", {});
        }
    };

    // Mock iSpring.LMSAPI for compatibility checks
    window.iSpring.LMSAPI = {
        Scorm2004Api: function () { },
        Scorm12Api: function () { }
    };

})(window);
