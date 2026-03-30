(function () {
  function readProfile() {
    var params = new URLSearchParams(window.location.search || '');
    var email = params.get('email') || localStorage.getItem('standalone_email') || '';
    var studentId = params.get('student_id') || localStorage.getItem('standalone_student_id') || email || '';
    var studentName = params.get('student_name') || localStorage.getItem('standalone_student_name') || '';

    if (!studentName) {
      var firstName = localStorage.getItem('standalone_first_name') || '';
      var lastName = localStorage.getItem('standalone_last_name') || '';
      studentName = [firstName, lastName].filter(Boolean).join(' ').trim() || email || studentId || '';
    }

    if (email) localStorage.setItem('standalone_email', email);
    if (studentId) localStorage.setItem('standalone_student_id', studentId);
    if (studentName) localStorage.setItem('standalone_student_name', studentName);

    return {
      email: email,
      student_id: studentId,
      student_name: studentName,
    };
  }

  function ensureBody(body) {
    var profile = readProfile();
    if (!profile.student_id) return body;

    if (body == null) {
      return {
        student_id: profile.student_id,
        student_name: profile.student_name || '',
      };
    }

    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      if (!body.get('student_id')) body.set('student_id', profile.student_id);
      if (!body.get('student_name')) body.set('student_name', profile.student_name || '');
      return body;
    }

    if (typeof body === 'string') {
      try {
        var data = JSON.parse(body);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (!data.student_id) data.student_id = profile.student_id;
          if (!data.student_name) data.student_name = profile.student_name || '';
          return JSON.stringify(data);
        }
      } catch (e) {}
      return body;
    }

    if (body && typeof body === 'object') {
      if (!body.student_id) body.student_id = profile.student_id;
      if (!body.student_name) body.student_name = profile.student_name || '';
      return body;
    }

    return body;
  }

  function isTarget(url) {
    if (!url) return false;
    url = String(url);
    return (
      url.indexOf('/dialog') !== -1 ||
      url.indexOf('/poll') !== -1 ||
      url.indexOf('/final-recommendations') !== -1
    );
  }

  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (isTarget(url)) {
          init = init || {};
          init.body = ensureBody(init.body);
          if (typeof init.body === 'string') {
            init.headers = init.headers || {};
            if (!init.headers['Content-Type'] && !init.headers['content-type']) {
              init.headers['Content-Type'] = 'application/json';
            }
          }
        }
      } catch (e) {}
      return originalFetch.call(this, input, init);
    };
  }

  if (window.XMLHttpRequest) {
    var open = XMLHttpRequest.prototype.open;
    var send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__standalone_url = url;
      return open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      try {
        if (isTarget(this.__standalone_url)) {
          body = ensureBody(body);
        }
      } catch (e) {}
      return send.call(this, body);
    };
  }

  window.STANDALONE_PROFILE = readProfile();
})();
